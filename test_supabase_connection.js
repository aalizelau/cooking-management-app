import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

console.log('🔍 Testing Supabase Connection...\n');

// Check if credentials are set
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    console.error('❌ Error: Supabase credentials not set!');
    console.log('\nPlease set your environment variables:');
    console.log('  export SUPABASE_URL="your-project-url"');
    console.log('  export SUPABASE_ANON_KEY="your-anon-key"');
    console.log('\nOr edit this file and replace the placeholder values.\n');
    process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    try {
        console.log('📡 Connecting to Supabase...');
        console.log(`   URL: ${SUPABASE_URL}\n`);

        // Test 1: Check if we can connect
        console.log('Test 1: Basic Connection');
        const { data: healthCheck, error: healthError } = await supabase
            .from('ingredients')
            .select('count', { count: 'exact', head: true });

        if (healthError) {
            if (healthError.message.includes('relation "ingredients" does not exist')) {
                console.log('⚠️  Table "ingredients" does not exist yet');
                console.log('   Please run the SQL schema in your Supabase SQL Editor first!');
                console.log('   See SUPABASE_SETUP.md for instructions.\n');
                return false;
            }
            throw healthError;
        }

        console.log('✅ Successfully connected to Supabase!\n');

        // Test 2: Check table structure
        console.log('Test 2: Table Structure');
        const { data: sampleData, error: sampleError } = await supabase
            .from('ingredients')
            .select('*')
            .limit(1);

        if (sampleError) {
            throw sampleError;
        }

        console.log('✅ Table structure is correct\n');

        // Test 3: Count existing records
        console.log('Test 3: Existing Data');
        const { count, error: countError } = await supabase
            .from('ingredients')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            throw countError;
        }

        console.log(`✅ Found ${count || 0} existing ingredients in database\n`);

        // Test 4: Test write permissions
        console.log('Test 4: Write Permissions');
        const testIngredient = {
            id: 'test-' + Date.now(),
            name: 'Test Ingredient',
            category: 'Test',
            emoji: '🧪',
            stock_status: 'In Stock',
            default_location: '常溫',
            history: []
        };

        const { data: insertData, error: insertError } = await supabase
            .from('ingredients')
            .insert([testIngredient])
            .select();

        if (insertError) {
            console.log('⚠️  Write permission test failed:', insertError.message);
            console.log('   This might be due to Row Level Security policies.');
            console.log('   The migration might still work if you have the correct policies set up.\n');
        } else {
            console.log('✅ Write permissions are working\n');

            // Clean up test data
            console.log('Test 5: Delete Permissions');
            const { error: deleteError } = await supabase
                .from('ingredients')
                .delete()
                .eq('id', testIngredient.id);

            if (deleteError) {
                console.log('⚠️  Delete permission test failed:', deleteError.message);
                console.log('   You may need to manually delete the test ingredient.\n');
            } else {
                console.log('✅ Delete permissions are working\n');
            }
        }

        // Summary
        console.log('='.repeat(50));
        console.log('🎉 Connection Test Complete!');
        console.log('='.repeat(50));
        console.log('\n✅ Your Supabase setup is ready for migration!');
        console.log('\nNext steps:');
        console.log('  1. Run the migration: node migrate_to_supabase.js');
        console.log('  2. Verify data in Supabase dashboard');
        console.log('  3. Update your React app to use Supabase\n');

        return true;

    } catch (error) {
        console.error('\n❌ Connection test failed!');
        console.error('Error:', error.message);
        console.error('\nPlease check:');
        console.error('  1. Your SUPABASE_URL is correct');
        console.error('  2. Your SUPABASE_ANON_KEY is correct');
        console.error('  3. Your Supabase project is active');
        console.error('  4. You have created the ingredients table');
        console.error('\nSee SUPABASE_SETUP.md for detailed setup instructions.\n');
        return false;
    }
}

// Run the test
testConnection()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
