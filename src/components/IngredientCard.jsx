import React from 'react';
import { ShoppingCart, Check, X, Cookie, ChefHat } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// Map categories to emojis
const getCategoryEmoji = (category) => {
    const emojiMap = {
        'Dairy': '🥛',
        'Pantry': '📦',
        'Fruits': '🍎',
        'Vegetables': '🥬',
        'Meat': '🥩',
        'Snacks': '🍪',
        'Beverages': '☕',
        'General': '🍴',
    };
    return emojiMap[category] || '🍴';
};

const IngredientCard = ({ ingredient }) => {
    const { updateIngredient, addToCart, cart } = useApp();
    const navigate = useNavigate();
    const isInCart = cart.includes(ingredient.id);

    const handleConsume = (e) => {
        e.stopPropagation(); // Prevent card click navigation
        updateIngredient(ingredient.id, { stockStatus: 'Out of Stock' });
    };

    const handleAddToCart = (e) => {
        e.stopPropagation(); // Prevent card click navigation
        addToCart(ingredient.id);
    };

    const handleCardClick = () => {
        navigate(`/inventory/${ingredient.id}`);
    };

    return (
        <div
            className="card"
            onClick={handleCardClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-sm)',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                // borderLeft: `4px solid ${ingredient.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)'}`,
                minHeight: '60px',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flex: 1 }}>
                <span style={{ fontSize: '1.5rem' }}>
                    {getCategoryEmoji(ingredient.category)}
                </span>
                <h3 style={{ fontSize: '0.95rem', margin: 0 }}>{ingredient.name}</h3>
            </div>

            <div>
                {ingredient.stockStatus === 'In Stock' ? (
                    <button
                        onClick={handleConsume}
                        className="btn btn-outline"
                        title="Mark as Consumed"
                        style={{
                            padding: 'var(--spacing-xs)',
                            // color: 'var(--color-danger)',
                            // borderColor: 'var(--color-danger)',
                            minWidth: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ChefHat size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleAddToCart}
                        disabled={isInCart}
                        className={`btn ${isInCart ? 'btn-secondary' : 'btn-outline'}`}
                        title={isInCart ? "Added to cart" : "Add to Shopping Cart"}
                        style={{
                            padding: 'var(--spacing-xs)',
                            minWidth: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {isInCart ? <Check size={18} /> : <ShoppingCart size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default IngredientCard;
