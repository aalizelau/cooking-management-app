import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that credentials are set
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Database helper functions for ingredients
 */

/**
 * Fetch all ingredients from Supabase
 */
export async function fetchIngredients() {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching ingredients:', error);
        throw error;
    }

    // Transform from database format to app format
    return data.map(transformFromDB);
}

/**
 * Fetch a single ingredient by ID
 */
export async function fetchIngredientById(id) {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching ingredient:', error);
        throw error;
    }

    return transformFromDB(data);
}

/**
 * Create a new ingredient
 */
export async function createIngredient(ingredient) {
    const dbIngredient = transformToDB(ingredient);

    const { data, error } = await supabase
        .from('ingredients')
        .insert([dbIngredient])
        .select()
        .single();

    if (error) {
        console.error('Error creating ingredient:', error);
        throw error;
    }

    return transformFromDB(data);
}

/**
 * Update an existing ingredient
 */
export async function updateIngredient(id, updates) {
    const dbUpdates = transformToDB(updates);

    const { data, error } = await supabase
        .from('ingredients')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating ingredient:', error);
        throw error;
    }

    return transformFromDB(data);
}

/**
 * Delete an ingredient
 */
export async function deleteIngredient(id) {
    const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting ingredient:', error);
        throw error;
    }

    return true;
}

/**
 * Fetch ingredients by stock status
 */
export async function fetchIngredientsByStatus(stockStatus) {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('stock_status', stockStatus)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching ingredients by status:', error);
        throw error;
    }

    return data.map(transformFromDB);
}

/**
 * Fetch ingredients by category
 */
export async function fetchIngredientsByCategory(category) {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching ingredients by category:', error);
        throw error;
    }

    return data.map(transformFromDB);
}

/**
 * Search ingredients by name
 */
export async function searchIngredients(searchTerm) {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error searching ingredients:', error);
        throw error;
    }

    return data.map(transformFromDB);
}

/**
 * Subscribe to real-time changes on ingredients table
 */
export function subscribeToIngredients(callback) {
    const subscription = supabase
        .channel('ingredients_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'ingredients'
            },
            (payload) => {
                console.log('Real-time update:', payload);
                callback(payload);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        subscription.unsubscribe();
    };
}

/**
 * Transform ingredient from database format to app format
 */
function transformFromDB(dbIngredient) {
    return {
        id: dbIngredient.id,
        name: dbIngredient.name,
        category: dbIngredient.category,
        emoji: dbIngredient.emoji,
        stockStatus: dbIngredient.stock_status,
        defaultLocation: dbIngredient.default_location,
        history: dbIngredient.history || []
    };
}

/**
 * Transform ingredient from app format to database format
 */
function transformToDB(appIngredient) {
    const dbIngredient = {
        name: appIngredient.name,
        category: appIngredient.category,
        emoji: appIngredient.emoji,
        stock_status: appIngredient.stockStatus,
        default_location: appIngredient.defaultLocation,
        history: appIngredient.history || []
    };

    // Only include id if it exists (for updates)
    if (appIngredient.id) {
        dbIngredient.id = appIngredient.id;
    }

    return dbIngredient;
}
