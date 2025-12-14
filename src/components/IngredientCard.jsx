import React from 'react';
import { ShoppingCart, Check, X, ChefHat, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const IngredientCard = ({ ingredient, recipeCount = 0, showRecipeCount = false }) => {
    const { updateIngredient, addToCart, removeFromCart, cart, wishlist } = useApp();
    const navigate = useNavigate();
    const isInCart = cart.some(item => item.ingredientId === ingredient.id) ||
                     wishlist.some(item => item.ingredientId === ingredient.id);

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>{ingredient.name}</h3>
                    {ingredient.stockStatus === 'In Stock' && ingredient.shelfLifeDays && ingredient.boughtDate && (
                        (() => {
                            const bought = new Date(ingredient.boughtDate);
                            const expiry = new Date(bought);
                            expiry.setDate(bought.getDate() + ingredient.shelfLifeDays);

                            const today = new Date();
                            // Reset time part for accurate day calculation
                            today.setHours(0, 0, 0, 0);
                            expiry.setHours(0, 0, 0, 0);

                            const diffTime = expiry - today;
                            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            let color = 'var(--color-muted)';
                            if (daysLeft < 0) color = 'var(--color-danger)';
                            else if (daysLeft <= 3) color = '#e67e22'; // Orange for warning

                            return (
                                <span style={{ fontSize: '0.75rem', color: color, fontWeight: '600' }}>
                                    {daysLeft < 0 ? `${Math.abs(daysLeft)} days expired` : `${daysLeft} days left`}
                                </span>
                            );
                        })()
                    )}
                    {showRecipeCount && recipeCount > 0 && (
                        <span style={{
                            fontSize: '0.75rem',
                            color: '#8b7355',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <BookOpen size={12} />
                            {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
                        </span>
                    )}
                </div>
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
