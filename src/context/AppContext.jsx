import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

// Mock Data
const INITIAL_INGREDIENTS = [
    // Dairy - In Stock
    { id: '1', name: 'Milk', category: 'Dairy', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '2', name: 'Eggs', category: 'Dairy', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '4', name: 'Butter', category: 'Dairy', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '5', name: 'Cheddar Cheese', category: 'Dairy', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '6', name: 'Greek Yogurt', category: 'Dairy', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },

    // Fruits - In Stock
    { id: '7', name: 'Apples', category: 'Fruits', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '8', name: 'Bananas', category: 'Fruits', stockStatus: 'In Stock', location: 'Room Temp', history: [] },
    { id: '9', name: 'Oranges', category: 'Fruits', stockStatus: 'In Stock', location: 'Room Temp', history: [] },
    { id: '10', name: 'Strawberries', category: 'Fruits', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },

    // Vegetables - In Stock
    { id: '11', name: 'Carrots', category: 'Vegetables', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '12', name: 'Broccoli', category: 'Vegetables', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '13', name: 'Spinach', category: 'Vegetables', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '14', name: 'Bell Peppers', category: 'Vegetables', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },

    // Meat - In Stock
    { id: '15', name: 'Chicken Breast', category: 'Meat', stockStatus: 'In Stock', location: 'Frozen', history: [] },
    { id: '16', name: 'Ground Beef', category: 'Meat', stockStatus: 'In Stock', location: 'Frozen', history: [] },
    { id: '17', name: 'Salmon Fillet', category: 'Meat', stockStatus: 'In Stock', location: 'Frozen', history: [] },

    // Pantry - In Stock
    { id: '18', name: 'Rice', category: 'Pantry', stockStatus: 'In Stock', location: 'Room Temp', history: [] },
    { id: '19', name: 'Pasta', category: 'Pantry', stockStatus: 'In Stock', location: 'Room Temp', history: [] },
    { id: '20', name: 'Olive Oil', category: 'Pantry', stockStatus: 'In Stock', location: 'Room Temp', history: [] },
    { id: '21', name: 'Canned Tomatoes', category: 'Pantry', stockStatus: 'In Stock', location: 'Room Temp', history: [] },

    // Snacks - In Stock
    { id: '22', name: 'Potato Chips', category: 'Snacks', stockStatus: 'In Stock', location: 'Room Temp', history: [] },
    { id: '23', name: 'Crackers', category: 'Snacks', stockStatus: 'In Stock', location: 'Room Temp', history: [] },
    { id: '24', name: 'Dark Chocolate', category: 'Snacks', stockStatus: 'In Stock', location: 'Room Temp', history: [] },

    // Beverages - In Stock
    { id: '25', name: 'Orange Juice', category: 'Beverages', stockStatus: 'In Stock', location: 'Refrigerated', history: [] },
    { id: '26', name: 'Coffee Beans', category: 'Beverages', stockStatus: 'In Stock', location: 'Room Temp', history: [] },

    // Out of Stock Items
    { id: '3', name: 'Flour', category: 'Pantry', stockStatus: 'Out of Stock', location: 'Room Temp', history: [] },
    { id: '27', name: 'Sugar', category: 'Pantry', stockStatus: 'Out of Stock', location: 'Room Temp', history: [] },
    { id: '28', name: 'Bacon', category: 'Meat', stockStatus: 'Out of Stock', location: 'Refrigerated', history: [] },
    { id: '29', name: 'Bread', category: 'Pantry', stockStatus: 'Out of Stock', location: 'Room Temp', history: [] },
    { id: '30', name: 'Cookies', category: 'Snacks', stockStatus: 'Out of Stock', location: 'Room Temp', history: [] },
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
