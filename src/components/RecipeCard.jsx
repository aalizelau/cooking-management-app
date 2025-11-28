import React from 'react';
import { Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
    const { ingredients } = useApp();
    const navigate = useNavigate();

    // Calculate Availability
    const linkedIngredients = recipe.linkedIngredientIds || [];
    const totalLinked = linkedIngredients.length;

    const inStockCount = linkedIngredients.filter(id => {
        const ing = ingredients.find(i => i.id === id);
        return ing && ing.stockStatus === 'In Stock';
    }).length;

    const availability = totalLinked > 0 ? Math.round((inStockCount / totalLinked) * 100) : 0;

    let availabilityColor = 'var(--color-danger)';
    if (availability >= 100) availabilityColor = 'var(--color-success)';
    else if (availability >= 50) availabilityColor = 'var(--color-accent)';

    return (
        <div
            className="card"
            onClick={() => navigate(`/recipes/${recipe.id}`)}
            style={{ cursor: 'pointer', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            <div style={{ position: 'relative', height: '200px' }}>
                <img
                    src={recipe.image}
                    alt={recipe.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: availabilityColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    {availability}% Available
                </div>
            </div>

            <div style={{ padding: 'var(--spacing-md)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-sm)' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{recipe.title}</h3>
                </div>

                <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginBottom: 'var(--spacing-md)', flex: 1 }}>
                    {recipe.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge" style={{ backgroundColor: '#f0f0f0', color: '#555' }}>
                        {recipe.status}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                        {totalLinked} ingredients
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
