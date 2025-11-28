import React, { useState } from 'react';
import { CheckSquare, Square, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ShoppingCart = () => {
    const { cart, ingredients, removeFromCart, updateIngredient, clearCart } = useApp();
    const navigate = useNavigate();
    const [checkedItems, setCheckedItems] = useState([]);
    const [isRestocking, setIsRestocking] = useState(false);
    const [restockLocation, setRestockLocation] = useState('Refrigerated');

    const cartIngredients = ingredients.filter(ing => cart.includes(ing.id));

    const toggleCheck = (id) => {
        if (checkedItems.includes(id)) {
            setCheckedItems(checkedItems.filter(item => item !== id));
        } else {
            setCheckedItems([...checkedItems, id]);
        }
    };

    const handleRestock = () => {
        // Move checked items to In Stock with the selected location
        checkedItems.forEach(id => {
            updateIngredient(id, {
                stockStatus: 'In Stock',
                location: restockLocation
            });
            removeFromCart(id);
        });

        // Reset UI
        setCheckedItems([]);
        setIsRestocking(false);

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                {cartIngredients.map(ing => {
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
                            <div>
                                <h3 style={{ textDecoration: isChecked ? 'line-through' : 'none' }}>{ing.name}</h3>
                                <span className="badge" style={{ backgroundColor: '#f0f0f0', color: '#555' }}>{ing.category}</span>
                            </div>
                        </div>
                    );
                })}
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
                    </div>

                    {isRestocking ? (
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                            <select
                                value={restockLocation}
                                onChange={e => setRestockLocation(e.target.value)}
                                style={{ color: 'black', padding: '4px 8px' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <option value="Refrigerated">Refrigerated</option>
                                <option value="Frozen">Frozen</option>
                                <option value="Room Temp">Room Temp</option>
                            </select>
                            <button
                                className="btn btn-primary"
                                onClick={(e) => { e.stopPropagation(); handleRestock(); }}
                            >
                                Confirm
                            </button>
                        </div>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={(e) => { e.stopPropagation(); setIsRestocking(true); }}
                        >
                            Move to Stock
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShoppingCart;
