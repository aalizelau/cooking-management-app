import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StoreLogo from '../components/StoreLogo';
import IngredientDetail from './IngredientDetail';
import { SUPERMARKETS } from '../utils/stores';

const ComparePrices = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIngredientId, setSelectedIngredientId] = useState(null);
    const { ingredients } = useApp();

    const storeData = useMemo(() => {
        const data = {};

        ingredients.forEach(ingredient => {
            if (ingredient.history && ingredient.history.length > 0) {
                ingredient.history.forEach(record => {
                    const storeName = record.store || 'Unknown Store';
                    if (!data[storeName]) {
                        data[storeName] = [];
                    }

                    // Avoid duplicates if multiple history entries for same store
                    // Show all unique price points for that store
                    const exists = data[storeName].some(item =>
                        item.id === ingredient.id && item.price === record.price
                    );

                    if (!exists) {
                        data[storeName].push({
                            id: ingredient.id,
                            name: ingredient.name,
                            emoji: ingredient.emoji,
                            price: record.price
                        });
                    }
                });
            }
        });
        return data;
    }, [ingredients]);

    const filteredStores = Object.entries(storeData).reduce((acc, [store, items]) => {
        const filteredItems = items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredItems.length > 0 || store.toLowerCase().includes(searchTerm.toLowerCase())) {
            // If store matches, show all items. If item matches, show only matched items.
            // But usually if searching for "apple", we want to see apple in all stores.
            // If searching for "metro", we want to see all items in metro.

            if (store.toLowerCase().includes(searchTerm.toLowerCase())) {
                acc[store] = items;
            } else if (filteredItems.length > 0) {
                acc[store] = filteredItems;
            }
        }
        return acc;
    }, {});

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: 'var(--spacing-md)' }}>
            {/* Left Panel: Price Comparison */}
            <div style={{ flex: selectedIngredientId ? 1 : 'auto', overflowY: 'auto', paddingRight: 'var(--spacing-sm)' }}>
                <header className="page-header">
                    <div>
                        <h2 className="page-title">Price Comparison</h2>
                    </div>
                </header>

                <div className="search-bar-wrapper" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search ingredients or stores..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                {Object.entries(filteredStores)
                    .sort(([storeA], [storeB]) => {
                        const indexA = SUPERMARKETS.indexOf(storeA);
                        const indexB = SUPERMARKETS.indexOf(storeB);
                        // If both stores are in SUPERMARKETS, sort by their index
                        if (indexA !== -1 && indexB !== -1) {
                            return indexA - indexB;
                        }
                        // If only one is in SUPERMARKETS, prioritize it
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;
                        // If neither is in SUPERMARKETS, sort alphabetically
                        return storeA.localeCompare(storeB);
                    })
                    .map(([store, items]) => (
                    <div key={store} className="card" style={{ padding: 'var(--spacing-sm)' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            marginBottom: 'var(--spacing-sm)',
                            borderBottom: '1px solid var(--color-border)',
                            paddingBottom: 'var(--spacing-sm)'
                        }}>
                            <StoreLogo storeName={store} size={28} />
                            <h2 style={{ margin: 0, fontSize: '1rem' }}>{store}</h2>
                            <span className="badge badge-secondary" style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '2px 8px' }}>
                                {items.length} items
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--spacing-sm)' }}>
                            {items.map((item, index) => {
                                const isSelected = selectedIngredientId === item.id;
                                return (
                                    <div
                                        key={`${item.id}-${index}`}
                                        onClick={() => setSelectedIngredientId(item.id)}
                                        style={{
                                            backgroundColor: isSelected ? '#fff8f6' : 'var(--color-bg-secondary)',
                                            padding: 'var(--spacing-sm)',
                                            borderRadius: 'var(--radius-sm)',
                                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                                            <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.name}</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        color: 'var(--color-primary)',
                                        marginTop: 'auto'
                                    }}>
                                        ${item.price}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {Object.keys(filteredStores).length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-light)' }}>
                        No prices found matching your search.
                    </div>
                )}
                </div>
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-sm)' }}>
                        <button onClick={() => setSelectedIngredientId(null)} className="btn btn-icon">
                            <X size={20} />
                        </button>
                    </div>
                    <IngredientDetail id={selectedIngredientId} />
                </div>
            )}
        </div>
    );
};

export default ComparePrices;
