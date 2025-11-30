import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, CheckCircle, AlertCircle, Upload, Image } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { uploadRecipeImage, syncRecipeIngredients } from '../lib/supabase';

const RecipeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { recipes, updateRecipe, deleteRecipe, ingredients } = useApp();

    const [recipe, setRecipe] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedRecipe, setEditedRecipe] = useState(null);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Convert id to number if recipes have numeric IDs
        const found = recipes.find(r => r.id == id);
        if (found) {
            setRecipe(found);
            setEditedRecipe(found);
        }
    }, [id, recipes]);

    if (!recipe) return <div>Recipe not found</div>;

    const handleSave = async () => {
        try {
            // Update recipe in database
            await updateRecipe(recipe.id, editedRecipe);

            // Sync ingredient links to junction table
            await syncRecipeIngredients(recipe.id, editedRecipe.linkedIngredientIds || []);

            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save recipe:', error);
            alert('Failed to save recipe. Please try again.');
        }
    };

    const handleCancel = () => {
        setEditedRecipe(recipe);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        try {
            await deleteRecipe(recipe.id);
            navigate('/recipes');
        } catch (err) {
            console.error('Failed to delete recipe:', err);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setUploadingImage(true);

                // Upload to Supabase Storage
                const publicUrl = await uploadRecipeImage(file, recipe.id);

                // Set the public URL instead of Base64
                setEditedRecipe({ ...editedRecipe, image: publicUrl });

                console.log('✅ Image uploaded successfully:', publicUrl);
            } catch (error) {
                console.error('Failed to upload image:', error);
                alert('Failed to upload image. Please try again.');
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const handleImageUrlChange = (url) => {
        setEditedRecipe({ ...editedRecipe, image: url });
    };

    const toggleLinkedIngredient = (ingId) => {
        const current = editedRecipe.linkedIngredientIds || [];
        if (current.includes(ingId)) {
            setEditedRecipe({
                ...editedRecipe,
                linkedIngredientIds: current.filter(id => id !== ingId)
            });
        } else {
            setEditedRecipe({
                ...editedRecipe,
                linkedIngredientIds: [...current, ingId]
            });
        }
    };

    const availableIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
        !editedRecipe.linkedIngredientIds?.includes(ing.id)
    );

    // Calculate Availability for View Mode
    const linkedIngredientsData = (recipe.linkedIngredientIds || []).map(linkId => {
        const ing = ingredients.find(i => i.id === linkId);
        return ing ? { ...ing, found: true } : { id: linkId, name: 'Unknown Ingredient', stockStatus: 'Unknown', found: false };
    });

    const inStockCount = linkedIngredientsData.filter(i => i.stockStatus === 'In Stock').length;
    const totalLinked = linkedIngredientsData.length;
    const availabilityPct = totalLinked > 0 ? Math.round((inStockCount / totalLinked) * 100) : 0;

    return (
        <div style={{ paddingBottom: 'var(--spacing-xl)' }}>
            <button className="btn btn-outline" onClick={() => navigate('/recipes')} style={{ marginBottom: 'var(--spacing-md)' }}>
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Recipes
            </button>

            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ height: '300px', position: 'relative', backgroundColor: '#eee' }}>
                    {editedRecipe?.image ? (
                        <img
                            src={editedRecipe.image}
                            alt={editedRecipe.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;">🍳</div>';
                            }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '3rem' }}>🍳</span>
                        </div>
                    )}

                    {/* Image Upload Button in Edit Mode */}
                    {isEditing && (
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            display: 'flex',
                            gap: '8px'
                        }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current.click()}
                                className="btn btn-outline"
                                disabled={uploadingImage}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: uploadingImage ? 0.6 : 1
                                }}
                            >
                                <Upload size={18} /> {uploadingImage ? 'Uploading...' : 'Upload Image'}
                            </button>
                        </div>
                    )}

                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        padding: 'var(--spacing-lg)',
                        color: 'white'
                    }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                <input
                                    value={editedRecipe.title}
                                    onChange={e => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
                                    style={{ fontSize: '2rem', fontWeight: 'bold', width: '100%', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
                                    placeholder="Recipe Title"
                                />
                                <input
                                    value={editedRecipe.image || ''}
                                    onChange={e => handleImageUrlChange(e.target.value)}
                                    style={{ fontSize: '0.9rem', width: '100%', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px' }}
                                    placeholder="Or paste image URL here..."
                                />
                            </div>
                        ) : (
                            <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-xs)' }}>{recipe.title}</h1>
                        )}
                    </div>
                </div>

                <div style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ flex: 1 }}>
                            {isEditing ? (
                                <textarea
                                    value={editedRecipe.description}
                                    onChange={e => setEditedRecipe({ ...editedRecipe, description: e.target.value })}
                                    style={{ width: '100%', minHeight: '80px', marginBottom: 'var(--spacing-md)', display: 'none' }} // Hidden in edit mode too as per request
                                />
                            ) : (
                                null // Description removed
                            )}

                            {!isEditing && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        color: availabilityPct === 100 ? 'var(--color-success)' : 'var(--color-primary)'
                                    }}>
                                        {availabilityPct === 100 ? <CheckCircle /> : <AlertCircle />}
                                        {availabilityPct}% Ingredients Available
                                    </div>
                                    <span className="badge" style={{ backgroundColor: '#f0f0f0', fontSize: '1rem', padding: '4px 12px' }}>
                                        Status: {recipe.status}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={{ marginLeft: 'var(--spacing-lg)' }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button className="btn btn-outline" onClick={handleCancel}><X size={18} /> Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSave}><Save size={18} /> Save Changes</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                                        <Edit2 size={18} style={{ marginRight: '8px' }} /> Edit Recipe
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        style={{
                                            color: 'var(--color-danger)',
                                            borderColor: 'var(--color-danger)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
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
                                        <Trash2 size={18} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)' }}>
                        {/* Ingredients Section */}
                        <div>
                            <h3 style={{ borderBottom: '2px solid var(--color-accent)', paddingBottom: '8px', marginBottom: 'var(--spacing-md)' }}>
                                Ingredients
                            </h3>

                            {isEditing ? (
                                <div>
                                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <h4>Linked Inventory Items</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--spacing-sm)' }}>
                                            {(editedRecipe.linkedIngredientIds || []).map(id => {
                                                const ing = ingredients.find(i => i.id === id);
                                                return (
                                                    <span key={id} className="badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#e0e0e0' }}>
                                                        {ing?.name || 'Unknown'}
                                                        <button onClick={() => toggleLinkedIngredient(id)} style={{ padding: 0 }}><X size={14} /></button>
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        <div style={{ position: 'relative' }}>
                                            <input
                                                placeholder="Search inventory to link..."
                                                value={ingredientSearch}
                                                onChange={e => setIngredientSearch(e.target.value)}
                                                style={{ width: '100%' }}
                                            />
                                            {ingredientSearch && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    right: 0,
                                                    backgroundColor: 'white',
                                                    border: '1px solid var(--color-border)',
                                                    zIndex: 10,
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    boxShadow: 'var(--shadow-md)'
                                                }}>
                                                    {availableIngredients.map(ing => (
                                                        <div
                                                            key={ing.id}
                                                            onClick={() => { toggleLinkedIngredient(ing.id); setIngredientSearch(''); }}
                                                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                                        >
                                                            <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} /> {ing.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h4>Text Ingredients</h4>
                                    <textarea
                                        value={(editedRecipe.ingredients || []).join('\n')}
                                        onChange={e => setEditedRecipe({ ...editedRecipe, ingredients: e.target.value.split('\n') })}
                                        rows={5}
                                        style={{ width: '100%' }}
                                        placeholder="One ingredient per line"
                                    />
                                </div>
                            ) : (
                                <ul style={{ listStyle: 'none' }}>
                                    {/* Show Linked Ingredients Status */}
                                    {linkedIngredientsData.map(ing => (
                                        <li key={ing.id} style={{
                                            padding: '8px',
                                            marginBottom: '8px',
                                            backgroundColor: ing.stockStatus === 'In Stock' ? '#e6f4ea' : '#fff0f0',
                                            borderRadius: 'var(--radius-sm)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>{ing.name}</span>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                color: ing.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)'
                                            }}>
                                                {ing.stockStatus}
                                            </span>
                                        </li>
                                    ))}

                                    {/* Show Text Ingredients if not linked */}
                                    {(recipe.ingredients || []).map((line, idx) => (
                                        <li key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>{line}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Steps Section */}
                        <div>
                            <h3 style={{ borderBottom: '2px solid var(--color-accent)', paddingBottom: '8px', marginBottom: 'var(--spacing-md)' }}>
                                Instructions
                            </h3>
                            {isEditing ? (
                                <textarea
                                    value={(editedRecipe.steps || []).join('\n')}
                                    onChange={e => setEditedRecipe({ ...editedRecipe, steps: e.target.value.split('\n') })}
                                    rows={10}
                                    style={{ width: '100%' }}
                                    placeholder="One step per line"
                                />
                            ) : (
                                <ol style={{ paddingLeft: '20px' }}>
                                    {(recipe.steps || []).map((step, idx) => (
                                        <li key={idx} style={{ marginBottom: '12px', lineHeight: 1.6 }}>{step}</li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>

                    {/* Thoughts / 感想 Section */}
                    <div style={{ marginTop: 'var(--spacing-xl)' }}>
                        <h3 style={{ borderBottom: '2px solid var(--color-accent)', paddingBottom: '8px', marginBottom: 'var(--spacing-md)' }}>
                            感想 (Thoughts)
                        </h3>
                        {isEditing ? (
                            <textarea
                                value={editedRecipe.thoughts || ''}
                                onChange={e => setEditedRecipe({ ...editedRecipe, thoughts: e.target.value })}
                                rows={5}
                                style={{ width: '100%' }}
                                placeholder="Write your thoughts, tips, or memories about this recipe..."
                            />
                        ) : (
                            <div style={{
                                backgroundColor: '#f9f9f9',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                fontStyle: 'italic',
                                whiteSpace: 'pre-wrap',
                                color: recipe.thoughts ? 'inherit' : 'var(--color-muted)'
                            }}>
                                {recipe.thoughts || 'No thoughts recorded yet.'}
                            </div>
                        )}
                    </div>
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
                            <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>Delete Recipe?</h3>
                            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text)' }}>
                                Are you sure you want to delete <strong>{recipe.title}</strong>? This action cannot be undone.
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
                                    Delete Recipe
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default RecipeDetail;
