import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY; // Using Anon key, ensure RLS allows insert or use Service Role key if needed

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuration
const SOURCE_JSON_PATH = path.join(__dirname, 'src/source-data/recipes.json');
const IMAGE_BASE_DIR = path.join(__dirname, 'src/source-data/ExportBlock-253ab654-e7da-4d6b-b076-1012669e1b57-Part-1/Recipes');
const BUCKET_NAME = 'recipe-images';

// Status Mapping
const STATUS_MAP = {
    'can try': 'New',
    'done': 'Done',
    'Half done': 'Half-done'
};

// Categories to ignore
const IGNORED_STATUSES = ['to be improved', 'Archive', 'dessert', ''];

async function migrateRecipes() {
    console.log('Starting migration...');

    // 1. Read Source Data
    const rawData = fs.readFileSync(SOURCE_JSON_PATH, 'utf8');
    const recipes = JSON.parse(rawData);
    console.log(`Loaded ${recipes.length} recipes from JSON.`);

    // 2. Filter and Transform
    const validRecipes = recipes.filter(r => {
        // Filter by status
        if (!r.done || IGNORED_STATUSES.includes(r.done)) return false;
        return true;
    });

    console.log(`Found ${validRecipes.length} valid recipes to migrate.`);

    let successCount = 0;
    let errorCount = 0;

    for (const recipe of validRecipes) {
        try {
            console.log(`Processing: ${recipe.name}`);

            // Map Status
            const status = STATUS_MAP[recipe.done] || 'New'; // Default to New if unknown but not ignored

            // Handle Image Upload
            let coverImageUrl = null;
            if (recipe.coverImage) {
                // Clean path: remove leading '/recipes/'
                // Example: "/recipes/煎三文魚/Untitled 1.png" -> "煎三文魚/Untitled 1.png"
                const relativePath = recipe.coverImage.replace(/^\/recipes\//, '');

                // The export structure seems to be Recipes/[RecipeName]/[ImageName]
                // We need to decode URI components because filenames on disk are likely not encoded
                const decodedPath = decodeURIComponent(relativePath);
                const localImagePath = path.join(IMAGE_BASE_DIR, decodedPath);

                // Check if file exists at the constructed path
                let foundPath = null;

                // Path 1: Direct match in Recipes folder
                if (fs.existsSync(localImagePath)) {
                    foundPath = localImagePath;
                }
                // Path 2: Check inside "今天吃什麽？" subfolder
                else {
                    const nestedPath = path.join(IMAGE_BASE_DIR, '今天吃什麽？', decodedPath);
                    if (fs.existsSync(nestedPath)) {
                        foundPath = nestedPath;
                    }
                }

                if (foundPath) {
                    const fileBuffer = fs.readFileSync(foundPath);
                    const fileExt = path.extname(foundPath);
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;
                    const storagePath = `covers/${fileName}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from(BUCKET_NAME)
                        .upload(storagePath, fileBuffer, {
                            contentType: getContentType(fileExt),
                            upsert: true
                        });

                    if (uploadError) {
                        console.error(`  Image upload failed for ${recipe.name}:`, uploadError.message);
                    } else {
                        const { data: publicUrlData } = supabase.storage
                            .from(BUCKET_NAME)
                            .getPublicUrl(storagePath);
                        coverImageUrl = publicUrlData.publicUrl;
                        console.log(`  Image uploaded: ${coverImageUrl}`);
                    }
                } else {
                    // Try to find the file in the recipe directory if exact match fails
                    // This handles cases where the folder name matches but the filename might be slightly different or just to be safe
                    const recipeDirName = path.dirname(decodedPath);
                    const imageFileName = path.basename(decodedPath);

                    // Search locations
                    const searchDirs = [
                        path.join(IMAGE_BASE_DIR, recipeDirName),
                        path.join(IMAGE_BASE_DIR, '今天吃什麽？', recipeDirName)
                    ];

                    let fuzzyFoundFile = null;

                    for (const dir of searchDirs) {
                        if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
                            const files = fs.readdirSync(dir);
                            const foundFile = files.find(f => f === imageFileName || decodeURIComponent(f) === imageFileName);
                            if (foundFile) {
                                fuzzyFoundFile = path.join(dir, foundFile);
                                break;
                            }
                        }
                    }

                    if (fuzzyFoundFile) {
                        const fileBuffer = fs.readFileSync(fuzzyFoundFile);
                        const fileExt = path.extname(fuzzyFoundFile);
                        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;
                        const storagePath = `covers/${fileName}`;

                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from(BUCKET_NAME)
                            .upload(storagePath, fileBuffer, {
                                contentType: getContentType(fileExt),
                                upsert: true
                            });

                        if (!uploadError) {
                            const { data: publicUrlData } = supabase.storage
                                .from(BUCKET_NAME)
                                .getPublicUrl(storagePath);
                            coverImageUrl = publicUrlData.publicUrl;
                            console.log(`  Image uploaded (fuzzy match): ${coverImageUrl}`);
                        }
                    } else {
                        console.warn(`  Local image not found: ${localImagePath} (checked nested folder too)`);
                    }
                }
            }

            // Insert Recipe
            const { data: insertedRecipe, error: insertError } = await supabase
                .from('recipes')
                .insert({
                    title: recipe.name,
                    // description removed as requested
                    status: status,
                    cover_image_url: coverImageUrl
                })
                .select()
                .single();

            if (insertError) {
                throw new Error(`DB Insert failed: ${insertError.message}`);
            }

            console.log(`  Migrated as ID: ${insertedRecipe.id}`);

            // Handle Ingredients (Simple matching for now)
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                // This part requires existing ingredients in DB to link against.
                // For now, we'll just log them as we don't have a reliable way to match names yet without fetching all ingredients.
                // In a real run, we would fetch all ingredients first and create a map.
                console.log(`  Has ${recipe.ingredients.length} ingredients (skipping linking for now)`);
            }

            successCount++;
        } catch (err) {
            console.error(`  Failed to migrate ${recipe.name}:`, err.message);
            errorCount++;
        }
    }

    console.log('------------------------------------------------');
    console.log(`Migration Complete.`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
}

function getContentType(ext) {
    switch (ext.toLowerCase()) {
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.webp': return 'image/webp';
        default: return 'application/octet-stream';
    }
}

migrateRecipes();
