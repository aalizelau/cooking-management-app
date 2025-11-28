import React from 'react';
import { MapPin, ShoppingCart, Check, Trash2, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const IngredientCard = ({ ingredient }) => {
    const { updateIngredient, addToCart, cart } = useApp();
    const navigate = useNavigate();
    const isInCart = cart.includes(ingredient.id);

    const handleConsume = () => {
        updateIngredient(ingredient.id, { stockStatus: 'Out of Stock' });
    };

    const handleAddToCart = () => {
        addToCart(ingredient.id);
    };

    return (
        <div className="card" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderLeft: `4px solid ${ingredient.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)'}`
        }}>
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem' }}>{ingredient.name}</h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: '4px' }}>
                    <span className="badge" style={{ backgroundColor: '#f0f0f0', color: '#555' }}>
                        {ingredient.category}
                    </span>
                    {ingredient.stockStatus === 'In Stock' && (
                        <span className="badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#e6f4ea', color: 'var(--color-success)' }}>
                            <MapPin size={12} /> {ingredient.location}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button
                    onClick={() => navigate(`/inventory/${ingredient.id}`)}
                    className="btn btn-outline"
                    title="View Details"
                >
                    <Info size={18} />
                </button>
                {ingredient.stockStatus === 'In Stock' ? (
                    <button
                        onClick={handleConsume}
                        className="btn btn-outline"
                        title="Mark as Consumed"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                    >
                        Consumed
                    </button>
                ) : (
                    <button
                        onClick={handleAddToCart}
                        disabled={isInCart}
                        className={`btn ${isInCart ? 'btn-secondary' : 'btn-outline'}`}
                        title="Add to Shopping Cart"
                    >
                        {isInCart ? <Check size={18} /> : <ShoppingCart size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default IngredientCard;
