import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    fetchIngredients,
    createIngredient,
    updateIngredient as updateIngredientDB,
    deleteIngredient,
    subscribeToIngredients,
    fetchCartItems,
    addToCartDB,
    removeFromCartDB,
    updateCartItemChecked,
    updateCartItemListType,
    clearCartDB,
    subscribeToCart,
    fetchRecipes,
    createRecipe,
    updateRecipe as updateRecipeDB,
    deleteRecipe,
    syncRecipeIngredients,
    fetchRecipeIngredients
} from '../lib/supabase';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // State
    const [ingredients, setIngredients] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [cart, setCart] = useState([]); // Shopping list
    const [wishlist, setWishlist] = useState([]); // Want to buy list

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [syncing, setSyncing] = useState(false);

    // Load ingredients and cart from Supabase on mount
    useEffect(() => {
        loadIngredientsFromSupabase();
        loadCartFromSupabase();
        loadWishlistFromSupabase();
    }, []);

    // Subscribe to real-time updates from Supabase (ingredients)
    useEffect(() => {
        const unsubscribe = subscribeToIngredients((payload) => {
            console.log('Real-time update received:', payload.eventType);

            if (payload.eventType === 'INSERT') {
                const newIngredient = transformFromDB(payload.new);
                setIngredients(prev => {
                    // Avoid duplicates
                    if (prev.some(ing => ing.id === newIngredient.id)) {
                        return prev;
                    }
                    return [...prev, newIngredient];
                });
            } else if (payload.eventType === 'UPDATE') {
                const updatedIngredient = transformFromDB(payload.new);
                setIngredients(prev =>
                    prev.map(ing => ing.id === updatedIngredient.id ? updatedIngredient : ing)
                );
            } else if (payload.eventType === 'DELETE') {
                setIngredients(prev => prev.filter(ing => ing.id !== payload.old.id));
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Subscribe to real-time updates from Supabase (cart and wishlist)
    useEffect(() => {
        const unsubscribe = subscribeToCart((payload) => {
            console.log('Cart real-time update:', payload.eventType);
            const listType = payload.new?.list_type || payload.old?.list_type;

            if (payload.eventType === 'INSERT') {
                const newItem = {
                    ingredientId: payload.new.ingredient_id,
                    isChecked: payload.new.is_checked || false
                };

                if (listType === 'wishlist') {
                    setWishlist(prev => {
                        if (!prev.some(item => item.ingredientId === newItem.ingredientId)) {
                            return [...prev, newItem];
                        }
                        return prev;
                    });
                } else {
                    setCart(prev => {
                        if (!prev.some(item => item.ingredientId === newItem.ingredientId)) {
                            return [...prev, newItem];
                        }
                        return prev;
                    });
                }
            } else if (payload.eventType === 'UPDATE') {
                const newListType = payload.new.list_type;
                const oldListType = payload.old?.list_type;
                const ingredientId = payload.new.ingredient_id;

                // Check if item moved between lists
                if (newListType !== oldListType) {
                    // Remove from old list
                    if (oldListType === 'wishlist') {
                        setWishlist(prev => prev.filter(item => item.ingredientId !== ingredientId));
                    } else {
                        setCart(prev => prev.filter(item => item.ingredientId !== ingredientId));
                    }

                    // Add to new list
                    const newItem = {
                        ingredientId: payload.new.ingredient_id,
                        isChecked: payload.new.is_checked || false
                    };

                    if (newListType === 'wishlist') {
                        setWishlist(prev => [...prev, newItem]);
                    } else {
                        setCart(prev => [...prev, newItem]);
                    }
                } else {
                    // Just update checked state within same list
                    const updatedItem = {
                        ingredientId: payload.new.ingredient_id,
                        isChecked: payload.new.is_checked || false
                    };

                    if (newListType === 'wishlist') {
                        setWishlist(prev =>
                            prev.map(item =>
                                item.ingredientId === updatedItem.ingredientId ? updatedItem : item
                            )
                        );
                    } else {
                        setCart(prev =>
                            prev.map(item =>
                                item.ingredientId === updatedItem.ingredientId ? updatedItem : item
                            )
                        );
                    }
                }
            } else if (payload.eventType === 'DELETE') {
                const ingredientId = payload.old.ingredient_id;
                if (listType === 'wishlist') {
                    setWishlist(prev => prev.filter(item => item.ingredientId !== ingredientId));
                } else {
                    setCart(prev => prev.filter(item => item.ingredientId !== ingredientId));
                }
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);



    // Cache cart to localStorage as backup
    useEffect(() => {
        localStorage.setItem('cart_cache', JSON.stringify(cart));
    }, [cart]);

    // Cache wishlist to localStorage as backup
    useEffect(() => {
        localStorage.setItem('wishlist_cache', JSON.stringify(wishlist));
    }, [wishlist]);

    // Cache ingredients to localStorage as backup
    useEffect(() => {
        if (ingredients.length > 0) {
            localStorage.setItem('ingredients_cache', JSON.stringify(ingredients));
        }
    }, [ingredients]);

    // Load ingredients from Supabase
    async function loadIngredientsFromSupabase() {
        try {
            setLoading(true);
            setError(null);

            // Try to fetch from Supabase
            const data = await fetchIngredients();

            if (data && data.length > 0) {
                console.log(`✅ Loaded ${data.length} ingredients from Supabase`);
                setIngredients(data);

                // Also load recipes
                try {
                    const recipesData = await fetchRecipes();
                    if (recipesData && recipesData.length > 0) {
                        console.log(`✅ Loaded ${recipesData.length} recipes from Supabase`);
                        setRecipes(recipesData);
                    }
                } catch (recipeErr) {
                    console.error('Failed to load recipes from Supabase:', recipeErr);
                }
            } else {
                // If Supabase is empty, try localStorage cache
                console.log('⚠️ No data in Supabase, checking localStorage cache...');
                const cached = localStorage.getItem('ingredients_cache');
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    console.log(`📦 Loaded ${parsedCache.length} ingredients from cache`);
                    setIngredients(parsedCache);
                }
            }
        } catch (err) {
            console.error('Failed to load ingredients from Supabase:', err);
            setError(err.message);

            // Fallback to localStorage cache
            try {
                const cached = localStorage.getItem('ingredients_cache');
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    console.log(`📦 Fallback: Loaded ${parsedCache.length} ingredients from cache`);
                    setIngredients(parsedCache);
                }
            } catch (cacheErr) {
                console.error('Failed to load from cache:', cacheErr);
            }
        } finally {
            setLoading(false);
        }
    }

    // Load cart from Supabase
    async function loadCartFromSupabase() {
        try {
            // Try to fetch from Supabase
            const cartItems = await fetchCartItems();

            if (cartItems && cartItems.length > 0) {
                console.log(`🛒 Loaded ${cartItems.length} items from cart`);
                setCart(cartItems);
            } else {
                // If Supabase cart is empty, try localStorage cache
                const cached = localStorage.getItem('cart_cache');
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    console.log(`📦 Loaded ${parsedCache.length} cart items from cache`);
                    setCart(parsedCache);
                }
            }
        } catch (err) {
            console.error('Failed to load cart from Supabase:', err);

            // Fallback to localStorage cache
            try {
                const cached = localStorage.getItem('cart_cache');
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    console.log(`📦 Fallback: Loaded ${parsedCache.length} cart items from cache`);
                    setCart(parsedCache);
                }
            } catch (cacheErr) {
                console.error('Failed to load cart from cache:', cacheErr);
            }
        }
    }

    // Load wishlist from Supabase
    async function loadWishlistFromSupabase() {
        try {
            // Try to fetch from Supabase
            const wishlistItems = await fetchCartItems('wishlist');

            if (wishlistItems && wishlistItems.length > 0) {
                console.log(`📋 Loaded ${wishlistItems.length} items from wishlist`);
                setWishlist(wishlistItems);
            } else {
                // If Supabase wishlist is empty, try localStorage cache
                const cached = localStorage.getItem('wishlist_cache');
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    console.log(`📦 Loaded ${parsedCache.length} wishlist items from cache`);
                    setWishlist(parsedCache);
                }
            }
        } catch (err) {
            console.error('Failed to load wishlist from Supabase:', err);

            // Fallback to localStorage cache
            try {
                const cached = localStorage.getItem('wishlist_cache');
                if (cached) {
                    const parsedCache = JSON.parse(cached);
                    console.log(`📦 Fallback: Loaded ${parsedCache.length} wishlist items from cache`);
                    setWishlist(parsedCache);
                }
            } catch (cacheErr) {
                console.error('Failed to load wishlist from cache:', cacheErr);
            }
        }
    }

    // Actions
    const addIngredient = async (ingredient) => {
        try {
            setSyncing(true);

            // Generate ID if not provided
            const newIngredient = {
                ...ingredient,
                id: ingredient.id || Date.now().toString()
            };

            // Optimistically update UI
            setIngredients(prev => [...prev, newIngredient]);

            // Sync to Supabase
            try {
                await createIngredient(newIngredient);
                console.log('✅ Ingredient created in Supabase');
            } catch (err) {
                console.error('Failed to create ingredient in Supabase:', err);
                // Keep the optimistic update even if Supabase fails
                // It will be in localStorage cache
            }
            return newIngredient;
        } catch (err) {
            console.error('Failed to add ingredient:', err);
            throw err;
        } finally {
            setSyncing(false);
        }
    };

    const updateIngredient = async (id, updates, options = {}) => {
        try {
            setSyncing(true);

            // Only auto-update boughtDate when explicitly requested (e.g., from cart restock)
            if (options.shouldUpdateBoughtDate && updates.stockStatus === 'In Stock') {
                const currentIngredient = ingredients.find(i => i.id === id);
                if (currentIngredient && currentIngredient.stockStatus !== 'In Stock') {
                    updates.boughtDate = new Date().toISOString();
                }
            }

            // Optimistically update UI
            setIngredients(prev =>
                prev.map(ing => ing.id === id ? { ...ing, ...updates } : ing)
            );

            // Sync to Supabase
            try {
                await updateIngredientDB(id, updates);
                console.log('✅ Ingredient updated in Supabase');
            } catch (err) {
                console.error('Failed to update ingredient in Supabase:', err);
                // Keep the optimistic update even if Supabase fails
            }
        } catch (err) {
            console.error('Failed to update ingredient:', err);
            throw err;
        } finally {
            setSyncing(false);
        }
    };

    const deleteIngredientAction = async (id) => {
        try {
            setSyncing(true);

            // Optimistically update UI
            setIngredients(prev => prev.filter(ing => ing.id !== id));

            // Sync to Supabase
            try {
                await deleteIngredient(id);
                console.log('✅ Ingredient deleted from Supabase');
            } catch (err) {
                console.error('Failed to delete ingredient from Supabase:', err);
                // Keep the optimistic update even if Supabase fails
            }
        } catch (err) {
            console.error('Failed to delete ingredient:', err);
            throw err;
        } finally {
            setSyncing(false);
        }
    };

    const addRecipe = async (recipe) => {
        setSyncing(true);
        try {
            const newRecipe = await createRecipe(recipe);

            // Sync ingredient links if provided
            if (recipe.linkedIngredientIds && recipe.linkedIngredientIds.length > 0) {
                await syncRecipeIngredients(newRecipe.id, recipe.linkedIngredientIds);
            }

            setRecipes(prev => [newRecipe, ...prev]);
        } catch (err) {
            console.error('Failed to create recipe:', err);
            // Fallback to local state if DB fails (optional, but better to show error)
            alert('Failed to create recipe');
        } finally {
            setSyncing(false);
        }
    };

    const updateRecipe = async (id, updates) => {
        setSyncing(true);
        try {
            const updatedRecipe = await updateRecipeDB(id, updates);

            // Refetch the recipe ingredients from the database to get the latest isRequired flags
            // This ensures we have the correct format with {ingredientId, quantity, isRequired}
            try {
                const ingredientLinks = await fetchRecipeIngredients(id);
                updatedRecipe.linkedIngredientIds = ingredientLinks;
            } catch (err) {
                console.error('Failed to refetch recipe ingredients after update:', err);
                // Fallback to updates if refetch fails
                if (updates.linkedIngredientIds) {
                    updatedRecipe.linkedIngredientIds = updates.linkedIngredientIds;
                }
            }

            setRecipes(prev => prev.map(rec => rec.id === id ? updatedRecipe : rec));
        } catch (err) {
            console.error('Failed to update recipe:', err);
            alert('Failed to update recipe');
        } finally {
            setSyncing(false);
        }
    };

    const deleteRecipeAction = async (id) => {
        setSyncing(true);
        try {
            await deleteRecipe(id);
            setRecipes(prev => prev.filter(rec => rec.id !== id));
            console.log('✅ Recipe deleted');
        } catch (err) {
            console.error('Failed to delete recipe:', err);
            alert('Failed to delete recipe');
        } finally {
            setSyncing(false);
        }
    };

    const addToCart = async (ingredientId) => {
        // Optimistically update UI
        setCart(prev => {
            if (!prev.some(item => item.ingredientId === ingredientId)) {
                return [...prev, { ingredientId, isChecked: false }];
            }
            return prev;
        });

        // Sync to Supabase
        try {
            await addToCartDB(ingredientId);
            console.log('✅ Added to cart in Supabase');
        } catch (err) {
            console.error('Failed to add to cart in Supabase:', err);
            // Keep the optimistic update even if Supabase fails
        }
    };

    const removeFromCart = async (ingredientId) => {
        // Optimistically update UI
        setCart(prev => prev.filter(item => item.ingredientId !== ingredientId));

        // Sync to Supabase
        try {
            await removeFromCartDB(ingredientId);
            console.log('✅ Removed from cart in Supabase');
        } catch (err) {
            console.error('Failed to remove from cart in Supabase:', err);
            // Keep the optimistic update even if Supabase fails
        }
    };

    const toggleCartItemChecked = async (ingredientId) => {
        // Optimistically update UI
        setCart(prev =>
            prev.map(item =>
                item.ingredientId === ingredientId
                    ? { ...item, isChecked: !item.isChecked }
                    : item
            )
        );

        // Find the new checked state
        const item = cart.find(item => item.ingredientId === ingredientId);
        const newCheckedState = item ? !item.isChecked : true;

        // Sync to Supabase
        try {
            await updateCartItemChecked(ingredientId, newCheckedState);
            console.log('✅ Updated cart item checked state in Supabase');
        } catch (err) {
            console.error('Failed to update cart item checked state in Supabase:', err);
            // Keep the optimistic update even if Supabase fails
        }
    };

    const clearCart = async () => {
        // Optimistically update UI
        setCart([]);

        // Sync to Supabase
        try {
            await clearCartDB();
            console.log('✅ Cart cleared in Supabase');
        } catch (err) {
            console.error('Failed to clear cart in Supabase:', err);
            // Keep the optimistic update even if Supabase fails
        }
    };

    // Wishlist actions
    const addToWishlist = async (ingredientId) => {
        // Optimistically update UI
        setWishlist(prev => {
            if (!prev.some(item => item.ingredientId === ingredientId)) {
                return [...prev, { ingredientId, isChecked: false }];
            }
            return prev;
        });

        // Sync to Supabase
        try {
            await addToCartDB(ingredientId, 'wishlist');
            console.log('✅ Added to wishlist in Supabase');
        } catch (err) {
            console.error('Failed to add to wishlist in Supabase:', err);
            // Keep the optimistic update even if Supabase fails
        }
    };

    const removeFromWishlist = async (ingredientId) => {
        // Optimistically update UI
        setWishlist(prev => prev.filter(item => item.ingredientId !== ingredientId));

        // Sync to Supabase
        try {
            await removeFromCartDB(ingredientId);
            console.log('✅ Removed from wishlist in Supabase');
        } catch (err) {
            console.error('Failed to remove from wishlist in Supabase:', err);
            // Keep the optimistic update even if Supabase fails
        }
    };

    const moveToShoppingList = async (ingredientId) => {
        // Optimistically update UI - remove from wishlist, add to cart
        setWishlist(prev => prev.filter(item => item.ingredientId !== ingredientId));
        setCart(prev => {
            if (!prev.some(item => item.ingredientId === ingredientId)) {
                return [...prev, { ingredientId, isChecked: false }];
            }
            return prev;
        });

        // Sync to Supabase
        try {
            await updateCartItemListType(ingredientId, 'shopping');
            console.log('✅ Moved to shopping list in Supabase');
        } catch (err) {
            console.error('Failed to move to shopping list in Supabase:', err);
            // Keep the optimistic update even if Supabase fails
        }
    };

    const moveToWishlist = async (ingredientId) => {
        // Optimistically update UI - remove from cart, add to wishlist
        setCart(prev => prev.filter(item => item.ingredientId !== ingredientId));
        setWishlist(prev => {
            if (!prev.some(item => item.ingredientId === ingredientId)) {
                return [...prev, { ingredientId, isChecked: false }];
            }
            return prev;
        });

        // Sync to Supabase
        try {
            await updateCartItemListType(ingredientId, 'wishlist');
            console.log('✅ Moved to wishlist in Supabase');
        } catch (err) {
            console.error('Failed to move to wishlist in Supabase:', err);
            // Keep the optimistic update even if Supabase fails
        }
    };

    // Refresh ingredients from Supabase
    const refreshIngredients = () => {
        loadIngredientsFromSupabase();
    };

    return (
        <AppContext.Provider value={{
            ingredients,
            recipes,
            cart,
            wishlist,
            loading,
            error,
            syncing,
            addIngredient,
            updateIngredient,
            deleteIngredient: deleteIngredientAction,
            addRecipe,
            updateRecipe,
            deleteRecipe: deleteRecipeAction,
            addToCart,
            removeFromCart,
            toggleCartItemChecked,
            clearCart,
            addToWishlist,
            removeFromWishlist,
            moveToShoppingList,
            moveToWishlist,
            refreshIngredients
        }}>
            {children}
        </AppContext.Provider>
    );
};

// Helper function to transform from database format to app format
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
