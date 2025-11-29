import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
// You'll need to set these environment variables or replace with your actual values
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Create the ingredients table in Supabase
 * Run this SQL in your Supabase SQL Editor first, or uncomment the code below
 */
const TABLE_SCHEMA = `
-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  emoji TEXT,
  stock_status TEXT,
  default_location TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on stock_status for faster queries
CREATE INDEX IF NOT EXISTS idx_ingredients_stock_status ON ingredients(stock_status);

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_ingredients_updated_at ON ingredients;
CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth requirements)
-- For now, allow all operations for authenticated users
CREATE POLICY "Enable read access for all users" ON ingredients
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON ingredients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users only" ON ingredients
    FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable delete for authenticated users only" ON ingredients
    FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
`;

/**
 * Transform ingredient data from local format to Supabase format
 */
function transformIngredient(ingredient) {
    return {
        id: ingredient.id,
        name: ingredient.name,
        category: ingredient.category,
        emoji: ingredient.emoji,
        stock_status: ingredient.stockStatus,
        default_location: ingredient.defaultLocation,
        history: ingredient.history || []
    };
}

/**
 * Upload ingredients to Supabase in batches
 */
async function uploadIngredients(ingredients, batchSize = 100) {
    console.log(`📦 Preparing to upload ${ingredients.length} ingredients...`);

    const transformedIngredients = ingredients.map(transformIngredient);
    const batches = [];

    // Split into batches
    for (let i = 0; i < transformedIngredients.length; i += batchSize) {
        batches.push(transformedIngredients.slice(i, i + batchSize));
    }

    console.log(`📊 Split into ${batches.length} batches of ${batchSize} items each`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Upload each batch
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\n⏳ Uploading batch ${i + 1}/${batches.length}...`);

        try {
            const { data, error } = await supabase
                .from('ingredients')
                .upsert(batch, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`❌ Error in batch ${i + 1}:`, error.message);
                errorCount += batch.length;
                errors.push({ batch: i + 1, error: error.message });
            } else {
                successCount += batch.length;
                console.log(`✅ Batch ${i + 1} uploaded successfully (${batch.length} items)`);
            }
        } catch (err) {
            console.error(`❌ Exception in batch ${i + 1}:`, err.message);
            errorCount += batch.length;
            errors.push({ batch: i + 1, error: err.message });
        }

        // Add a small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return { successCount, errorCount, errors };
}

/**
 * Verify the upload by counting records in Supabase
 */
async function verifyUpload() {
    console.log('\n🔍 Verifying upload...');

    const { count, error } = await supabase
        .from('ingredients')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error verifying upload:', error.message);
        return null;
    }

    return count;
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('🚀 Starting migration to Supabase...\n');

    // Check Supabase configuration
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('❌ Error: Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
        console.log('\nYou can set them by running:');
        console.log('export SUPABASE_URL="your-project-url"');
        console.log('export SUPABASE_ANON_KEY="your-anon-key"');
        console.log('\nOr edit this file and replace the placeholder values.');
        process.exit(1);
    }

    // Read the ingredients file
    const ingredientsPath = path.join(__dirname, 'ingredients_with_history.json');

    if (!fs.existsSync(ingredientsPath)) {
        console.error(`❌ Error: File not found: ${ingredientsPath}`);
        process.exit(1);
    }

    let ingredients;
    try {
        const fileContent = fs.readFileSync(ingredientsPath, 'utf-8');
        ingredients = JSON.parse(fileContent);
        console.log(`✅ Successfully loaded ${ingredients.length} ingredients from file\n`);
    } catch (err) {
        console.error('❌ Error reading ingredients file:', err.message);
        process.exit(1);
    }

    // Display table schema
    console.log('📋 Table Schema:');
    console.log('================');
    console.log(TABLE_SCHEMA);
    console.log('\n⚠️  Please run the above SQL in your Supabase SQL Editor before proceeding!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    // Wait 5 seconds to give user time to read
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Upload ingredients
    const { successCount, errorCount, errors } = await uploadIngredients(ingredients);

    // Display results
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Results:');
    console.log('='.repeat(50));
    console.log(`✅ Successfully uploaded: ${successCount} ingredients`);
    console.log(`❌ Failed: ${errorCount} ingredients`);

    if (errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        errors.forEach(({ batch, error }) => {
            console.log(`   Batch ${batch}: ${error}`);
        });
    }

    // Verify upload
    const totalCount = await verifyUpload();
    if (totalCount !== null) {
        console.log(`\n✅ Verification: ${totalCount} total ingredients in Supabase`);
    }

    console.log('\n🎉 Migration complete!');
}

// Run migration
migrate().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
