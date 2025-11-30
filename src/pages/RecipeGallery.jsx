import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RecipeCard from '../components/RecipeCard';

const RecipeGallery = () => {
    const { recipes, addRecipe, ingredients } = useApp();
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('recipe_activeTab') || 'Done');
    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('recipe_searchQuery') || '');

    // Persist state to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('recipe_activeTab', activeTab);
        sessionStorage.setItem('recipe_searchQuery', searchQuery);
    }, [activeTab, searchQuery]);

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'All' || recipe.status === activeTab;
        return matchesSearch && matchesTab;
    });

    // Sort by availability (100% at top)
    const sortedRecipes = [...filteredRecipes].sort((a, b) => {
        const getAvailability = (r) => {
            const linked = r.linkedIngredientIds || [];
            if (linked.length === 0) return 0;
            const inStock = linked.filter(id => {
                const ing = ingredients.find(i => i.id === id);
                return ing && ing.stockStatus === 'In Stock';
            }).length;
            return (inStock / linked.length) * 100;
        };
        return getAvailability(b) - getAvailability(a);
    });

    const handleCreateRecipe = () => {
        const newRecipe = {
            title: 'New Recipe',
            image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80',
            status: 'New',
            ingredients: [],
            steps: [],
            linkedIngredientIds: []
        };
        addRecipe(newRecipe);
        // In a real app, we'd probably navigate to the edit page immediately
    };

    const tabs = ['Done', 'Half-done', 'New', 'All'];

    const getTabCount = (tab) => {
        return recipes.filter(recipe => {
            const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = tab === 'All' || recipe.status === tab;
            return matchesSearch && matchesStatus;
        }).length;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h2>Recipes</h2>
                <button className="btn btn-primary" onClick={handleCreateRecipe}>
                    <Plus size={20} /> New Recipe
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: 'var(--spacing-md)' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                <input
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '36px', width: '100%', maxWidth: '400px' }}
                />
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)', overflowX: 'auto', paddingBottom: '4px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '50px',
                            border: 'none',
                            backgroundColor: activeTab === tab ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                            color: activeTab === tab ? 'white' : 'var(--color-text)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab} <span style={{ opacity: 0.8, fontSize: '0.9em', marginLeft: '4px' }}>({getTabCount(tab)})</span>
                    </button>
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 'var(--spacing-md)'
            }}>
                {sortedRecipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
            </div>
        </div>
    );
};

export default RecipeGallery;
