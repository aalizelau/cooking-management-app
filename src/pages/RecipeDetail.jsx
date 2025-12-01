import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, CheckCircle, AlertCircle, Upload, Image, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { uploadRecipeImage, syncRecipeIngredients } from '../lib/supabase';

const RecipeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { recipes, updateRecipe, deleteRecipe, ingredients, cart, addToCart } = useApp();

    const [recipe, setRecipe] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedRecipe, setEditedRecipe] = useState(null);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageError, setImageError] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Convert id to number if recipes have numeric IDs
        const found = recipes.find(r => r.id == id);
        if (found) {
            setRecipe(found);

            // Initialize instruction sections for editing
            let sections = found.instructionSections || [];
            if (sections.length === 0 && found.steps && found.steps.length > 0) {
                sections = [{ title: "Instructions", steps: found.steps }];
            } else if (sections.length === 0) {
                sections = [{ title: "Instructions", steps: [] }];
            }

            setEditedRecipe({ ...found, instructionSections: sections });
            setImageError(false); // Reset error state when recipe changes
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
        setImageError(false);
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
                setImageError(false); // Reset error on new upload

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
        setImageError(false); // Reset error on URL change
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

    const handleSectionChange = (index, field, value) => {
        const newSections = [...editedRecipe.instructionSections];
        if (field === 'steps') {
            newSections[index][field] = value.split('\n');
        } else {
            newSections[index][field] = value;
        }
        setEditedRecipe({ ...editedRecipe, instructionSections: newSections });
    };

    const handleAddSection = () => {
        setEditedRecipe({
            ...editedRecipe,
            instructionSections: [
                ...editedRecipe.instructionSections,
                { title: "New Method", steps: [] }
            ]
        });
    };

    const handleDeleteSection = (index) => {
        const newSections = editedRecipe.instructionSections.filter((_, i) => i !== index);
        setEditedRecipe({ ...editedRecipe, instructionSections: newSections });
    };

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

            <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                {/* Top Section: Image + Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)', alignItems: 'start' }}>
                    {/* Left Column: Image */}
                    <div style={{ position: 'relative', aspectRatio: '4/3', backgroundColor: '#eee', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        {!imageError && editedRecipe?.image ? (
                            <img
                                src={editedRecipe.image}
                                alt={editedRecipe.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={() => setImageError(true)}
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
                                        opacity: uploadingImage ? 0.6 : 1,
                                        padding: '4px 8px',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    <Upload size={14} /> {uploadingImage ? '...' : 'Upload'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Title, Status, Ingredients */}
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Header: Title & Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
                            <div style={{ flex: 1 }}>
                                {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                        <input
                                            value={editedRecipe.title}
                                            onChange={e => setEditedRecipe({ ...editedRecipe, title: e.target.value })}
                                            style={{ fontSize: '2rem', fontWeight: 'bold', width: '100%', border: '1px solid var(--color-border)', padding: '8px', borderRadius: 'var(--radius-sm)' }}
                                            placeholder="Recipe Title"
                                        />
                                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                            <select
                                                value={editedRecipe.status}
                                                onChange={e => setEditedRecipe({ ...editedRecipe, status: e.target.value })}
                                                style={{ padding: '4px' }}
                                            >
                                                <option value="Done">Done</option>
                                                <option value="Side">Side</option>
                                                <option value="Half-done">Half-done</option>
                                                <option value="New">New</option>
                                            </select>
                                            <input
                                                value={editedRecipe.image || ''}
                                                onChange={e => handleImageUrlChange(e.target.value)}
                                                style={{ flex: 1, fontSize: '0.9rem', padding: '4px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                                                placeholder="Image URL..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h1 style={{ fontSize: '2rem', margin: '0 0 var(--spacing-xs) 0', lineHeight: 1.2 }}>{recipe.title}</h1>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                color: availabilityPct === 100 ? 'var(--color-success)' : 'var(--color-primary)'
                                            }}>
                                                {availabilityPct === 100 ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                                {availabilityPct}% Available
                                            </div>
                                            <span className="badge" style={{ backgroundColor: '#f0f0f0', fontSize: '0.9rem', padding: '4px 10px' }}>
                                                {recipe.status}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginLeft: 'var(--spacing-lg)' }}>
                                {isEditing ? (
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <button className="btn btn-outline" onClick={handleCancel}><X size={18} /> Cancel</button>
                                        <button className="btn btn-primary" onClick={handleSave}><Save size={18} /> Save</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
                                        <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                                            <Edit2 size={18} style={{ marginRight: '8px' }} /> Edit
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            style={{
                                                color: 'var(--color-danger)',
                                                borderColor: 'var(--color-danger)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '0.9rem',
                                                padding: '4px 8px'
                                            }}
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Ingredients List */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <h3 style={{ borderBottom: '2px solid var(--color-accent)', paddingBottom: '8px', marginBottom: 'var(--spacing-md)', marginTop: 0 }}>
                                Ingredients
                            </h3>

                            {isEditing ? (
                                <div>
                                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Linked Items</h4>
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
                                                style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
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

                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Text Ingredients</h4>
                                    <textarea
                                        value={(editedRecipe.ingredients || []).join('\n')}
                                        onChange={e => setEditedRecipe({ ...editedRecipe, ingredients: e.target.value.split('\n') })}
                                        rows={5}
                                        style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                        placeholder="One ingredient per line"
                                    />
                                </div>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {linkedIngredientsData.map(ing => {
                                        const isInCart = cart.some(item => item.ingredientId === ing.id);
                                        return (
                                            <li key={ing.id} style={{
                                                padding: '8px',
                                                marginBottom: '8px',
                                                backgroundColor: ing.stockStatus === 'In Stock' ? '#e6f4ea' : '#fff0f0',
                                                borderRadius: 'var(--radius-sm)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontWeight: '500' }}>{ing.name}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        color: ing.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {ing.stockStatus === 'In Stock' ? 'In Stock' : 'Out'}
                                                    </span>
                                                    {ing.stockStatus !== 'In Stock' && (
                                                        <button
                                                            onClick={() => !isInCart && addToCart(ing.id)}
                                                            disabled={isInCart}
                                                            style={{
                                                                padding: '4px 8px',
                                                                fontSize: '0.75rem',
                                                                backgroundColor: isInCart ? 'var(--color-success)' : 'var(--color-primary)',
                                                                color: 'white',
                                                                borderRadius: '4px',
                                                                cursor: isInCart ? 'default' : 'pointer',
                                                                opacity: isInCart ? 0.8 : 1,
                                                                border: 'none'
                                                            }}
                                                        >
                                                            {isInCart ? 'In Cart' : '+ Cart'}
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                    {(recipe.ingredients || []).map((line, idx) => (
                                        <li key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>{line}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* Instructions Section */}
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    {isEditing ? (
                        <div>
                            <h3 style={{ borderBottom: '2px solid var(--color-accent)', paddingBottom: '8px', marginBottom: 'var(--spacing-md)' }}>
                                Instructions
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                                {(editedRecipe.instructionSections || []).map((section, idx) => (
                                    <div key={idx} style={{ padding: 'var(--spacing-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: '#f9f9f9' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                            <div style={{ flex: 1, marginRight: 'var(--spacing-md)' }}>
                                                <input
                                                    value={section.title}
                                                    onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                                                    style={{ fontWeight: 'bold', fontSize: '1.1rem', width: '100%', padding: '4px', marginBottom: '4px' }}
                                                    placeholder="Method Title (e.g. Air Fryer)"
                                                />
                                                <input
                                                    value={section.link || ''}
                                                    onChange={(e) => handleSectionChange(idx, 'link', e.target.value)}
                                                    style={{ fontSize: '0.9rem', width: '100%', padding: '4px', color: 'var(--color-primary)' }}
                                                    placeholder="Reference Link (optional)"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSection(idx)}
                                                className="btn btn-outline"
                                                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '4px 8px', height: 'fit-content' }}
                                                disabled={(editedRecipe.instructionSections || []).length === 1}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <textarea
                                            value={(section.steps || []).join('\n')}
                                            onChange={(e) => handleSectionChange(idx, 'steps', e.target.value)}
                                            rows={8}
                                            style={{ width: '100%', padding: '8px' }}
                                            placeholder="One step per line"
                                        />
                                    </div>
                                ))}
                                <button onClick={handleAddSection} className="btn btn-outline" style={{ borderStyle: 'dashed' }}>
                                    <Plus size={18} style={{ marginRight: '8px' }} /> Add Cooking Method
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-xl)' }}>
                            {(recipe.instructionSections && recipe.instructionSections.length > 0 ? recipe.instructionSections : [{ title: "Instructions", steps: recipe.steps || [] }]).map((section, idx) => (
                                <div key={idx}>
                                    <h3 style={{
                                        borderBottom: '2px solid var(--color-accent)',
                                        paddingBottom: '8px',
                                        marginBottom: 'var(--spacing-md)',
                                        marginTop: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {section.title}
                                        {section.link && (
                                            <a
                                                href={section.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}
                                                title="Open Reference"
                                            >
                                                <ExternalLink size={18} />
                                            </a>
                                        )}
                                    </h3>
                                    <ol style={{ paddingLeft: '20px', marginTop: 0 }}>
                                        {(section.steps || []).map((step, stepIdx) => (
                                            <li key={stepIdx} style={{ marginBottom: '12px', lineHeight: 1.6 }}>{step}</li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Thoughts / 感想 Section */}
                <div>
                    <h3 style={{ borderBottom: '2px solid var(--color-accent)', paddingBottom: '8px', marginBottom: 'var(--spacing-md)' }}>
                        感想 (Thoughts)
                    </h3>
                    {isEditing ? (
                        <textarea
                            value={editedRecipe.thoughts || ''}
                            onChange={e => setEditedRecipe({ ...editedRecipe, thoughts: e.target.value })}
                            rows={5}
                            style={{ width: '100%', padding: '8px' }}
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
