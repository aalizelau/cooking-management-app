import React, { useState } from 'react';
import { CheckSquare, Square, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ShoppingCart = () => {
    const { cart, ingredients, removeFromCart, updateIngredient, clearCart } = useApp();
    const navigate = useNavigate();
    const [checkedItems, setCheckedItems] = useState([]);

    const cartIngredients = ingredients.filter(ing => cart.includes(ing.id));

    // Group cart ingredients by category
    const groupByCategory = (ingredientsList) => {
        const grouped = {};
        ingredientsList.forEach(ing => {
            if (!grouped[ing.category]) {
                grouped[ing.category] = [];
            }
            grouped[ing.category].push(ing);
        });
        return grouped;
    };

    const groupedCartItems = groupByCategory(cartIngredients);

    const toggleCheck = (id) => {
        if (checkedItems.includes(id)) {
            setCheckedItems(checkedItems.filter(item => item !== id));
        } else {
            setCheckedItems([...checkedItems, id]);
        }
    };

    const handleRestock = () => {
        // Move checked items to In Stock using their default location
        checkedItems.forEach(id => {
            const ingredient = ingredients.find(ing => ing.id === id);
            updateIngredient(id, {
                stockStatus: 'In Stock',
                location: ingredient.defaultLocation || 'Room Temp' // Fallback to Room Temp if no default
            });
            removeFromCart(id);
        });

        // Reset UI
        setCheckedItems([]);

        // If cart is empty, go back to inventory
        if (cart.length === checkedItems.length) {
            navigate('/inventory');
        }
    };

    if (cart.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                <ShoppingBag size={48} color="var(--color-muted)" />
                <h2 style={{ marginTop: 'var(--spacing-md)' }}>Your cart is empty</h2>
                <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/inventory')}>
                    Back to Inventory
                </button>
            </div>
        );
    }

    return (
        <div>
            <h2>Shopping Cart ({cart.length})</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                {Object.keys(groupedCartItems).sort().map(category => (
                    <div key={category}>
                        <h4 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'var(--color-text)',
                            marginBottom: 'var(--spacing-sm)',
                            paddingBottom: 'var(--spacing-xs)',
                            borderBottom: '2px solid #e0e0e0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)'
                        }}>
                            {category}
                            <span style={{
                                fontSize: '0.85rem',
                                fontWeight: 'normal',
                                color: 'var(--color-muted)',
                                backgroundColor: '#f5f5f5',
                                padding: '2px 8px',
                                borderRadius: '12px'
                            }}>
                                {groupedCartItems[category].length}
                            </span>
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {groupedCartItems[category].map(ing => {
                                const isChecked = checkedItems.includes(ing.id);
                                return (
                                    <div
                                        key={ing.id}
                                        className="card"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            opacity: isChecked ? 0.6 : 1,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => toggleCheck(ing.id)}
                                    >
                                        <div style={{ color: isChecked ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                                            {isChecked ? <CheckSquare size={24} /> : <Square size={24} />}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            {ing.emoji && <span style={{ fontSize: '1.25rem' }}>{ing.emoji}</span>}
                                            <h3 style={{ textDecoration: isChecked ? 'line-through' : 'none', margin: 0 }}>
                                                {ing.name}
                                            </h3>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {checkedItems.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    maxWidth: '600px',
                    backgroundColor: 'var(--color-text)',
                    color: 'white',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 100
                }}>
                    <div>
                        <span style={{ fontWeight: 'bold' }}>{checkedItems.length} items selected</span>
                        <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.9 }}>
                            Will be moved to their default locations
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={(e) => { e.stopPropagation(); handleRestock(); }}
                    >
                        Move to Stock
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShoppingCart;
