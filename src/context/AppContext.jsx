import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

// Mock Data
const INITIAL_INGREDIENTS = [
    { id: '1', name: 'Milk', category: 'Dairy', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '2', name: 'Eggs', category: 'Dairy', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '3', name: 'Flour', category: 'Pantry', stockStatus: 'Out of Stock', location: 'Room Temp', history: [] },
    { id: '4', name: 'Butter', category: 'Dairy', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
];

const INITIAL_RECIPES = [
    {
        id: '1',
        title: 'Fluffy Pancakes',
        image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
        status: 'Want to Try',
        description: 'Classic fluffy pancakes for a perfect breakfast.',
        ingredients: ['2 cups flour', '2 eggs', '1.5 cups milk', '2 tbsp butter'],
        steps: ['Mix dry ingredients', 'Mix wet ingredients', 'Combine', 'Cook on griddle'],
        linkedIngredientIds: ['1', '2', '3', '4']
    },
    {
        id: '2',
        title: 'Scrambled Eggs',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414395d8?auto=format&fit=crop&w=800&q=80',
        status: 'Done',
        description: 'Creamy and soft scrambled eggs.',
        ingredients: ['3 eggs', '1 tbsp butter', 'Salt', 'Pepper'],
        steps: ['Beat eggs', 'Melt butter', 'Cook gently'],
        linkedIngredientIds: ['2', '4']
    }
];

export const AppProvider = ({ children }) => {
    // Load from localStorage or use initial data
    const [ingredients, setIngredients] = useState(() => {
        const saved = localStorage.getItem('ingredients');
        return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
    });

    const [recipes, setRecipes] = useState(() => {
        const saved = localStorage.getItem('recipes');
        return saved ? JSON.parse(saved) : INITIAL_RECIPES;
    });

    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('ingredients', JSON.stringify(ingredients));
    }, [ingredients]);

    useEffect(() => {
        localStorage.setItem('recipes', JSON.stringify(recipes));
    }, [recipes]);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Actions
    const addIngredient = (ingredient) => {
        setIngredients([...ingredients, { ...ingredient, id: Date.now().toString() }]);
    };

    const updateIngredient = (id, updates) => {
        setIngredients(ingredients.map(ing => ing.id === id ? { ...ing, ...updates } : ing));
    };

    const addRecipe = (recipe) => {
        setRecipes([...recipes, { ...recipe, id: Date.now().toString() }]);
    };

    const updateRecipe = (id, updates) => {
        setRecipes(recipes.map(rec => rec.id === id ? { ...rec, ...updates } : rec));
    };

    const addToCart = (ingredientId) => {
        if (!cart.includes(ingredientId)) {
            setCart([...cart, ingredientId]);
        }
    };

    const removeFromCart = (ingredientId) => {
        setCart(cart.filter(id => id !== ingredientId));
    };

    const clearCart = () => setCart([]);

    return (
        <AppContext.Provider value={{
            ingredients,
            recipes,
            cart,
            addIngredient,
            updateIngredient,
            addRecipe,
            updateRecipe,
            addToCart,
            removeFromCart,
            clearCart
        }}>
            {children}
        </AppContext.Provider>
    );
};
