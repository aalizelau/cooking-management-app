import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchMealPlan, upsertMealPlan, deleteMealPlan } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Trash2, Calendar, ChevronDown } from 'lucide-react';

const MealPlanner = () => {
    const { recipes, ingredients } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekPlan, setWeekPlan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [draggedRecipe, setDraggedRecipe] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Calculate week days centered on currentDate
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 3 + i); // Start 3 days before current date
        return d;
    });

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        loadWeekPlan();
    }, [currentDate]);

    // Helper to calculate availability score (0-1)
    const getAvailabilityScore = (recipe) => {
        if (!recipe.linkedIngredientIds || recipe.linkedIngredientIds.length === 0) return 0;
        const inStockCount = recipe.linkedIngredientIds.reduce((count, id) => {
            const ingredient = ingredients.find(i => i.id === id);
            return count + (ingredient?.stockStatus === 'In Stock' ? 1 : 0);
        }, 0);
        return inStockCount / recipe.linkedIngredientIds.length;
    };

    // Group recipes by status and sort by availability
    const groupedRecipes = [...recipes]
        .sort((a, b) => getAvailabilityScore(b) - getAvailabilityScore(a))
        .reduce((acc, recipe) => {
            const status = recipe.status || 'Uncategorized';
            if (!acc[status]) acc[status] = [];
            acc[status].push(recipe);
            return acc;
        }, {});

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const loadWeekPlan = async () => {
        setLoading(true);
        try {
            const start = formatDate(weekDays[0]);
            const end = formatDate(weekDays[6]);
            const data = await fetchMealPlan(start, end);
            setWeekPlan(data || []);
        } catch (err) {
            console.error('Failed to load meal plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e, recipe, fromId = null) => {
        setDraggedRecipe(recipe);
        // Store both recipe ID and the source plan ID (if moving)
        const data = JSON.stringify({ recipeId: recipe.id, fromId });
        e.dataTransfer.setData('application/json', data);
        e.dataTransfer.effectAllowed = 'copyMove';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = async (e, date, slot) => {
        e.preventDefault();
        const json = e.dataTransfer.getData('application/json');
        if (!json) return;

        const { recipeId, fromId } = JSON.parse(json);

        if (!recipeId) return;

        const dateStr = formatDate(date);

        // If dropping in the same slot, do nothing
        if (fromId) {
            const existing = weekPlan.find(p => p.id === fromId);
            if (existing && existing.date === dateStr && existing.slot === slot) {
                return;
            }
        }

        // Optimistic update
        const newEntry = {
            date: dateStr,
            slot,
            recipe_id: recipeId,
            id: 'temp-' + Date.now() // Temporary ID
        };

        setWeekPlan(prev => {
            // Remove existing entry for this target slot if any
            let next = prev.filter(p => !(p.date === dateStr && p.slot === slot));

            // If moving, remove from old slot
            if (fromId) {
                next = next.filter(p => p.id !== fromId);
            }

            return [...next, newEntry];
        });

        try {
            // 1. If moving, delete old entry first (or update if we had an update API, but delete+insert is safer for unique constraints)
            if (fromId && !fromId.startsWith('temp-')) {
                await deleteMealPlan(fromId);
            }

            // 2. Insert new entry
            await upsertMealPlan(dateStr, slot, recipeId);

            loadWeekPlan(); // Reload to get real IDs
        } catch (err) {
            console.error('Failed to save meal plan:', err);
            alert('Failed to save meal plan');
            loadWeekPlan(); // Revert
        }
        setDraggedRecipe(null);
    };

    const handleRemove = async (id) => {
        if (!id) return;

        // Optimistic
        setWeekPlan(prev => prev.filter(p => p.id !== id));

        if (!id.startsWith('temp-')) {
            try {
                await deleteMealPlan(id);
            } catch (err) {
                console.error('Failed to delete meal plan:', err);
                loadWeekPlan(); // Revert
            }
        }
    };

    const getRecipe = (id) => recipes.find(r => r.id === id);

    const renderSlot = (date, slot) => {
        const dateStr = formatDate(date);
        const plan = weekPlan.find(p => p.date === dateStr && p.slot === slot);
        const recipe = plan ? getRecipe(plan.recipe_id) : null;

        return (
            <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date, slot)}
                draggable={!!recipe}
                onDragStart={(e) => recipe && handleDragStart(e, recipe, plan.id)}
                style={{
                    minHeight: '100px',
                    backgroundColor: recipe ? 'white' : 'rgba(0,0,0,0.02)',
                    border: '1px dashed var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: recipe ? 'space-between' : 'center',
                    alignItems: recipe ? 'stretch' : 'center',
                    transition: 'all 0.2s ease',
                    cursor: recipe ? 'grab' : 'default',
                    opacity: draggedRecipe && recipe && draggedRecipe.id === recipe.id && plan?.id ? 0.5 : 1
                }}
            >
                {recipe ? (
                    <>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'start' }}>
                            {recipe.image && (
                                <img
                                    src={recipe.image}
                                    alt={recipe.title}
                                    style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                />
                            )}
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', lineHeight: '1.2' }}>
                                {recipe.title}
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent drag start
                                handleRemove(plan.id);
                            }}
                            style={{
                                alignSelf: 'flex-end',
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-danger)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </>
                ) : (
                    <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>Drop here</span>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 'var(--spacing-lg)' }}>
            {/* Sidebar - Recipe Bank */}
            <div style={{
                width: '250px',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid var(--color-border)',
                paddingRight: 'var(--spacing-md)',
                overflowY: 'auto'
            }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Recipes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    {Object.entries(groupedRecipes).map(([category, categoryRecipes]) => (
                        <div key={category} style={{ marginBottom: 'var(--spacing-xs)' }}>
                            <button
                                onClick={() => toggleCategory(category)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    backgroundColor: 'var(--color-bg-secondary, #f8f9fa)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    color: 'var(--color-text)',
                                    marginBottom: '4px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover, #e9ecef)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary, #f8f9fa)'}
                            >
                                <span>{category}</span>
                                {expandedCategories[category] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>

                            {expandedCategories[category] && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', paddingLeft: '8px', marginTop: '4px' }}>
                                    {categoryRecipes.map(recipe => (
                                        <div
                                            key={recipe.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, recipe)}
                                            style={{
                                                padding: '10px',
                                                backgroundColor: 'white',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-sm)',
                                                cursor: 'grab',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                transition: 'transform 0.1s, box-shadow 0.1s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                                            }}
                                        >

                                            <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{recipe.title}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Calendar Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={24} />
                            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </h2>
                        <button
                            className="btn btn-outline"
                            onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <button
                        className="btn btn-outline"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Today
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 'var(--spacing-sm)',
                    flex: 1
                }}>
                    {weekDays.map(day => (
                        <div key={day.toISOString()} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            <div style={{
                                textAlign: 'center',
                                fontWeight: 'bold',
                                padding: '8px',
                                backgroundColor: day.toDateString() === new Date().toDateString() ? 'var(--color-primary)' : '#f0f0f0',
                                color: day.toDateString() === new Date().toDateString() ? 'white' : 'inherit',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <div>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div style={{ fontSize: '1.2rem' }}>{day.getDate()}</div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Lunch</div>
                                {renderSlot(day, 'lunch')}

                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-muted)', textTransform: 'uppercase', marginTop: 'var(--spacing-xs)' }}>Dinner</div>
                                {renderSlot(day, 'dinner')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MealPlanner;
