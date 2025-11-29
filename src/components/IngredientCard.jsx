import React from 'react';
import { ShoppingCart, Check, X, ChefHat } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const IngredientCard = ({ ingredient }) => {
    const { updateIngredient, addToCart, removeFromCart, cart } = useApp();
    const navigate = useNavigate();
    const isInCart = cart.includes(ingredient.id);

    const handleConsume = (e) => {
        e.stopPropagation(); // Prevent card click navigation
        updateIngredient(ingredient.id, { stockStatus: 'Out of Stock' });
    };

    const handleToggleCart = (e) => {
        e.stopPropagation(); // Prevent card click navigation
        if (isInCart) {
            removeFromCart(ingredient.id);
        } else {
            addToCart(ingredient.id);
        }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1 }}>
                {ingredient.emoji && (
                    <span style={{ fontSize: '1.2rem' }}>
                        {ingredient.emoji}
                    </span>
                )}
                <h3 style={{ fontSize: '1rem', margin: 0 }}>{ingredient.name}</h3>
            </div>

            <div>
                {ingredient.stockStatus === 'In Stock' ? (
                    <button
                        onClick={handleConsume}
                        className="btn btn-outline"
                        title="Mark as Consumed"
                        style={{
                            padding: 'var(--spacing-xs)',
                            minWidth: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1) rotate(-10deg)';
                            e.currentTarget.style.color = 'var(--color-danger)';
                            e.currentTarget.style.borderColor = 'var(--color-danger)';
                            e.currentTarget.style.backgroundColor = '#fff0f0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                            e.currentTarget.style.color = '';
                            e.currentTarget.style.borderColor = '';
                            e.currentTarget.style.backgroundColor = '';
                        }}
                    >
                        <ChefHat size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleToggleCart}
                        className={`btn ${isInCart ? 'btn-secondary' : 'btn-outline'}`}
                        title={isInCart ? "Remove from cart" : "Add to Shopping Cart"}
                        style={{
                            padding: 'var(--spacing-xs)',
                            minWidth: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1) rotate(-10deg)';
                            if (isInCart) {
                                e.currentTarget.style.color = 'var(--color-success)';
                                e.currentTarget.style.borderColor = 'var(--color-success)';
                                e.currentTarget.style.backgroundColor = '#f0fff4';
                            } else {
                                e.currentTarget.style.color = 'var(--color-primary)';
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                e.currentTarget.style.backgroundColor = '#fff5f0';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                            e.currentTarget.style.color = '';
                            e.currentTarget.style.borderColor = '';
                            e.currentTarget.style.backgroundColor = '';
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
