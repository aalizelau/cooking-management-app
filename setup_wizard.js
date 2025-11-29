#!/usr/bin/env node

/**
 * Interactive Supabase Setup Wizard
 * This script helps you set up Supabase step by step
 */

import readline from 'readline';
import fs from 'fs';
import { execSync } from 'child_process';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function printHeader(text) {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${text}`);
    console.log('='.repeat(60) + '\n');
}

function printStep(number, text) {
    console.log(`\n📍 Step ${number}: ${text}`);
    console.log('-'.repeat(60));
}

async function main() {
    console.clear();

    printHeader('🚀 Supabase Migration Setup Wizard');

    console.log('This wizard will help you:');
    console.log('  1. Set up your Supabase credentials');
    console.log('  2. Test your connection');
    console.log('  3. Run the migration');
    console.log('\nLet\'s get started!\n');

    const ready = await question('Press Enter to continue...');

    // Step 1: Check if Supabase project exists
    printStep(1, 'Supabase Project Setup');
    console.log('Do you have a Supabase project set up?');
    console.log('If not, go to https://supabase.com and create one.\n');

    const hasProject = await question('Do you have a Supabase project? (y/n): ');

    if (hasProject.toLowerCase() !== 'y') {
        console.log('\n📝 Please create a Supabase project first:');
        console.log('   1. Go to https://supabase.com');
        console.log('   2. Sign up or log in');
        console.log('   3. Click "New Project"');
        console.log('   4. Fill in the details and create');
        console.log('   5. Wait for initialization (~2 minutes)');
        console.log('\nRun this wizard again when your project is ready!');
        rl.close();
        return;
    }

    // Step 2: Get credentials
    printStep(2, 'Get Your Credentials');
    console.log('In your Supabase dashboard:');
    console.log('  1. Click the gear icon (Project Settings)');
    console.log('  2. Go to "API" section');
    console.log('  3. Copy your Project URL and anon/public key\n');

    const url = await question('Enter your Supabase URL: ');
    const key = await question('Enter your Supabase anon key: ');

    if (!url || !key) {
        console.log('\n❌ Both URL and key are required!');
        rl.close();
        return;
    }

    // Step 3: Save credentials
    printStep(3, 'Saving Credentials');

    const envContent = `# Supabase Configuration
SUPABASE_URL=${url.trim()}
SUPABASE_ANON_KEY=${key.trim()}

# For Vite (React app)
VITE_SUPABASE_URL=${url.trim()}
VITE_SUPABASE_ANON_KEY=${key.trim()}
`;

    fs.writeFileSync('.env', envContent);
    fs.writeFileSync('.env.local', envContent);

    console.log('✅ Credentials saved to .env and .env.local');

    // Step 4: Check if table exists
    printStep(4, 'Database Table Setup');
    console.log('Have you created the "ingredients" table in Supabase?\n');
    console.log('If not, you need to run this SQL in your Supabase SQL Editor:');
    console.log('(See SUPABASE_SETUP.md Step 3 for the full SQL)\n');

    const hasTable = await question('Have you created the ingredients table? (y/n): ');

    if (hasTable.toLowerCase() !== 'y') {
        console.log('\n📝 Please create the table first:');
        console.log('   1. In Supabase dashboard, go to SQL Editor');
        console.log('   2. Click "New Query"');
        console.log('   3. Copy the SQL from SUPABASE_SETUP.md (Step 3)');
        console.log('   4. Click "Run"');
        console.log('\nRun this wizard again after creating the table!');
        rl.close();
        return;
    }

    // Step 5: Test connection
    printStep(5, 'Testing Connection');
    console.log('Testing your Supabase connection...\n');

    try {
        // Set environment variables for the test
        process.env.SUPABASE_URL = url.trim();
        process.env.SUPABASE_ANON_KEY = key.trim();

        execSync('node test_supabase_connection.js', {
            stdio: 'inherit',
            env: process.env
        });

        console.log('\n✅ Connection test passed!');
    } catch (error) {
        console.log('\n❌ Connection test failed!');
        console.log('Please check your credentials and try again.');
        console.log('See SUPABASE_SETUP.md for troubleshooting.\n');
        rl.close();
        return;
    }

    // Step 6: Run migration
    printStep(6, 'Ready to Migrate');

    // Count ingredients
    let ingredientCount = 0;
    try {
        const data = JSON.parse(fs.readFileSync('ingredients_with_history.json', 'utf-8'));
        ingredientCount = data.length;
    } catch (err) {
        console.log('⚠️  Could not read ingredients_with_history.json');
    }

    console.log(`Found ${ingredientCount} ingredients to upload.\n`);
    console.log('This will upload your ingredients data to Supabase.');
    console.log('The migration is safe to run multiple times (uses upsert).\n');

    const runMigration = await question('Run migration now? (y/n): ');

    if (runMigration.toLowerCase() === 'y') {
        console.log('\n🚀 Starting migration...\n');

        try {
            execSync('node migrate_to_supabase.js', {
                stdio: 'inherit',
                env: process.env
            });

            printHeader('🎉 Setup Complete!');
            console.log('Your ingredients have been uploaded to Supabase!\n');
            console.log('Next steps:');
            console.log('  1. Verify data in Supabase dashboard (Table Editor)');
            console.log('  2. Update your React app to use Supabase');
            console.log('     See SUPABASE_INTEGRATION.md for instructions\n');
            console.log('  3. Enjoy multi-device sync and real-time updates! 🚀\n');

        } catch (error) {
            console.log('\n❌ Migration failed!');
            console.log('Check the error messages above.');
            console.log('See SUPABASE_SETUP.md for troubleshooting.\n');
        }
    } else {
        console.log('\nMigration skipped. You can run it later with:');
        console.log('  export $(cat .env | xargs) && node migrate_to_supabase.js\n');
    }

    rl.close();
}

main().catch(error => {
    console.error('Error:', error);
    rl.close();
    process.exit(1);
});
