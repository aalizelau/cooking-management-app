import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RecipeCard from '../components/RecipeCard';

const RecipeGallery = () => {
    const { recipes, addRecipe } = useApp();
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'All' || recipe.status === activeTab;
        return matchesSearch && matchesTab;
    });

    const handleCreateRecipe = () => {
        const newRecipe = {
            title: 'New Recipe',
            image: 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80',
            status: 'New',
            description: 'Description goes here...',
            ingredients: [],
            steps: [],
            linkedIngredientIds: []
        };
        addRecipe(newRecipe);
        // In a real app, we'd probably navigate to the edit page immediately
    };

    const tabs = ['Done', 'Half-done', 'New', 'All'];

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
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 'var(--spacing-lg)'
            }}>
                {filteredRecipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
            </div>
        </div>
    );
};

export default RecipeGallery;
