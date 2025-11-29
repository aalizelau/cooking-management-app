import React, { useState } from 'react';
import { CheckSquare, Square, ShoppingBag, Search, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import IngredientDetail from './IngredientDetail'; // Import IngredientDetail for the side panel

const ShoppingCart = () => {
    const { cart, ingredients, removeFromCart, updateIngredient, clearCart, addToCart } = useApp();
    const navigate = useNavigate();
    const [checkedItems, setCheckedItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIngredientId, setSelectedIngredientId] = useState(null); // Track selected ingredient for side panel

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
        setSelectedIngredientId(null); // Close side panel if the selected item is removed

        // If cart is empty, go back to inventory
        if (cart.length === checkedItems.length) {
            navigate('/inventory');
        }
    };

    // Search Logic
    const searchResults = searchQuery.length > 0
        ? ingredients.filter(ing =>
            ing.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !cart.includes(ing.id)
        )
        : [];

    const handleAddToCart = (id) => {
        addToCart(id);
        setSearchQuery('');
    };

    const CATEGORY_ORDER = [
        '原材料',
        '水果',
        '零食',
        '半成品',
        '調味料',
        '無食材類型'
    ];

    const sortCategories = (a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a);
        const indexB = CATEGORY_ORDER.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: 'var(--spacing-md)' }}>
            {/* Left Panel: Shopping List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--spacing-sm)' }}>
                <h2>Shopping Cart ({cart.length})</h2>

                {/* Search Bar */}
                <div style={{ position: 'relative', marginTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                        <input
                            placeholder="Search to add ingredients..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                paddingLeft: '40px',
                                paddingRight: '40px',
                                height: '48px',
                                fontSize: '1rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {searchQuery && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--color-card-bg)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 50,
                            maxHeight: '300px',
                            overflowY: 'auto',
                            border: '1px solid var(--color-border)'
                        }}>
                            {searchResults.length === 0 ? (
                                <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--color-muted)' }}>
                                    No ingredients found.
                                </div>
                            ) : (
                                searchResults.map(ing => (
                                    <div
                                        key={ing.id}
                                        onClick={() => handleAddToCart(ing.id)}
                                        style={{
                                            padding: 'var(--spacing-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            {ing.emoji && <span style={{ fontSize: '1.2rem' }}>{ing.emoji}</span>}
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{ing.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                                                    {ing.stockStatus} • {ing.location}
                                                </div>
                                            </div>
                                        </div>
                                        <Plus size={20} color="var(--color-primary)" />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <ShoppingBag size={48} color="var(--color-muted)" />
                        <h2 style={{ marginTop: 'var(--spacing-md)' }}>Your cart is empty</h2>
                        <p style={{ color: 'var(--color-muted)' }}>Add items using the search bar above or from the inventory.</p>
                        <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/inventory')}>
                            Back to Inventory
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', paddingBottom: '100px' }}>
                        {Object.keys(groupedCartItems).sort(sortCategories).map(category => (
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
                                        const isSelected = selectedIngredientId === ing.id;
                                        return (
                                            <div
                                                key={ing.id}
                                                className="card"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--spacing-md)',
                                                    opacity: isChecked ? 0.6 : 1,
                                                    cursor: 'pointer',
                                                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid transparent',
                                                    backgroundColor: isSelected ? '#fff8f6' : 'var(--color-card-bg)'
                                                }}
                                                onClick={() => setSelectedIngredientId(ing.id)}
                                            >
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); toggleCheck(ing.id); }}
                                                    style={{
                                                        color: isChecked ? 'var(--color-primary)' : 'var(--color-muted)',
                                                        cursor: 'pointer',
                                                        padding: '4px'
                                                    }}
                                                >
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
                )}
            </div>

            {/* Right Panel: Ingredient Details */}
            {selectedIngredientId && (
                <div style={{
                    flex: 1,
                    borderLeft: '1px solid var(--color-border)',
                    paddingLeft: 'var(--spacing-md)',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: 'var(--spacing-md)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => setSelectedIngredientId(null)} className="btn btn-icon">
                            <X size={20} />
                        </button>
                    </div>
                    {/* Render IngredientDetail but override useParams logic by passing props if we refactor IngredientDetail, 
                        OR since IngredientDetail uses useParams, we might need to refactor it to accept an ID prop.
                        For now, let's assume we need to refactor IngredientDetail to accept an optional ID prop.
                    */}
                    <IngredientDetail id={selectedIngredientId} />
                </div>
            )}

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
