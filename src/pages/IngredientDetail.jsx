import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, MapPin, Store, Edit, Save, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const IngredientDetail = ({ id: propId }) => {
    const { id: paramId } = useParams();
    const id = propId || paramId;
    const navigate = useNavigate();
    const { ingredients, updateIngredient } = useApp();

    const [ingredient, setIngredient] = useState(null);
    const [newEntry, setNewEntry] = useState({ price: '', store: '', location: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        category: '',
        emoji: '',
        location: '',
        defaultLocation: ''
    });

    useEffect(() => {
        const found = ingredients.find(i => i.id === id);
        if (found) {
            setIngredient(found);
            setEditForm({
                name: found.name,
                category: found.category,
                emoji: found.emoji || '',
                location: found.location,
                defaultLocation: found.defaultLocation || found.location
            });
        }
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

    const handleSave = () => {
        updateIngredient(ingredient.id, {
            name: editForm.name,
            category: editForm.category,
            emoji: editForm.emoji,
            location: editForm.location,
            defaultLocation: editForm.defaultLocation
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditForm({
            name: ingredient.name,
            category: ingredient.category,
            emoji: ingredient.emoji || '',
            location: ingredient.location,
            defaultLocation: ingredient.defaultLocation || ingredient.location
        });
        setIsEditing(false);
    };

    return (
        <div>
            <button className="btn btn-outline" onClick={() => navigate('/inventory')} style={{ marginBottom: 'var(--spacing-md)' }}>
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Inventory
            </button>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ flex: 1 }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Emoji</label>
                                    <input
                                        value={editForm.emoji}
                                        onChange={e => setEditForm({ ...editForm, emoji: e.target.value })}
                                        placeholder="🍎 (Enter emoji)"
                                        style={{ width: '100px', fontSize: '1.5rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Name</label>
                                    <input
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        style={{ width: '100%', fontSize: '1.5rem', fontWeight: 'bold' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Category</label>
                                    <select
                                        value={editForm.category}
                                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Dairy">🥛 Dairy</option>
                                        <option value="Fruits">🍎 Fruits</option>
                                        <option value="Vegetables">🥬 Vegetables</option>
                                        <option value="Meat">🥩 Meat</option>
                                        <option value="Pantry">📦 Pantry</option>
                                        <option value="Snacks">🍪 Snacks</option>
                                        <option value="Beverages">☕ Beverages</option>
                                        <option value="General">🍴 General</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Current Location</label>
                                    <select
                                        value={editForm.location}
                                        onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Refrigerated">Refrigerated</option>
                                        <option value="Frozen">Frozen</option>
                                        <option value="Room Temp">Room Temp</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Default Location</label>
                                    <select
                                        value={editForm.defaultLocation}
                                        onChange={e => setEditForm({ ...editForm, defaultLocation: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Refrigerated">Refrigerated</option>
                                        <option value="Frozen">Frozen</option>
                                        <option value="Room Temp">Room Temp</option>
                                    </select>
                                    <small style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                                        Items will return to this location when restocked
                                    </small>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                                    {ingredient.emoji && <span style={{ fontSize: '2rem' }}>{ingredient.emoji}</span>}
                                    <h1 style={{ margin: 0 }}>{ingredient.name}</h1>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                    <span className="badge" style={{ backgroundColor: '#f0f0f0', color: '#555' }}>{ingredient.category}</span>
                                    <span className="badge" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
                                        📍 {ingredient.defaultLocation || ingredient.location}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                <button className="btn btn-outline" onClick={handleCancel}>
                                    <X size={18} /> Cancel
                                </button>
                                <button className="btn btn-primary" onClick={handleSave}>
                                    <Save size={18} /> Save
                                </button>
                            </div>
                        ) : (
                            <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                                <Edit size={18} /> Edit
                            </button>
                        )}
                        {!isEditing && (
                            <>
                                <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: ingredient.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)'
                                }}>
                                    {ingredient.stockStatus}
                                </div>
                            </>
                        )}
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
