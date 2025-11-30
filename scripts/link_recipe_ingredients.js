import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function linkRecipeIngredients() {
    console.log('🚀 Starting recipe-ingredient linkage migration...');

    // 1. Read local recipes.json
    const recipesPath = path.join(__dirname, '../src/source-data/recipes.json');
    const rawData = fs.readFileSync(recipesPath, 'utf-8');
    const localRecipes = JSON.parse(rawData);

    // Filter recipes that have ingredients
    const recipesWithIngredients = localRecipes.filter(r => r.ingredients && r.ingredients.length > 0);
    console.log(`Found ${recipesWithIngredients.length} local recipes with ingredients.`);

    if (recipesWithIngredients.length === 0) {
        console.log('No recipes with ingredients to migrate.');
        return;
    }

    // 2. Fetch all ingredients from Supabase
    console.log('Fetching ingredients from Supabase...');
    const { data: dbIngredients, error: ingError } = await supabase
        .from('ingredients')
        .select('id, name');

    if (ingError) {
        console.error('Error fetching ingredients:', ingError);
        return;
    }

    // Create a map for case-insensitive lookup: name.toLowerCase() -> id
    const ingredientMap = new Map();
    dbIngredients.forEach(ing => {
        ingredientMap.set(ing.name.toLowerCase().trim(), ing.id);
    });
    console.log(`Loaded ${dbIngredients.length} ingredients from DB.`);

    // 3. Fetch all recipes from Supabase
    console.log('Fetching recipes from Supabase...');
    const { data: dbRecipes, error: recipeError } = await supabase
        .from('recipes')
        .select('id, title');

    if (recipeError) {
        console.error('Error fetching recipes:', recipeError);
        return;
    }

    // Create a map for case-insensitive lookup: title.toLowerCase() -> id
    const recipeMap = new Map();
    dbRecipes.forEach(r => {
        recipeMap.set(r.title.toLowerCase().trim(), r.id);
    });
    console.log(`Loaded ${dbRecipes.length} recipes from DB.`);

    // 4. Prepare links
    const linksToInsert = [];
    const missingIngredients = new Set();
    const missingRecipes = new Set();

    for (const localRecipe of recipesWithIngredients) {
        const recipeName = localRecipe.name.toLowerCase().trim();
        const recipeId = recipeMap.get(recipeName);

        if (!recipeId) {
            missingRecipes.add(localRecipe.name);
            continue;
        }

        for (const ing of localRecipe.ingredients) {
            const ingName = ing.name.toLowerCase().trim();
            const ingId = ingredientMap.get(ingName);

            if (!ingId) {
                missingIngredients.add(ing.name);
                continue;
            }

            linksToInsert.push({
                recipe_id: recipeId,
                ingredient_id: ingId
            });
        }
    }

    console.log(`Prepared ${linksToInsert.length} links to insert.`);

    if (missingRecipes.size > 0) {
        console.warn('⚠️ Could not find the following recipes in Supabase:', Array.from(missingRecipes));
    }
    if (missingIngredients.size > 0) {
        console.warn('⚠️ Could not find the following ingredients in Supabase:', Array.from(missingIngredients));
    }

    if (linksToInsert.length === 0) {
        console.log('No valid links found to insert.');
        return;
    }

    // 5. Insert links
    // Group links by recipe_id to perform clean updates
    const linksByRecipe = new Map();
    for (const link of linksToInsert) {
        if (!linksByRecipe.has(link.recipe_id)) {
            linksByRecipe.set(link.recipe_id, []);
        }
        linksByRecipe.get(link.recipe_id).push(link);
    }

    console.log(`Processing ${linksByRecipe.size} recipes...`);

    for (const [recipeId, links] of linksByRecipe) {
        // Delete existing links for this recipe
        const { error: deleteError } = await supabase
            .from('recipe_ingredients')
            .delete()
            .eq('recipe_id', recipeId);

        if (deleteError) {
            console.error(`Error clearing links for recipe ${recipeId}:`, deleteError);
            continue;
        }

        // Insert new links
        const { error: insertError } = await supabase
            .from('recipe_ingredients')
            .insert(links);

        if (insertError) {
            console.error(`Error inserting links for recipe ${recipeId}:`, insertError);
        } else {
            console.log(`✅ Linked ${links.length} ingredients to recipe ${recipeId}`);
        }
    }

    console.log('Migration completed.');
}

linkRecipeIngredients();
