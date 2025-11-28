import React, { useState } from 'react';
import { Plus, Search, Filter, ShoppingCart as CartIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import IngredientCard from '../components/IngredientCard';
import { useNavigate } from 'react-router-dom';

const InventoryDashboard = () => {
    const { ingredients, addIngredient, cart } = useApp();
    const navigate = useNavigate();

    const [stockTab, setStockTab] = useState('in-stock'); // 'in-stock' or 'out-of-stock'
    const [groupByTab, setGroupByTab] = useState('category'); // 'category' or 'location'
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterLocation, setFilterLocation] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // New Ingredient State
    const [newIngredient, setNewIngredient] = useState({
        name: '',
        category: 'General',
        stockStatus: 'In Stock',
        location: 'Refrigerated'
    });

    const categories = ['All', ...new Set(ingredients.map(i => i.category))];
    const locations = ['All', 'Refrigerated', 'Frozen', 'Room Temp'];

    // Count ingredients for each tab
    const inStockCount = ingredients.filter(ing => ing.stockStatus === 'In Stock').length;
    const outOfStockCount = ingredients.filter(ing => ing.stockStatus === 'Out of Stock').length;

    // Filter ingredients based on current stock tab
    const currentStockIngredients = ingredients.filter(ing => {
        const matchesStock = stockTab === 'in-stock'
            ? ing.stockStatus === 'In Stock'
            : ing.stockStatus === 'Out of Stock';
        const matchesCat = filterCategory === 'All' || ing.category === filterCategory;
        const matchesLoc = filterLocation === 'All' || ing.location === filterLocation;
        const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());

        // For out of stock, location filter doesn't apply
        if (stockTab === 'out-of-stock') {
            return matchesStock && matchesCat && matchesSearch;
        }
        return matchesStock && matchesCat && matchesLoc && matchesSearch;
    });

    // Group ingredients by category
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

    // Group ingredients by location
    const groupByLocation = (ingredientsList) => {
        const grouped = {};
        ingredientsList.forEach(ing => {
            if (!grouped[ing.location]) {
                grouped[ing.location] = [];
            }
            grouped[ing.location].push(ing);
        });
        return grouped;
    };

    // Determine which grouping to use
    const groupedIngredients = groupByTab === 'category'
        ? groupByCategory(currentStockIngredients)
        : groupByLocation(currentStockIngredients);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newIngredient.name) return;

        addIngredient({
            ...newIngredient,
            history: []
        });

        setNewIngredient({ name: '', category: 'General', stockStatus: 'In Stock', location: 'Refrigerated' });
        setIsAdding(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h2>Inventory</h2>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                        className="btn btn-outline"
                        onClick={() => navigate('/shopping-cart')} // We'll create this route/page next
                        style={{ position: 'relative' }}
                    >
                        <CartIcon size={20} />
                        {cart.length > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {cart.length}
                            </span>
                        )}
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                        <Plus size={20} /> Add Item
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="card" style={{ marginBottom: 'var(--spacing-md)', border: '2px solid var(--color-primary)' }}>
                    <h3>Add New Ingredient</h3>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <input
                                placeholder="Name (e.g. Milk)"
                                value={newIngredient.name}
                                onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                autoFocus
                            />
                            <input
                                placeholder="Category (e.g. Dairy)"
                                value={newIngredient.category}
                                onChange={e => setNewIngredient({ ...newIngredient, category: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <select
                                value={newIngredient.stockStatus}
                                onChange={e => setNewIngredient({ ...newIngredient, stockStatus: e.target.value })}
                            >
                                <option value="In Stock">In Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                            <select
                                value={newIngredient.location}
                                onChange={e => setNewIngredient({ ...newIngredient, location: e.target.value })}
                                disabled={newIngredient.stockStatus === 'Out of Stock'}
                            >
                                <option value="Refrigerated">Refrigerated</option>
                                <option value="Frozen">Frozen</option>
                                <option value="Room Temp">Room Temp</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', justifySelf: 'end', gap: 'var(--spacing-sm)' }}>
                            <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Item</button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB NAVIGATION */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                {/* Stock Status Tabs */}
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
                    <button
                        onClick={() => setStockTab('in-stock')}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            border: 'none',
                            borderRadius: 'var(--border-radius)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease',
                            backgroundColor: stockTab === 'in-stock' ? 'var(--color-success)' : '#f5f5f5',
                            color: stockTab === 'in-stock' ? 'white' : 'var(--color-text)',
                        }}
                    >
                        In Stock ({inStockCount})
                    </button>
                    <button
                        onClick={() => {
                            setStockTab('out-of-stock');
                            // Reset to category grouping when switching to out of stock
                            if (groupByTab === 'location') {
                                setGroupByTab('category');
                            }
                        }}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            border: 'none',
                            borderRadius: 'var(--border-radius)',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            transition: 'all 0.2s ease',
                            backgroundColor: stockTab === 'out-of-stock' ? 'var(--color-danger)' : '#f5f5f5',
                            color: stockTab === 'out-of-stock' ? 'white' : 'var(--color-text)',
                        }}
                    >
                        Out of Stock ({outOfStockCount})
                    </button>
                </div>

                {/* Group By Tabs */}
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <button
                        onClick={() => setGroupByTab('category')}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            border: 'none',
                            borderRadius: 'var(--border-radius)',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease',
                            backgroundColor: groupByTab === 'category' ? 'var(--color-primary)' : '#f5f5f5',
                            color: groupByTab === 'category' ? 'white' : 'var(--color-text)',
                        }}
                    >
                        By Category
                    </button>
                    <button
                        onClick={() => setGroupByTab('location')}
                        disabled={stockTab === 'out-of-stock'}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            border: 'none',
                            borderRadius: 'var(--border-radius)',
                            cursor: stockTab === 'out-of-stock' ? 'not-allowed' : 'pointer',
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s ease',
                            backgroundColor: groupByTab === 'location' ? 'var(--color-primary)' : '#f5f5f5',
                            color: groupByTab === 'location' ? 'white' : 'var(--color-text)',
                            opacity: stockTab === 'out-of-stock' ? 0.5 : 1,
                        }}
                    >
                        By Location
                    </button>
                </div>
            </div>

            {/* FILTERS AND SEARCH */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                    <input
                        placeholder="Search ingredients..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '36px', width: '100%' }}
                    />
                </div>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {stockTab === 'in-stock' && groupByTab === 'category' && (
                    <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                )}
            </div>

            {/* GROUPED INGREDIENTS DISPLAY */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {currentStockIngredients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--color-muted)', backgroundColor: '#f9f9f9', borderRadius: 'var(--border-radius)' }}>
                        No ingredients found.
                    </div>
                ) : (
                    Object.keys(groupedIngredients).sort().map(groupKey => (
                        <div key={groupKey}>
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
                                {groupKey}
                                <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 'normal',
                                    color: 'var(--color-muted)',
                                    backgroundColor: '#f5f5f5',
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                }}>
                                    {groupedIngredients[groupKey].length}
                                </span>
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {groupedIngredients[groupKey].map(ing => (
                                    <IngredientCard key={ing.id} ingredient={ing} />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InventoryDashboard;
