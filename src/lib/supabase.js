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

/**
 * Shopping Cart helper functions
 */

// Get or create a unique device ID
function getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

/**
 * Fetch all cart items from Supabase
 */
export async function fetchCartItems() {
    const { data, error } = await supabase
        .from('shopping_cart')
        .select('ingredient_id')
        .order('added_at', { ascending: true });

    if (error) {
        console.error('Error fetching cart items:', error);
        throw error;
    }

    // Return array of ingredient IDs
    return data.map(item => item.ingredient_id);
}

/**
 * Add an item to the cart
 */
export async function addToCartDB(ingredientId) {
    const deviceId = getDeviceId();

    // Check if item already exists in cart
    const { data: existing } = await supabase
        .from('shopping_cart')
        .select('id')
        .eq('ingredient_id', ingredientId)
        .maybeSingle();

    if (existing) {
        console.log('Item already in cart');
        return true;
    }

    const { error } = await supabase
        .from('shopping_cart')
        .insert([{
            ingredient_id: ingredientId,
            device_id: deviceId
        }]);

    if (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }

    return true;
}

/**
 * Remove an item from the cart
 */
export async function removeFromCartDB(ingredientId) {
    const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .eq('ingredient_id', ingredientId);

    if (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }

    return true;
}

/**
 * Clear all items from the cart
 */
export async function clearCartDB() {
    const { error } = await supabase
        .from('shopping_cart')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
        console.error('Error clearing cart:', error);
        throw error;
    }

    return true;
}

/**
 * Subscribe to real-time changes on shopping_cart table
 */
export function subscribeToCart(callback) {
    const subscription = supabase
        .channel('cart_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'shopping_cart'
            },
            (payload) => {
                console.log('Cart real-time update:', payload);
                callback(payload);
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        subscription.unsubscribe();
    };
}
