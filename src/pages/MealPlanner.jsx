import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { fetchMealPlan, upsertMealPlan, deleteMealPlan } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Trash2, Calendar, ChevronDown, Edit2, Check, X, PlusCircle, Coffee, Pizza, Utensils, Box } from 'lucide-react';

const MealSlot = ({ date, slot, plan, recipe, onDrop, onRemove, onUpdateText }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const hasContent = recipe || plan?.custom_text;
    const isCustomText = !recipe && plan?.custom_text;

    const startEditing = (e) => {
        e.stopPropagation();
        setEditText(plan.custom_text || '');
        setIsEditing(true);
    };

    const saveEdit = async () => {
        if (editText.trim() !== (plan.custom_text || '')) {
            await onUpdateText(plan.id, editText.trim());
        }
        setIsEditing(false);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditText(plan.custom_text || '');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={(e) => onDrop(e, date, slot)}
            // Only draggable if it's a recipe or non-editing custom text
            draggable={!!(hasContent && !isEditing)}
            onDragStart={(e) => {
                const data = JSON.stringify({
                    recipeId: recipe?.id,
                    customText: plan?.custom_text,
                    fromId: plan.id
                });
                e.dataTransfer.setData('application/json', data);
                e.dataTransfer.effectAllowed = 'copyMove';
            }}
            style={{
                height: '100px', // Slightly taller for better editing
                backgroundColor: hasContent ? 'white' : 'rgba(0,0,0,0.02)',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: hasContent ? 'space-between' : 'center',
                alignItems: hasContent ? 'stretch' : 'center',
                transition: 'all 0.2s ease',
                cursor: hasContent && !isEditing ? 'grab' : 'default',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {hasContent ? (
                <>
                    {recipe ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'start', overflow: 'hidden' }}>
                            {recipe.image && (
                                <img
                                    src={recipe.image}
                                    alt={recipe.title}
                                    style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                                />
                            )}
                            <div style={{
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                lineHeight: '1.2',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {recipe.title}
                            </div>
                        </div>
                    ) : (
                        // Custom Text Content
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            {isEditing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
                                    <textarea
                                        ref={inputRef}
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={saveEdit}
                                        style={{
                                            flex: 1,
                                            width: '100%',
                                            padding: '4px',
                                            fontSize: '0.9rem',
                                            border: '1px solid var(--color-primary)',
                                            borderRadius: '4px',
                                            resize: 'none',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)', textAlign: 'right' }}>
                                        Enter to save
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={startEditing}
                                    title="Click to edit"
                                    style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        lineHeight: '1.3',
                                        fontStyle: 'italic',
                                        color: '#555',
                                        whiteSpace: 'pre-wrap',
                                        cursor: 'text',
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'flex-start'
                                        // display: '-webkit-box',
                                        // WebkitLineClamp: 3,
                                        // WebkitBoxOrient: 'vertical',
                                        // overflow: 'hidden',
                                    }}
                                >
                                    {plan.custom_text}
                                </div>
                            )}
                        </div>
                    )}

                    {!isEditing && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                            {isCustomText && (
                                <button
                                    onClick={startEditing}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-muted)',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(plan.id);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-danger)',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>Drop here</span>
            )}
        </div>
    );
};

const DraggableBlock = ({ text, icon: Icon, color = '#666', bg = '#fffbf0', border = '#e8d7a1' }) => {
    const handleDragStart = (e) => {
        const data = JSON.stringify({ customText: text });
        e.dataTransfer.setData('application/json', data);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            style={{
                padding: '8px 12px',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'grab',
                fontSize: '0.9rem',
                fontWeight: '500',
                color: color,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                transition: 'transform 0.1s, box-shadow 0.1s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {Icon && <Icon size={16} />}
            {text}
        </div>
    );
};


const MealPlanner = () => {
    const { recipes, ingredients } = useApp();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekPlan, setWeekPlan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({});

    // Calculate which 14-day period the current date falls into
    const planDays = (() => {
        const day = currentDate.getDate();
        const start = new Date(currentDate);

        // Get the number of days in current month
        const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();

        // Determine which period based on month length
        if (day <= 14) {
            start.setDate(1); // First period: 1st-14th
        } else if (daysInMonth <= 28) {
            // For February (28 or 29 days), only have 2 periods
            start.setDate(15); // Second period: 15th onwards
        } else if (day <= 28) {
            start.setDate(15); // Second period: 15th-28th
        } else {
            start.setDate(29); // Third period: 29th onwards
        }

        // Generate 14 consecutive days from the start
        return Array.from({ length: 14 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    })();

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        loadPlan();
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

    const loadPlan = async () => {
        setLoading(true);
        try {
            const start = formatDate(planDays[0]);
            const end = formatDate(planDays[planDays.length - 1]);
            const data = await fetchMealPlan(start, end);
            setWeekPlan(data || []);
        } catch (err) {
            console.error('Failed to load meal plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStartRecipe = (e, recipe) => {
        const data = JSON.stringify({ recipeId: recipe.id });
        e.dataTransfer.setData('application/json', data);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDrop = async (e, date, slot) => {
        e.preventDefault();
        const json = e.dataTransfer.getData('application/json');
        if (!json) return;

        const { recipeId, customText, fromId } = JSON.parse(json);

        if (!recipeId && !customText) return;

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
            recipe_id: recipeId || null,
            custom_text: customText || null,
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
            // 1. If moving, delete old entry first
            if (fromId && !fromId.startsWith('temp-')) {
                await deleteMealPlan(fromId);
            }
            // 2. Insert new entry
            await upsertMealPlan(dateStr, slot, recipeId, customText);
            loadPlan(); // Reload to get real IDs
        } catch (err) {
            console.error('Failed to save meal plan:', err);
            loadPlan(); // Revert
        }
    };

    const handleRemove = async (id) => {
        if (!id) return;
        setWeekPlan(prev => prev.filter(p => p.id !== id));
        if (!id.startsWith('temp-')) {
            try {
                await deleteMealPlan(id);
            } catch (err) {
                console.error('Failed to delete meal plan:', err);
                loadPlan(); // Revert
            }
        }
    };

    const handleUpdateText = async (id, newText) => {
        if (!id) return;
        // setWeekPlan(prev => prev.map(p =>
        //     p.id === id ? { ...p, custom_text: newText } : p
        // ));
        // Actually, we should just optimistic update:
        setWeekPlan(prev => {
            return prev.map(p => {
                if (p.id === id) {
                    return { ...p, custom_text: newText };
                }
                return p;
            });
        });

        if (!id.startsWith('temp-')) {
            try {
                const plan = weekPlan.find(p => p.id === id);
                // Note: plan here might be stale if we used it directly from state closure,
                // but since we found it by ID which is unique, we need the *latest* plan info except for the text we are changing.
                // Actually, `weekPlan` in `handleUpdateText` closure will be current render's weekPlan.
                // Ideally we should rely on the args. New text is passed in.
                // We need date and slot from the plan item.
                if (plan) {
                    await upsertMealPlan(plan.date, plan.slot, null, newText);
                }
            } catch (err) {
                console.error('Failed to update text:', err);
                loadPlan(); // Revert
            }
        }
    };

    const getRecipe = (id) => recipes.find(r => r.id === id);


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
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Meal Planner</h3>

                {/* Toolbox */}
                <div style={{ marginBottom: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-md)', borderBottom: '2px solid var(--color-border)' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--spacing-sm)', color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                        Quick Add
                    </h4>
                    <DraggableBlock text="Note" icon={Edit2} />
                    <DraggableBlock text="Leftovers" icon={Box} color="#155724" bg="#d4edda" border="#c3e6cb" />
                    <DraggableBlock text="Eat Out" icon={Utensils} color="#721c24" bg="#f8d7da" border="#f5c6cb" />
                    <DraggableBlock text="Order In" icon={Pizza} color="#004085" bg="#cce5ff" border="#b8daff" />
                </div>


                <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--spacing-md)', color: 'var(--color-muted)', textTransform: 'uppercase' }}>Recipes</h4>
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
                                            onDragStart={(e) => handleDragStartRecipe(e, recipe)}
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
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                const day = newDate.getDate();
                                const daysInMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();

                                if (day <= 14) {
                                    // From period 1 -> go to previous month's last period
                                    newDate.setMonth(newDate.getMonth() - 1);
                                    const prevMonthDays = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();

                                    if (prevMonthDays <= 28) {
                                        // Previous month is February, go to period 2 (day 15)
                                        newDate.setDate(15);
                                    } else {
                                        // Previous month has 30/31 days, go to period 3 (day 29)
                                        newDate.setDate(29);
                                    }
                                } else if (daysInMonth <= 28) {
                                    // Current month is February
                                    // From period 2 -> go to period 1
                                    newDate.setDate(1);
                                } else if (day <= 28) {
                                    // From period 2 -> go to period 1
                                    newDate.setDate(1);
                                } else {
                                    // From period 3 -> go to period 2
                                    newDate.setDate(15);
                                }

                                setCurrentDate(newDate);
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px', justifyContent: 'center' }}>
                            <Calendar size={24} />
                            {planDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {planDays[13].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </h2>
                        <button
                            className="btn btn-outline"
                            onClick={() => {
                                const newDate = new Date(currentDate);
                                const day = newDate.getDate();
                                const daysInMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();

                                if (day <= 14) {
                                    // From period 1 -> go to period 2
                                    newDate.setDate(15);
                                } else if (daysInMonth <= 28) {
                                    // Current month is February (only 2 periods)
                                    // From period 2 -> go to next month's period 1
                                    newDate.setMonth(newDate.getMonth() + 1);
                                    newDate.setDate(1);
                                } else if (day <= 28) {
                                    // From period 2 -> go to period 3
                                    newDate.setDate(29);
                                } else {
                                    // From period 3 -> go to next month's period 1
                                    newDate.setMonth(newDate.getMonth() + 1);
                                    newDate.setDate(1);
                                }

                                setCurrentDate(newDate);
                            }}
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
                    flex: 1,
                    overflowY: 'auto'
                }}>
                    {planDays.map(day => (
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
                                {/* Lunch Slot */}
                                <MealSlot
                                    date={day}
                                    slot="lunch"
                                    plan={weekPlan.find(p => p.date === formatDate(day) && p.slot === 'lunch') || {}}
                                    recipe={weekPlan.find(p => p.date === formatDate(day) && p.slot === 'lunch')?.recipe_id ? getRecipe(weekPlan.find(p => p.date === formatDate(day) && p.slot === 'lunch').recipe_id) : null}
                                    onDrop={handleDrop}
                                    onRemove={handleRemove}
                                    onUpdateText={handleUpdateText}
                                />

                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-muted)', textTransform: 'uppercase', marginTop: 'var(--spacing-xs)' }}>Dinner</div>
                                {/* Dinner Slot */}
                                <MealSlot
                                    date={day}
                                    slot="dinner"
                                    plan={weekPlan.find(p => p.date === formatDate(day) && p.slot === 'dinner') || {}}
                                    recipe={weekPlan.find(p => p.date === formatDate(day) && p.slot === 'dinner')?.recipe_id ? getRecipe(weekPlan.find(p => p.date === formatDate(day) && p.slot === 'dinner').recipe_id) : null}
                                    onDrop={handleDrop}
                                    onRemove={handleRemove}
                                    onUpdateText={handleUpdateText}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MealPlanner;
