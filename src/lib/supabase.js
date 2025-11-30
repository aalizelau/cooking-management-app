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
        .select('ingredient_id, is_checked')
        .order('added_at', { ascending: true });

    if (error) {
        console.error('Error fetching cart items:', error);
        throw error;
    }

    // Return array of cart items with checked state
    return data.map(item => ({
        ingredientId: item.ingredient_id,
        isChecked: item.is_checked || false
    }));
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
            device_id: deviceId,
            is_checked: false
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
 * Update the checked state of a cart item
 */
export async function updateCartItemChecked(ingredientId, isChecked) {
    const { error } = await supabase
        .from('shopping_cart')
        .update({ is_checked: isChecked })
        .eq('ingredient_id', ingredientId);

    if (error) {
        console.error('Error updating cart item checked state:', error);
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
/**
 * Recipe helper functions
 */

/**
 * Helper function to extract storage file path from a Supabase Storage URL
 * @param {string} imageUrl - Full Supabase Storage URL
 * @returns {string|null} - The file path (e.g., "covers/123.jpg") or null if not a storage URL
 */
function extractStoragePathFromUrl(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return null;
    }

    // Check if it's a Supabase Storage URL
    const storagePattern = /\/storage\/v1\/object\/public\/recipe-images\/(.+)$/;
    const match = imageUrl.match(storagePattern);

    if (match && match[1]) {
        return match[1]; // Returns "covers/filename.jpg"
    }

    return null; // Not a storage URL (could be Base64 or external URL)
}

/**
 * Upload recipe cover image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} recipeId - The recipe ID to use in the filename
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function uploadRecipeImage(file, recipeId) {
    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Error uploading image:', error);
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

    return publicUrl;
}

/**
 * Delete a recipe image from Supabase Storage
 * @param {string} imageUrl - The full URL of the image to delete
 * @returns {Promise<boolean>} - True if deleted, false if skipped
 */
export async function deleteRecipeImage(imageUrl) {
    const filePath = extractStoragePathFromUrl(imageUrl);

    // Only delete if it's a storage URL
    if (!filePath) {
        console.log('Not a storage URL, skipping deletion:', imageUrl);
        return false;
    }

    const { error } = await supabase.storage
        .from('recipe-images')
        .remove([filePath]);

    if (error) {
        console.error('Error deleting image from storage:', error);
        // Don't throw - we still want to delete the recipe even if image deletion fails
        return false;
    }

    console.log('✅ Image deleted from storage:', filePath);
    return true;
}

/**
 * Fetch ingredient IDs linked to a specific recipe
 */
export async function fetchRecipeIngredients(recipeId) {
    const { data, error } = await supabase
        .from('recipe_ingredients')
        .select('ingredient_id, quantity')
        .eq('recipe_id', recipeId);

    if (error) {
        console.error('Error fetching recipe ingredients:', error);
        throw error;
    }

    // Return array of ingredient IDs
    return data.map(item => item.ingredient_id);
}

/**
 * Sync recipe ingredients - replaces all existing links with new ones
 */
export async function syncRecipeIngredients(recipeId, ingredientIds) {
    try {
        // First, delete all existing links for this recipe
        const { error: deleteError } = await supabase
            .from('recipe_ingredients')
            .delete()
            .eq('recipe_id', recipeId);

        if (deleteError) {
            console.error('Error deleting old recipe ingredients:', deleteError);
            throw deleteError;
        }

        // If no ingredients to link, we're done
        if (!ingredientIds || ingredientIds.length === 0) {
            console.log('✅ All recipe ingredients removed');
            return true;
        }

        // Insert new links
        const linksToInsert = ingredientIds.map(ingredientId => ({
            recipe_id: recipeId,
            ingredient_id: ingredientId,
            quantity: null // Can be enhanced later
        }));

        const { error: insertError } = await supabase
            .from('recipe_ingredients')
            .insert(linksToInsert);

        if (insertError) {
            console.error('Error inserting recipe ingredients:', insertError);
            throw insertError;
        }

        console.log(`✅ Synced ${ingredientIds.length} ingredients to recipe ${recipeId}`);
        return true;
    } catch (error) {
        console.error('Failed to sync recipe ingredients:', error);
        throw error;
    }
}

/**
 * Fetch all recipes from Supabase
 */
export async function fetchRecipes() {
    const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching recipes:', error);
        throw error;
    }

    // Fetch ingredient links for all recipes
    const recipesWithIngredients = await Promise.all(
        data.map(async (recipe) => {
            try {
                const ingredientIds = await fetchRecipeIngredients(recipe.id);
                return transformRecipeFromDB(recipe, ingredientIds);
            } catch (err) {
                console.error(`Failed to fetch ingredients for recipe ${recipe.id}:`, err);
                return transformRecipeFromDB(recipe, []);
            }
        })
    );

    return recipesWithIngredients;
}

/**
 * Create a new recipe
 */
export async function createRecipe(recipe) {
    const dbRecipe = transformRecipeToDB(recipe);

    const { data, error } = await supabase
        .from('recipes')
        .insert([dbRecipe])
        .select()
        .single();

    if (error) {
        console.error('Error creating recipe:', error);
        throw error;
    }

    return transformRecipeFromDB(data);
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(id, updates) {
    const dbUpdates = transformRecipeToDB(updates);

    const { data, error } = await supabase
        .from('recipes')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating recipe:', error);
        throw error;
    }

    return transformRecipeFromDB(data);
}

/**
 * Delete a recipe and its associated image from storage
 */
export async function deleteRecipe(id) {
    try {
        // First, fetch the recipe to get the image URL
        const { data: recipe, error: fetchError } = await supabase
            .from('recipes')
            .select('cover_image_url')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('Error fetching recipe before deletion:', fetchError);
            throw fetchError;
        }

        // Delete the image from storage if it exists
        if (recipe && recipe.cover_image_url) {
            await deleteRecipeImage(recipe.cover_image_url);
        }

        // Then delete the recipe from the database
        const { error: deleteError } = await supabase
            .from('recipes')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting recipe from database:', deleteError);
            throw deleteError;
        }

        console.log('✅ Recipe and associated image deleted successfully');
        return true;
    } catch (error) {
        console.error('Failed to delete recipe:', error);
        throw error;
    }
}

/**
 * Transform recipe from database format to app format
 */
function transformRecipeFromDB(dbRecipe, linkedIngredientIds = []) {
    return {
        id: dbRecipe.id,
        title: dbRecipe.title,
        status: dbRecipe.status,
        image: dbRecipe.cover_image_url, // Map cover_image_url to image for frontend compatibility
        description: "", // Description column removed, returning empty string
        ingredients: [], // Text ingredients (if we add later)
        steps: dbRecipe.instructions || [], // Map DB instructions to frontend steps
        thoughts: dbRecipe.thoughts || "", // Map thoughts
        linkedIngredientIds: linkedIngredientIds // Now populated from junction table!
    };
}

/**
 * Transform recipe from app format to database format
 */
function transformRecipeToDB(appRecipe) {
    const dbRecipe = {
        title: appRecipe.title,
        status: appRecipe.status,
        cover_image_url: appRecipe.image,
        instructions: appRecipe.steps, // Map frontend steps to DB instructions
        thoughts: appRecipe.thoughts
    };

    // Only include id if it exists (for updates)
    if (appRecipe.id) {
        dbRecipe.id = appRecipe.id;
    }

    return dbRecipe;
}
