import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, MapPin, Store, Edit, Save, X, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import EmojiPicker from 'emoji-picker-react';

const IngredientDetail = ({ id: propId }) => {
    const { id: paramId } = useParams();
    const id = propId || paramId;
    const navigate = useNavigate();
    const { ingredients, updateIngredient, addToCart, removeFromCart, cart } = useApp();
    const isInCart = cart.includes(id);

    const [ingredient, setIngredient] = useState(null);
    const [newEntry, setNewEntry] = useState({ price: '', store: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        category: '',
        emoji: '',
        defaultLocation: '',
        stockStatus: ''
    });
    const emojiPickerRef = useRef(null);

    useEffect(() => {
        const found = ingredients.find(i => i.id === id);
        if (found) {
            setIngredient(found);
            setEditForm({
                name: found.name,
                category: found.category,
                emoji: found.emoji || '',
                defaultLocation: found.defaultLocation,
                stockStatus: found.stockStatus
            });
        }
    }, [id, ingredients]);

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

    if (!ingredient) return <div>Ingredient not found</div>;

    const handleAddEntry = (e) => {
        e.preventDefault();
        if (!newEntry.price || !newEntry.store) return;

        const updatedHistory = [
            ...(ingredient.history || []),
            {
                id: Date.now(),
                price: newEntry.price,
                store: newEntry.store
            }
        ];

        updateIngredient(ingredient.id, { history: updatedHistory });
        setNewEntry({ price: '', store: '' });
    };

    const handleSave = () => {
        updateIngredient(ingredient.id, {
            name: editForm.name,
            category: editForm.category,
            emoji: editForm.emoji,
            defaultLocation: editForm.defaultLocation,
            stockStatus: editForm.stockStatus
        });
        setIsEditing(false);
        setShowEmojiPicker(false);
    };

    const handleCancel = () => {
        setEditForm({
            name: ingredient.name,
            category: ingredient.category,
            emoji: ingredient.emoji || '',
            defaultLocation: ingredient.defaultLocation,
            stockStatus: ingredient.stockStatus
        });
        setIsEditing(false);
        setShowEmojiPicker(false);
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
                                    <div style={{ position: 'relative' }} ref={emojiPickerRef}>
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                fontSize: '2.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid var(--color-border)',
                                                borderRadius: 'var(--radius-sm)',
                                                backgroundColor: 'var(--color-bg-secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            {editForm.emoji || '➕'}
                                        </button>
                                        {showEmojiPicker && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '85px',
                                                left: 0,
                                                zIndex: 1000
                                            }}>
                                                <EmojiPicker
                                                    onEmojiClick={(emojiObject) => {
                                                        setEditForm({ ...editForm, emoji: emojiObject.emoji });
                                                        setShowEmojiPicker(false);
                                                    }}
                                                    width={350}
                                                    height={400}
                                                />
                                            </div>
                                        )}
                                    </div>
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
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={editForm.stockStatus === 'In Stock'}
                                            onChange={e => setEditForm({
                                                ...editForm,
                                                stockStatus: e.target.checked ? 'In Stock' : 'Out of Stock'
                                            })}
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                accentColor: 'var(--color-success)'
                                            }}
                                        />
                                        <span style={{
                                            color: editForm.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)',
                                            fontWeight: 'bold'
                                        }}>
                                            {editForm.stockStatus === 'In Stock' ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                    </label>
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
                                        📍 {ingredient.defaultLocation}
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                <button
                                    onClick={() => updateIngredient(ingredient.id, {
                                        stockStatus: ingredient.stockStatus === 'In Stock' ? 'Out of Stock' : 'In Stock'
                                    })}
                                    className="btn"
                                    style={{
                                        backgroundColor: ingredient.stockStatus === 'In Stock' ? 'var(--color-success)' : '#fff',
                                        color: ingredient.stockStatus === 'In Stock' ? '#fff' : 'var(--color-danger)',
                                        border: `1px solid ${ingredient.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)'}`,
                                        minWidth: '120px'
                                    }}
                                >
                                    {ingredient.stockStatus}
                                </button>

                                <button
                                    onClick={() => isInCart ? removeFromCart(ingredient.id) : addToCart(ingredient.id)}
                                    className="btn btn-outline"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        backgroundColor: isInCart ? 'var(--color-success)' : '#fff',
                                        color: isInCart ? '#fff' : 'var(--color-danger)',
                                        borderColor: isInCart ? 'var(--color-success)' : 'var(--color-danger)',
                                        minWidth: '120px'
                                    }}
                                >
                                    <ShoppingCart size={16} />
                                    {isInCart ? 'In Cart' : 'Add to Cart'}
                                </button>
                            </div>
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
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                            {entry.price}
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
