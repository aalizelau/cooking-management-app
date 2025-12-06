import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, X, LayoutGrid, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import IngredientCard from '../components/IngredientCard';
import EmojiPicker from 'emoji-picker-react';

import { useNavigate } from 'react-router-dom';

const InventoryDashboard = () => {
    const { ingredients, addIngredient } = useApp();
    const navigate = useNavigate();

    // State with persistence
    const [stockTab, setStockTab] = useState(() => sessionStorage.getItem('inventory_stockTab') || 'in-stock');
    const [groupByTab, setGroupByTab] = useState(() => sessionStorage.getItem('inventory_groupByTab') || 'category');
    const [filterCategory, setFilterCategory] = useState(() => sessionStorage.getItem('inventory_filterCategory') || 'All');
    const [filterLocation, setFilterLocation] = useState(() => sessionStorage.getItem('inventory_filterLocation') || 'All');
    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('inventory_searchQuery') || '');

    const [isAdding, setIsAdding] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);

    useEffect(() => {
        sessionStorage.setItem('inventory_stockTab', stockTab);
        sessionStorage.setItem('inventory_groupByTab', groupByTab);
        sessionStorage.setItem('inventory_filterCategory', filterCategory);
        sessionStorage.setItem('inventory_filterLocation', filterLocation);
        sessionStorage.setItem('inventory_searchQuery', searchQuery);
    }, [stockTab, groupByTab, filterCategory, filterLocation, searchQuery]);

    // Handle click outside emoji picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    // New Ingredient State
    const [newIngredient, setNewIngredient] = useState({
        name: '',
        emoji: '',
        category: '無食材類型',
        stockStatus: 'In Stock',
        location: '常溫'
    });

    const categories = ['All', ...new Set(ingredients.map(i => i.category))];
    const locations = ['All', 'Refrigerated', 'Frozen', 'Room Temp'];

    // Helper function to get default location based on category
    const getDefaultLocationForCategory = (category) => {
        const categoryDefaults = {
            '原材料': '冷藏',
            '水果': '冷藏',
            '零食': '常溫',
            '半成品': '急凍',
            '調味料': '冷藏',
            '無食材類型': '常溫'
        };
        return categoryDefaults[category] || '常溫';
    };

    // Count ingredients for each tab
    const inStockCount = ingredients.filter(ing => ing.stockStatus === 'In Stock').length;
    const outOfStockCount = ingredients.filter(ing => ing.stockStatus === 'Out of Stock').length;

    // Filter ingredients based on current stock tab
    const currentStockIngredients = ingredients.filter(ing => {
        const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = filterCategory === 'All' || ing.category === filterCategory;

        // If searching, ignore stock status tab but respect category
        if (searchQuery) {
            return matchesSearch && matchesCat;
        }

        const matchesStock = stockTab === 'in-stock'
            ? ing.stockStatus === 'In Stock'
            : ing.stockStatus === 'Out of Stock';
        const matchesLoc = filterLocation === 'All' || ing.location === filterLocation;

        // For out of stock, location filter doesn't apply
        if (stockTab === 'out-of-stock') {
            return matchesStock && matchesCat;
        }
        return matchesStock && matchesCat && matchesLoc;
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
            if (!grouped[ing.defaultLocation]) {
                grouped[ing.defaultLocation] = [];
            }
            grouped[ing.defaultLocation].push(ing);
        });
        return grouped;
    };

    // Determine which grouping to use
    const groupedIngredients = groupByTab === 'category'
        ? groupByCategory(currentStockIngredients)
        : groupByLocation(currentStockIngredients);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newIngredient.name) return;

        const defaultLocation = getDefaultLocationForCategory(newIngredient.category);

        try {
            const addedIngredient = await addIngredient({
                ...newIngredient,
                defaultLocation: defaultLocation,
                location: newIngredient.stockStatus === 'Out of Stock' ? defaultLocation : newIngredient.location,
                history: []
            });

            setNewIngredient({ name: '', emoji: '', category: '無食材類型', stockStatus: 'In Stock', location: '常溫' });
            setIsAdding(false);
            setShowEmojiPicker(false);

            if (addedIngredient && addedIngredient.id) {
                navigate(`/inventory/${addedIngredient.id}`);
            }
        } catch (error) {
            console.error("Failed to add ingredient", error);
        }
    };

    // Handler to update location when category changes
    const handleCategoryChange = (category) => {
        const defaultLocation = getDefaultLocationForCategory(category);
        setNewIngredient({
            ...newIngredient,
            category: category,
            location: defaultLocation
        });
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h2>Inventory</h2>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button
                        className="btn btn-outline"
                        onClick={() => {
                            const dataStr = JSON.stringify(ingredients, null, 4);
                            navigator.clipboard.writeText(dataStr).then(() => {
                                alert('Ingredients data copied to clipboard! You can now paste it to the AI.');
                            });
                        }}
                    >
                        Copy Data JSON
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                        <Plus size={20} /> Add Item
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="card" style={{ marginBottom: 'var(--spacing-md)', border: '2px solid var(--color-primary)', padding: 'var(--spacing-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Add New Ingredient</h3>
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setShowEmojiPicker(false);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            {/* Emoji Picker */}
                            <div style={{ position: 'relative' }} ref={emojiPickerRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        fontSize: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {newIngredient.emoji || '➕'}
                                </button>
                                {showEmojiPicker && (
                                    <div style={{ position: 'absolute', top: '45px', left: 0, zIndex: 1000 }}>
                                        <EmojiPicker
                                            onEmojiClick={(emojiObject) => {
                                                setNewIngredient({ ...newIngredient, emoji: emojiObject.emoji });
                                                setShowEmojiPicker(false);
                                            }}
                                            width={300}
                                            height={350}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Name Input */}
                            <input
                                placeholder="Name (e.g. Milk)"
                                value={newIngredient.name}
                                onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                style={{ flex: 1, height: '42px', fontSize: '1rem' }}
                                autoFocus
                            />

                            {/* Save Button */}
                            <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 16px' }}>
                                {/* <Plus size={18} style={{ marginRight: '4px' }} /> */}
                                Save
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                            {/* Category Select */}
                            <select
                                value={newIngredient.category}
                                onChange={e => handleCategoryChange(e.target.value)}
                                style={{ height: '36px', fontSize: '0.9rem' }}
                            >
                                <option value="原材料">🥬 原材料</option>
                                <option value="水果">🍎 水果</option>
                                <option value="零食">🍪 零食</option>
                                <option value="半成品">📦 半成品</option>
                                <option value="調味料">🧂 調味料</option>
                                <option value="無食材類型">🍴 Uncategorized</option>
                            </select>

                            {/* Location Select */}
                            <select
                                value={newIngredient.location}
                                onChange={e => setNewIngredient({ ...newIngredient, location: e.target.value })}
                                disabled={newIngredient.stockStatus === 'Out of Stock'}
                                style={{ height: '36px', fontSize: '0.9rem' }}
                            >
                                <option value="冷藏">🧊 冷藏</option>
                                <option value="急凍">❄️ 急凍</option>
                                <option value="常溫">🌡️ 常溫</option>
                            </select>

                            {/* Stock Status Checkbox */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <input
                                    type="checkbox"
                                    checked={newIngredient.stockStatus === 'In Stock'}
                                    onChange={e => setNewIngredient({
                                        ...newIngredient,
                                        stockStatus: e.target.checked ? 'In Stock' : 'Out of Stock'
                                    })}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-success)' }}
                                />
                                <span style={{ color: newIngredient.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {newIngredient.stockStatus === 'In Stock' ? 'In Stock' : 'Out Stock'}
                                </span>
                            </label>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB NAVIGATION */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Stock Status Tabs */}
                <div style={{
                    backgroundColor: '#f0f0f0',
                    padding: '4px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    // border: '1px solid var(--color-tag-bg)'
                }}>
                    <button
                        onClick={() => setStockTab('in-stock')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: stockTab === 'in-stock' ? 'var(--color-secondary)' : 'transparent',
                            color: stockTab === 'in-stock' ? 'white' : '#BEBEBE',
                            boxShadow: stockTab === 'in-stock' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                        }}
                    >
                        {/* <CheckCircle size={16} /> */}
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
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: stockTab === 'out-of-stock' ? 'var(--color-secondary)' : 'transparent',
                            color: stockTab === 'out-of-stock' ? 'white' : '#BEBEBE',
                            boxShadow: stockTab === 'out-of-stock' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                        }}
                    >
                        {/* <AlertCircle size={16} /> */}
                        Out of Stock ({outOfStockCount})
                    </button>
                </div>

                {/* Group By Tabs */}
                <div style={{
                    backgroundColor: '#f0f0f0',
                    padding: '4px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    // border: '1px solid #e2e8f0'
                }}>
                    <button
                        onClick={() => setGroupByTab('category')}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: groupByTab === 'category' ? 'var(--color-secondary)' : 'transparent',
                            color: groupByTab === 'category' ? 'white' : '#BEBEBE',
                            boxShadow: groupByTab === 'category' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                        }}
                    >
                        {/* <LayoutGrid size={16} /> */}
                        By Category
                    </button>
                    <button
                        onClick={() => setGroupByTab('location')}
                        disabled={stockTab === 'out-of-stock'}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: 'none',
                            cursor: stockTab === 'out-of-stock' ? 'not-allowed' : 'pointer',
                            backgroundColor: groupByTab === 'location' ? 'var(--color-secondary)' : 'transparent',
                            color: groupByTab === 'location' ? 'white' : '#BEBEBE',
                            boxShadow: groupByTab === 'location' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                            opacity: stockTab === 'out-of-stock' ? 0.5 : 1,
                        }}
                    >
                        {/* <MapPin size={16} /> */}
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
                        style={{ paddingLeft: '36px', paddingRight: searchQuery ? '36px' : '12px', width: '100%' }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-muted)',
                                transition: 'color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-muted)'}
                            title="Clear search"
                        >
                            <X size={18} />
                        </button>
                    )}
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
                    Object.keys(groupedIngredients).sort(sortCategories).map(groupKey => (
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
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: 'var(--spacing-sm)'
                            }}>
                                {groupedIngredients[groupKey]
                                    .sort((a, b) => {
                                        // Helper to get days left
                                        const getDaysLeft = (ing) => {
                                            if (!ing.shelfLifeDays || !ing.boughtDate) return null;
                                            const bought = new Date(ing.boughtDate);
                                            const expiry = new Date(bought);
                                            expiry.setDate(bought.getDate() + ing.shelfLifeDays);
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            expiry.setHours(0, 0, 0, 0);
                                            return (expiry - today) / (1000 * 60 * 60 * 24);
                                        };

                                        const daysA = getDaysLeft(a);
                                        const daysB = getDaysLeft(b);

                                        // If both have expiry, sort by days left (ascending)
                                        if (daysA !== null && daysB !== null) {
                                            return daysA - daysB;
                                        }

                                        // If only A has expiry, it comes first
                                        if (daysA !== null) return -1;
                                        // If only B has expiry, it comes first
                                        if (daysB !== null) return 1;

                                        // Otherwise sort alphabetically
                                        return a.name.localeCompare(b.name);
                                    })
                                    .map(ing => (
                                        <IngredientCard key={ing.id} ingredient={ing} onCardClick={() => setSearchQuery('')} />
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
