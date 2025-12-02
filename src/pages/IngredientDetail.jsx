import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, MapPin, Store, Edit, Save, X, ShoppingCart, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import EmojiPicker from 'emoji-picker-react';
import StoreLogo from '../components/StoreLogo';
import { SUPERMARKETS } from '../utils/stores';
import '../styles/IngredientDetail.css';

const IngredientDetail = ({ id: propId }) => {
    const { id: paramId } = useParams();
    const id = propId || paramId;
    const navigate = useNavigate();
    const location = useLocation();
    const backPath = location.state?.from === 'compare' ? '/compare' : '/inventory';
    const backLabel = location.state?.from === 'compare' ? 'Back to Compare' : 'Back to Inventory';

    const { ingredients, updateIngredient, deleteIngredient, addToCart, removeFromCart, cart, recipes } = useApp();
    const isInCart = cart.some(item => item.ingredientId === id);



    const [ingredient, setIngredient] = useState(null);
    const [newEntry, setNewEntry] = useState({ price: '', store: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        category: '',
        emoji: '',
        defaultLocation: '',
        stockStatus: '',
        history: [],
        storageTips: '',
        shelfLifeDays: '',
        boughtDate: '',
        notes: ''
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
                stockStatus: found.stockStatus,
                history: found.history || [],
                storageTips: found.storageTips || '',
                shelfLifeDays: found.shelfLifeDays || '',
                boughtDate: found.boughtDate || '',
                notes: found.notes || ''
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
            stockStatus: editForm.stockStatus,
            history: editForm.history,
            storageTips: editForm.storageTips,
            shelfLifeDays: editForm.shelfLifeDays,
            boughtDate: editForm.boughtDate,
            notes: editForm.notes
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
            stockStatus: ingredient.stockStatus,
            history: ingredient.history || [],
            storageTips: ingredient.storageTips || '',
            shelfLifeDays: ingredient.shelfLifeDays || '',
            boughtDate: ingredient.boughtDate || '',
            notes: ingredient.notes || ''
        });
        setIsEditing(false);
        setShowEmojiPicker(false);
    };

    const handleHistoryChange = (entryId, field, value) => {
        setEditForm({
            ...editForm,
            history: editForm.history.map(entry =>
                entry.id === entryId ? { ...entry, [field]: value } : entry
            )
        });
    };

    const handleDeleteHistoryEntry = (entryId) => {
        setEditForm({
            ...editForm,
            history: editForm.history.filter(entry => entry.id !== entryId)
        });
    };

    const handleDelete = async () => {
        try {
            // Remove from cart if it's in the cart
            if (isInCart) {
                await removeFromCart(ingredient.id);
            }
            // Delete the ingredient
            await deleteIngredient(ingredient.id);
            // Navigate back to inventory
            navigate('/inventory');
        } catch (err) {
            console.error('Failed to delete ingredient:', err);
            alert('Failed to delete ingredient. Please try again.');
        }
    };

    return (
        <div className="ingredient-detail-container">
            <button className="btn btn-outline" onClick={() => navigate(backPath)} style={{ marginBottom: 'var(--spacing-md)' }}>
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> {backLabel}
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
                                        <option value="原材料">🥬 原材料 (Raw Materials)</option>
                                        <option value="水果">🍎 水果 (Fruits)</option>
                                        <option value="零食">🍪 零食 (Snacks)</option>
                                        <option value="半成品">📦 半成品 (Semi-finished)</option>
                                        <option value="調味料">🧂 調味料 (Seasonings)</option>
                                        <option value="無食材類型">🍴 無食材類型 (Uncategorized)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Default Location</label>
                                    <select
                                        value={editForm.defaultLocation}
                                        onChange={e => setEditForm({ ...editForm, defaultLocation: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="冷藏">冷藏 (Refrigerated)</option>
                                        <option value="急凍">急凍 (Frozen)</option>
                                        <option value="常溫">常溫 (Room Temp)</option>
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
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Expiry Tracking</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>保質期 (Shelf Life Days)</label>
                                            <input
                                                type="number"
                                                value={editForm.shelfLifeDays || ''}
                                                onChange={e => setEditForm({ ...editForm, shelfLifeDays: parseInt(e.target.value) || '' })}
                                                placeholder="e.g. 7"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>Bought Date</label>
                                            <input
                                                type="date"
                                                value={editForm.boughtDate || ''}
                                                onChange={e => setEditForm({ ...editForm, boughtDate: e.target.value })}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>一般儲存時限 (Storage Tips)</label>
                                        <input
                                            value={editForm.storageTips || ''}
                                            onChange={e => setEditForm({ ...editForm, storageTips: e.target.value })}
                                            placeholder="e.g. Keep refrigerated, consume within 3 days"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>個人筆記 (Personal Notes)</label>
                                        <textarea
                                            value={editForm.notes || ''}
                                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                            placeholder="e.g. 荷蘭豆是扁扁的豆角是長長的四季豆是比較短的"
                                            rows={3}
                                            style={{ width: '100%', resize: 'vertical' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                                    {ingredient.emoji && <span style={{ fontSize: '2rem' }}>{ingredient.emoji}</span>}
                                    <h1 style={{ margin: 0 }}>{ingredient.name}</h1>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                                    <span className="badge" style={{ backgroundColor: 'var(--color-tag-bg)', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{ingredient.category}</span>
                                    <span className="badge" style={{ backgroundColor: 'var(--color-tag-bg)', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                                        {ingredient.defaultLocation}
                                    </span>
                                    {!isEditing && (
                                        <>
                                            <span
                                                className="badge"
                                                onClick={() => updateIngredient(ingredient.id, {
                                                    stockStatus: ingredient.stockStatus === 'In Stock' ? 'Out of Stock' : 'In Stock'
                                                })}
                                                style={{
                                                    backgroundColor: ingredient.stockStatus === 'In Stock' ? 'var(--color-primary)' : 'var(--color-tag-bg)',
                                                    color: ingredient.stockStatus === 'In Stock' ? '#fff' : 'var(--color-text)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {ingredient.stockStatus === 'In Stock' ? 'In Stock' : 'Out of Stock'}
                                            </span>
                                            <span
                                                className="badge"
                                                onClick={() => isInCart ? removeFromCart(ingredient.id) : addToCart(ingredient.id)}
                                                style={{
                                                    backgroundColor: isInCart ? 'var(--color-primary)' : 'var(--color-tag-bg)',
                                                    color: isInCart ? '#fff' : 'var(--color-text)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {/* <ShoppingCart size={12} /> */}
                                                {isInCart ? 'In Cart' : 'Add to Cart'}
                                            </span>
                                        </>
                                    )}
                                </div>
                                {(ingredient.shelfLifeDays || ingredient.boughtDate || ingredient.storageTips) && (
                                    <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', backgroundColor: '#f9fafb', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                                        <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.9rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Expiry Tracking</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                            {ingredient.shelfLifeDays && (
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Shelf Life</div>
                                                    <div style={{ fontWeight: '600' }}>{ingredient.shelfLifeDays} days</div>
                                                </div>
                                            )}
                                            {ingredient.boughtDate && (
                                                <div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Bought Date</div>
                                                    <div style={{ fontWeight: '600' }}>{new Date(ingredient.boughtDate).toLocaleDateString()}</div>
                                                </div>
                                            )}
                                        </div>
                                        {ingredient.storageTips && (
                                            <div style={{ marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid #eee' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Storage Tips</div>
                                                <div>{ingredient.storageTips}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {ingredient.notes && (
                                    <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)', backgroundColor: '#fffbf0', borderRadius: 'var(--radius-md)', border: '1px solid #f0e5c8' }}>
                                        <h4 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: '0.9rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>個人筆記 (Personal Notes)</h4>
                                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{ingredient.notes}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                    <button className="btn btn-outline" onClick={handleCancel}>
                                        <X size={18} /> Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSave}>
                                        <Save size={18} /> Save
                                    </button>
                                </div>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{
                                        color: 'var(--color-danger)',
                                        borderColor: 'var(--color-danger)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        marginTop: 'var(--spacing-sm)',
                                        fontSize: '0.85rem',
                                        padding: '4px 8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--color-danger)';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '';
                                        e.currentTarget.style.color = 'var(--color-danger)';
                                    }}
                                >
                                    <Trash2 size={16} /> Delete Ingredient
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                                    <Edit size={18} /> Edit
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                <div className="price-history-grid">
                    <div>
                        <h3>Price History</h3>
                        <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {isEditing ? (
                                editForm.history.length === 0 ? (
                                    <p style={{ color: 'var(--color-muted)' }}>No price history yet.</p>
                                ) : (
                                    editForm.history.map(entry => (
                                        <div key={entry.id} className="history-entry-edit">
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Store</label>
                                                <select
                                                    value={entry.store}
                                                    onChange={e => handleHistoryChange(entry.id, 'store', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: '1px solid var(--color-border)',
                                                        backgroundColor: 'white'
                                                    }}
                                                >
                                                    <option value="" disabled>Select Store</option>
                                                    {SUPERMARKETS.map(store => (
                                                        <option key={store} value={store}>{store}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ width: '120px' }}>
                                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Price</label>
                                                <input
                                                    value={entry.price}
                                                    onChange={e => handleHistoryChange(entry.id, 'price', e.target.value)}
                                                    type="text"
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteHistoryEntry(entry.id)}
                                                className="btn btn-outline"
                                                style={{
                                                    marginTop: '20px',
                                                    padding: '8px',
                                                    minWidth: 'auto',
                                                    color: 'var(--color-danger)',
                                                    borderColor: 'var(--color-danger)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'var(--color-danger)';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = '';
                                                    e.currentTarget.style.color = 'var(--color-danger)';
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )
                            ) : (
                                (ingredient.history || []).length === 0 ? (
                                    <p style={{ color: 'var(--color-muted)' }}>No price history yet.</p>
                                ) : (
                                    (ingredient.history || []).map(entry => (
                                        <div key={entry.id} className="history-entry-card">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <StoreLogo storeName={entry.store} size={32} />
                                                <div style={{ fontWeight: 'bold' }}>{entry.store}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                                ${entry.price}
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>

                    <div>
                        <h3>Add New Entry</h3>
                        <form onSubmit={handleAddEntry} style={{ marginTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Store</label>
                                <div className="store-select-wrapper">
                                    <Store size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                                    <select
                                        value={newEntry.store}
                                        onChange={e => setNewEntry({ ...newEntry, store: e.target.value })}
                                        style={{
                                            width: '100%',
                                            paddingLeft: '32px',
                                            height: '40px',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--color-border)',
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <option value="" disabled>Select Store</option>
                                        {SUPERMARKETS.map(store => (
                                            <option key={store} value={store}>{store}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>Price (CAD)</label>
                                <div className="price-input-wrapper">
                                    <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                                    <input
                                        value={newEntry.price}
                                        onChange={e => setNewEntry({ ...newEntry, price: e.target.value })}
                                        placeholder="e.g. 7.99"
                                        type="text"
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

            {/* Linked Recipes Section */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h3>Linked Recipes</h3>
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                    {recipes.filter(r => (r.linkedIngredientIds || []).includes(ingredient.id)).length === 0 ? (
                        <p style={{ color: 'var(--color-muted)' }}>No recipes linked to this ingredient yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                            {recipes.filter(r => (r.linkedIngredientIds || []).includes(ingredient.id)).map(recipe => (
                                <div
                                    key={recipe.id}
                                    onClick={() => navigate(`/recipes/${recipe.id}`)}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease',
                                        backgroundColor: 'white'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ height: '120px', backgroundColor: '#eee', position: 'relative' }}>
                                        {recipe.image ? (
                                            <img
                                                src={recipe.image}
                                                alt={recipe.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2rem;">🍳</div>';
                                                }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '2rem' }}>🍳</span>
                                            </div>
                                        )}
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {recipe.status}
                                        </div>
                                    </div>
                                    <div style={{ padding: 'var(--spacing-sm)' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{recipe.title}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div className="card" style={{
                            maxWidth: '400px',
                            width: '90%',
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'white'
                        }}>
                            <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>Delete Ingredient?</h3>
                            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text)' }}>
                                Are you sure you want to delete <strong>{ingredient.name}</strong>? This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setShowDeleteConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn"
                                    onClick={handleDelete}
                                    style={{
                                        backgroundColor: 'var(--color-danger)',
                                        color: 'white',
                                        borderColor: 'var(--color-danger)'
                                    }}
                                >
                                    <Trash2 size={18} style={{ marginRight: '6px' }} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default IngredientDetail;
