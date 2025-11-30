import React from 'react';
import { Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
    const { ingredients } = useApp();
    const navigate = useNavigate();
    const [imageError, setImageError] = React.useState(false);

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
            <div style={{ position: 'relative', height: '140px', backgroundColor: '#eee' }}>
                {!imageError && recipe.image ? (
                    <img
                        src={recipe.image}
                        alt={recipe.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '2rem' }}>🍳</span>
                    </div>
                )}
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '3px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: availabilityColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px'
                }}>
                    {availability}%
                </div>
            </div>

            <div style={{ padding: 'var(--spacing-sm)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.3' }}>{recipe.title}</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span className="badge" style={{ backgroundColor: '#f0f0f0', color: '#555', fontSize: '0.7rem', padding: '2px 6px' }}>
                        {recipe.status}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                        {totalLinked} items
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecipeCard;
