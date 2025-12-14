import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, CheckCircle, AlertCircle, Upload, Image, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { uploadRecipeImage, syncRecipeIngredients } from '../lib/supabase';
import EmojiPicker from 'emoji-picker-react';

const RecipeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { recipes, updateRecipe, deleteRecipe, ingredients, cart, addToCart, addIngredient } = useApp();

    const [recipe, setRecipe] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedRecipe, setEditedRecipe] = useState(null);
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageError, setImageError] = useState(false);
    const fileInputRef = useRef(null);
    const [ingredientRequiredStatus, setIngredientRequiredStatus] = useState(new Map());

    // New Ingredient State
    const [isAddingIngredient, setIsAddingIngredient] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const [newIngredient, setNewIngredient] = useState({
        name: '',
        emoji: '',
        category: '無食材類型',
        stockStatus: 'In Stock',
        location: '常溫'
    });

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

    const handleCategoryChange = (category) => {
        const defaultLocation = getDefaultLocationForCategory(category);
        setNewIngredient({
            ...newIngredient,
            category: category,
            location: defaultLocation
        });
    };

    const handleAddIngredient = async (e) => {
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

            // Link to current recipe
            if (addedIngredient && addedIngredient.id) {
                toggleLinkedIngredient(addedIngredient.id);
            }

            setNewIngredient({ name: '', emoji: '', category: '無食材類型', stockStatus: 'In Stock', location: '常溫' });
            setIsAddingIngredient(false);
            setShowEmojiPicker(false);
        } catch (error) {
            console.error("Failed to add ingredient", error);
        }
    };

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

            // Initialize required status Map from linkedIngredientIds
            const requiredMap = new Map();
            if (found.linkedIngredientIds && Array.isArray(found.linkedIngredientIds)) {
                console.log('🔍 Loading linkedIngredientIds:', found.linkedIngredientIds);
                found.linkedIngredientIds.forEach(link => {
                    if (typeof link === 'object' && link.ingredientId) {
                        // New format: object with ingredientId and isRequired
                        console.log(`  ✅ Object format - ID: ${link.ingredientId}, Required: ${link.isRequired}`);
                        requiredMap.set(link.ingredientId, link.isRequired === true);
                    } else {
                        // Old format: just string ID, default to optional (false)
                        console.log(`  ⚠️ Old format - ID: ${link}`);
                        requiredMap.set(link, false);
                    }
                });
            }
            console.log('🗺️ Final requiredMap:', Array.from(requiredMap.entries()));
            setIngredientRequiredStatus(requiredMap);
        }
    }, [id, recipes]);

    if (!recipe) return <div>Recipe not found</div>;

    const toggleRequiredStatus = (ingredientId) => {
        const newMap = new Map(ingredientRequiredStatus);
        newMap.set(ingredientId, !newMap.get(ingredientId));
        setIngredientRequiredStatus(newMap);
    };

    const handleSave = async () => {
        try {
            // Build ingredient links with required status
            const ingredientLinks = (editedRecipe.linkedIngredientIds || []).map(linkOrId => {
                const ingredientId = typeof linkOrId === 'object' ? linkOrId.ingredientId : linkOrId;
                return {
                    ingredientId,
                    quantity: typeof linkOrId === 'object' ? linkOrId.quantity : null,
                    isRequired: ingredientRequiredStatus.get(ingredientId) === true
                };
            });

            // Update recipe in database
            await updateRecipe(recipe.id, editedRecipe);

            // Sync ingredient links to junction table with required status
            await syncRecipeIngredients(recipe.id, ingredientLinks);

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
        const currentIds = current.map(link => typeof link === 'object' ? link.ingredientId : link);

        if (currentIds.includes(ingId)) {
            // Remove ingredient
            setEditedRecipe({
                ...editedRecipe,
                linkedIngredientIds: current.filter(link => {
                    const id = typeof link === 'object' ? link.ingredientId : link;
                    return id !== ingId;
                })
            });
            // Remove from required status map
            const newMap = new Map(ingredientRequiredStatus);
            newMap.delete(ingId);
            setIngredientRequiredStatus(newMap);
        } else {
            // Add ingredient
            setEditedRecipe({
                ...editedRecipe,
                linkedIngredientIds: [...current, ingId]
            });
            // Initialize as optional (false) in required status map
            const newMap = new Map(ingredientRequiredStatus);
            newMap.set(ingId, false);
            setIngredientRequiredStatus(newMap);
        }
    };

    const availableIngredients = ingredients.filter(ing => {
        const currentIds = (editedRecipe.linkedIngredientIds || []).map(link =>
            typeof link === 'object' ? link.ingredientId : link
        );
        return ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) &&
            !currentIds.includes(ing.id);
    });

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
    const linkedIngredientsData = (recipe.linkedIngredientIds || []).map(link => {
        const ingredientId = typeof link === 'object' ? link.ingredientId : link;
        // Use ingredientRequiredStatus Map (source of truth for required status)
        const isRequired = ingredientRequiredStatus.get(ingredientId) === true;
        const ing = ingredients.find(i => i.id === ingredientId);

        if (ing) {
            return { ...ing, isRequired, found: true };
        } else {
            return {
                id: ingredientId,
                name: 'Unknown Ingredient',
                stockStatus: 'Unknown',
                isRequired,
                found: false
            };
        }
    }).sort((a, b) => {
        // Sort: Required first, then by stock status
        if (a.isRequired !== b.isRequired) {
            return a.isRequired ? -1 : 1;
        }
        // Then sort by stock status: Out of Stock first, then Low Stock, then In Stock
        const getScore = (status) => {
            if (status === 'Out of Stock') return 0;
            if (status === 'Low Stock') return 1;
            if (status === 'In Stock') return 2;
            return 3; // Unknown
        };
        return getScore(a.stockStatus) - getScore(b.stockStatus);
    });

    // Calculate percentage based on ALL ingredients
    const inStockCount = linkedIngredientsData.filter(i => i.stockStatus === 'In Stock').length;
    const totalLinked = linkedIngredientsData.length;
    const availabilityPct = totalLinked > 0 ? Math.round((inStockCount / totalLinked) * 100) : 0;

    // Calculate if recipe is "available" based on REQUIRED ingredients only
    const requiredIngredients = linkedIngredientsData.filter(i => i.isRequired);
    const requiredInStock = requiredIngredients.filter(i => i.stockStatus === 'In Stock');
    const isRecipeAvailable = requiredIngredients.length === 0 || requiredInStock.length === requiredIngredients.length;

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
                                                color: isRecipeAvailable ? 'var(--color-success)' : 'var(--color-danger)'
                                            }}>
                                                {isRecipeAvailable ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                                {isRecipeAvailable ? 'Available' : 'Unavailable'}
                                            </div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                color: 'var(--color-muted)',
                                                fontWeight: 'normal'
                                            }}>
                                                {availabilityPct}% in stock
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
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--spacing-sm)' }}>
                                            {(editedRecipe.linkedIngredientIds || []).map(link => {
                                                const id = typeof link === 'object' ? link.ingredientId : link;
                                                const ing = ingredients.find(i => i.id === id);
                                                const isRequired = ingredientRequiredStatus.get(id) === true;
                                                return (
                                                    <div key={id} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '6px 10px',
                                                        backgroundColor: isRequired ? '#fff9e6' : '#e0e0e0',
                                                        // borderRadius: 'var(--radius-sm)',
                                                        // border: isRequired ? '2px solid #ffc107' : 'none'
                                                    }}>
                                                        <label style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            cursor: 'pointer',
                                                            flex: 1,
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isRequired}
                                                                onChange={() => toggleRequiredStatus(id)}
                                                                style={{ accentColor: '#ffc107' }}
                                                            />
                                                            <span style={{ fontWeight: isRequired ? 'bold' : 'normal' }}>
                                                                {isRequired && '★ '}
                                                                {ing?.name || 'Unknown'}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                color: 'var(--color-muted)',
                                                                fontStyle: 'italic',
                                                                marginLeft: '4px'
                                                            }}>
                                                                {isRequired ? '(required)' : '(optional)'}
                                                            </span>
                                                        </label>
                                                        <button onClick={() => toggleLinkedIngredient(id)} style={{ padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                            <X size={16} />
                                                        </button>
                                                    </div>
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
                                                    {availableIngredients.length > 0 ? (
                                                        availableIngredients.map(ing => (
                                                            <div
                                                                key={ing.id}
                                                                onClick={() => { toggleLinkedIngredient(ing.id); setIngredientSearch(''); }}
                                                                style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                                            >
                                                                <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} /> {ing.name}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div style={{ padding: '8px', color: 'var(--color-muted)', fontStyle: 'italic' }}>
                                                            No matching ingredients found.
                                                        </div>
                                                    )}

                                                    {/* Quick Create Option */}
                                                    <div
                                                        onClick={() => {
                                                            setNewIngredient({ ...newIngredient, name: ingredientSearch });
                                                            setIsAddingIngredient(true);
                                                            setIngredientSearch('');
                                                        }}
                                                        style={{
                                                            padding: '8px',
                                                            cursor: 'pointer',
                                                            backgroundColor: '#f0f9ff',
                                                            color: 'var(--color-primary)',
                                                            fontWeight: '500',
                                                            borderTop: '1px solid #eee',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Plus size={14} style={{ marginRight: '4px' }} /> Create "{ingredientSearch}"
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Create New Ingredient Button/Form */}
                                    <div style={{ marginTop: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                                        {!isAddingIngredient ? (
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => setIsAddingIngredient(true)}
                                                style={{ width: '100%', borderStyle: 'dashed', fontSize: '0.9rem' }}
                                            >
                                                <Plus size={16} style={{ marginRight: '6px' }} /> Create New Ingredient
                                            </button>
                                        ) : (
                                            <div className="card" style={{ border: '1px solid var(--color-border)', padding: 'var(--spacing-sm)', backgroundColor: '#f9f9f9' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
                                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>New Ingredient</h4>
                                                    <button
                                                        onClick={() => {
                                                            setIsAddingIngredient(false);
                                                            setShowEmojiPicker(false);
                                                        }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                <form onSubmit={handleAddIngredient} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                                        {/* Emoji Picker */}
                                                        <div style={{ position: 'relative' }} ref={emojiPickerRef}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                                style={{
                                                                    width: '38px',
                                                                    height: '38px',
                                                                    fontSize: '1.2rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    border: '1px solid var(--color-border)',
                                                                    borderRadius: 'var(--radius-sm)',
                                                                    backgroundColor: 'white',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                {newIngredient.emoji || '➕'}
                                                            </button>
                                                            {showEmojiPicker && (
                                                                <div style={{ position: 'absolute', top: '40px', left: 0, zIndex: 1000 }}>
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
                                                            placeholder="Name"
                                                            value={newIngredient.name}
                                                            onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })}
                                                            style={{ flex: 1, height: '38px', fontSize: '0.95rem', padding: '0 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                            autoFocus
                                                        />

                                                        {/* Save Button */}
                                                        <button type="submit" className="btn btn-primary" style={{ height: '38px', padding: '0 12px', fontSize: '0.9rem' }}>
                                                            Save
                                                        </button>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                                                        {/* Category Select */}
                                                        <select
                                                            value={newIngredient.category}
                                                            onChange={e => handleCategoryChange(e.target.value)}
                                                            style={{ height: '32px', fontSize: '0.85rem', padding: '0 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                        >
                                                            <option value="原材料">🥬 原材料</option>
                                                            <option value="水果">🍎 水果</option>
                                                            <option value="零食">🍪 零食</option>
                                                            <option value="半成品">📦 半成品</option>
                                                            <option value="調味料">🧂 調味料</option>
                                                            <option value="無食材類型">🍴 Other</option>
                                                        </select>

                                                        {/* Location Select */}
                                                        <select
                                                            value={newIngredient.location}
                                                            onChange={e => setNewIngredient({ ...newIngredient, location: e.target.value })}
                                                            disabled={newIngredient.stockStatus === 'Out of Stock'}
                                                            style={{ height: '32px', fontSize: '0.85rem', padding: '0 4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                        >
                                                            <option value="冷藏">🧊 冷藏</option>
                                                            <option value="急凍">❄️ 急凍</option>
                                                            <option value="常溫">🌡️ 常溫</option>
                                                        </select>

                                                        {/* Stock Status Checkbox */}
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={newIngredient.stockStatus === 'In Stock'}
                                                                onChange={e => setNewIngredient({
                                                                    ...newIngredient,
                                                                    stockStatus: e.target.checked ? 'In Stock' : 'Out of Stock'
                                                                })}
                                                                style={{ width: '14px', height: '14px', accentColor: 'var(--color-success)' }}
                                                            />
                                                            <span style={{ color: newIngredient.stockStatus === 'In Stock' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                                                {newIngredient.stockStatus === 'In Stock' ? 'In' : 'Out'}
                                                            </span>
                                                        </label>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
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
                                                // borderRadius: 'var(--radius-sm)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                // border: ing.isRequired ? '2px solid #ffc107' : 'none',
                                                position: 'relative'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {ing.isRequired && <span style={{ color: '#ffc107', fontSize: '1rem' }}>★</span>}
                                                    <span style={{ fontWeight: ing.isRequired ? 'bold' : '500' }}>
                                                        {ing.name}
                                                        {!ing.isRequired && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                color: 'var(--color-muted)',
                                                                fontStyle: 'italic',
                                                                marginLeft: '6px'
                                                            }}>
                                                                (optional)
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
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
                                    <div style={{ marginTop: 0 }}>
                                        {(section.steps || []).map((step, stepIdx) => (
                                            <div key={stepIdx} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                                <div style={{
                                                    flexShrink: 0,
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'var(--color-primary)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold',
                                                    marginTop: '-2px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    {stepIdx + 1}
                                                </div>
                                                <div style={{ lineHeight: 1.6, flex: 1 }}>{step}</div>
                                            </div>
                                        ))}
                                    </div>
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
