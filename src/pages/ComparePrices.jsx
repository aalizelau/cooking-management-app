import React, { useState, useMemo } from 'react';
import { Search, Store, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import StoreLogo from '../components/StoreLogo';

const ComparePrices = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { ingredients } = useApp();
    const navigate = useNavigate();

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
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Price Comparison</h1>
                    <p className="text-muted">Compare prices by supermarket</p>
                </div>
            </header>

            <div className="search-bar" style={{ marginBottom: 'var(--spacing-lg)' }}>
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
                {Object.entries(filteredStores).map(([store, items]) => (
                    <div key={store} className="card" style={{ padding: 'var(--spacing-md)' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            marginBottom: 'var(--spacing-md)',
                            borderBottom: '1px solid var(--color-border)',
                            paddingBottom: 'var(--spacing-sm)'
                        }}>
                            <StoreLogo storeName={store} size={40} />
                            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{store}</h2>
                            <span className="badge badge-secondary" style={{ marginLeft: 'auto' }}>
                                {items.length} items
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
                            {items.map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    onClick={() => navigate(`/inventory/${item.id}`, { state: { from: 'compare' } })}
                                    style={{
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        padding: 'var(--spacing-md)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--color-border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                                            <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        fontSize: '1.2rem',
                                        fontWeight: '600',
                                        color: 'var(--color-primary)',
                                        marginTop: 'auto'
                                    }}>
                                        ${item.price}
                                    </div>
                                </div>
                            ))}
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
    );
};

export default ComparePrices;
