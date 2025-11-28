import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import RecipeCard from '../components/RecipeCard';

const RecipeGallery = () => {
    const { recipes, addRecipe } = useApp();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRecipes = recipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
