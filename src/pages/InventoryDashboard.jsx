import React, { useState } from 'react';
import { Plus, Search, Filter, ShoppingCart as CartIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import IngredientCard from '../components/IngredientCard';
import { useNavigate } from 'react-router-dom';

const InventoryDashboard = () => {
    const { ingredients, addIngredient, cart } = useApp();
    const navigate = useNavigate();

    const [outOfStockCategory, setOutOfStockCategory] = useState('All');
    const [outOfStockSearch, setOutOfStockSearch] = useState('');
    const [inStockLocation, setInStockLocation] = useState('All');
    const [inStockCategory, setInStockCategory] = useState('All');
    const [inStockSearch, setInStockSearch] = useState('');
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

    // Separate ingredients by stock status
    const outOfStockIngredients = ingredients.filter(ing => {
        const isOutOfStock = ing.stockStatus === 'Out of Stock';
        const matchesCat = outOfStockCategory === 'All' || ing.category === outOfStockCategory;
        const matchesSearch = ing.name.toLowerCase().includes(outOfStockSearch.toLowerCase());
        return isOutOfStock && matchesCat && matchesSearch;
    });

    const inStockIngredients = ingredients.filter(ing => {
        const isInStock = ing.stockStatus === 'In Stock';
        const matchesLoc = inStockLocation === 'All' || ing.location === inStockLocation;
        const matchesCat = inStockCategory === 'All' || ing.category === inStockCategory;
        const matchesSearch = ing.name.toLowerCase().includes(inStockSearch.toLowerCase());
        return isInStock && matchesLoc && matchesCat && matchesSearch;
    });

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

            {/* OUT OF STOCK SECTION */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h3 style={{
                    marginBottom: 'var(--spacing-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    color: 'var(--color-danger)'
                }}>
                    Out of Stock ({outOfStockIngredients.length})
                </h3>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                        <input
                            placeholder="Search out of stock..."
                            value={outOfStockSearch}
                            onChange={e => setOutOfStockSearch(e.target.value)}
                            style={{ paddingLeft: '36px', width: '100%' }}
                        />
                    </div>
                    <select value={outOfStockCategory} onChange={e => setOutOfStockCategory(e.target.value)}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {outOfStockIngredients.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--color-muted)', backgroundColor: '#f9f9f9', borderRadius: 'var(--border-radius)' }}>
                            No out of stock ingredients.
                        </div>
                    ) : (
                        outOfStockIngredients.map(ing => (
                            <IngredientCard key={ing.id} ingredient={ing} />
                        ))
                    )}
                </div>
            </div>

            {/* IN STOCK SECTION */}
            <div>
                <h3 style={{
                    marginBottom: 'var(--spacing-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    color: 'var(--color-success)'
                }}>
                    In Stock ({inStockIngredients.length})
                </h3>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                        <input
                            placeholder="Search in stock..."
                            value={inStockSearch}
                            onChange={e => setInStockSearch(e.target.value)}
                            style={{ paddingLeft: '36px', width: '100%' }}
                        />
                    </div>
                    <select value={inStockLocation} onChange={e => setInStockLocation(e.target.value)}>
                        {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <select value={inStockCategory} onChange={e => setInStockCategory(e.target.value)}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {inStockIngredients.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)', color: 'var(--color-muted)', backgroundColor: '#f9f9f9', borderRadius: 'var(--border-radius)' }}>
                            No in stock ingredients.
                        </div>
                    ) : (
                        inStockIngredients.map(ing => (
                            <IngredientCard key={ing.id} ingredient={ing} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryDashboard;
