import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, MapPin, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';

const IngredientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { ingredients, updateIngredient } = useApp();

    const [ingredient, setIngredient] = useState(null);
    const [newEntry, setNewEntry] = useState({ price: '', store: '', location: '' });

    useEffect(() => {
        const found = ingredients.find(i => i.id === id);
        if (found) setIngredient(found);
    }, [id, ingredients]);

    if (!ingredient) return <div>Ingredient not found</div>;

    const handleAddEntry = (e) => {
        e.preventDefault();
        if (!newEntry.price || !newEntry.store) return;

        const updatedHistory = [
            ...(ingredient.history || []),
            {
                id: Date.now(),
                date: new Date().toISOString(),
                price: newEntry.price,
                store: newEntry.store,
                location: newEntry.location || ingredient.location // Default to current location if not specified
            }
        ];

        updateIngredient(ingredient.id, { history: updatedHistory });
        setNewEntry({ price: '', store: '', location: '' });
    };

    return (
        <div>
            <button className="btn btn-outline" onClick={() => navigate('/inventory')} style={{ marginBottom: 'var(--spacing-md)' }}>
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Inventory
            </button>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-lg)' }}>
                    <div>
                        <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>{ingredient.name}</h1>
                        <span className="badge" style={{ backgroundColor: '#f0f0f0', color: '#555' }}>{ingredient.category}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: ingredient.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)'
                        }}>
                            {ingredient.stockStatus}
                        </div>
                        <div style={{ color: 'var(--color-muted)' }}>{ingredient.location}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
                    <div>
                        <h3>Price History</h3>
                        <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {(ingredient.history || []).length === 0 ? (
                                <p style={{ color: 'var(--color-muted)' }}>No price history yet.</p>
                            ) : (
                                (ingredient.history || []).map(entry => (
                                    <div key={entry.id} style={{
                                        padding: 'var(--spacing-sm)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-sm)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{entry.store}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                                                {new Date(entry.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                            {entry.price} CAD
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <h3>Add New Entry</h3>
                        <form onSubmit={handleAddEntry} style={{ marginTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Store</label>
                                <div style={{ position: 'relative' }}>
                                    <Store size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                                    <input
                                        value={newEntry.store}
                                        onChange={e => setNewEntry({ ...newEntry, store: e.target.value })}
                                        placeholder="e.g. Costco"
                                        style={{ width: '100%', paddingLeft: '32px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Price (CAD)</label>
                                <div style={{ position: 'relative' }}>
                                    <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                                    <input
                                        value={newEntry.price}
                                        onChange={e => setNewEntry({ ...newEntry, price: e.target.value })}
                                        placeholder="e.g. 7.99"
                                        type="number"
                                        step="0.01"
                                        style={{ width: '100%', paddingLeft: '32px' }}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary">
                                <Plus size={18} style={{ marginRight: '8px' }} /> Add Entry
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IngredientDetail;
