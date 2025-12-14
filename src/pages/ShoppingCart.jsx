import React, { useState } from 'react';
import { CheckSquare, Square, ShoppingBag, Search, Plus, X, Store, Filter, ArrowRight, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import IngredientDetail from './IngredientDetail'; // Import IngredientDetail for the side panel
import '../styles/ShoppingCart.css';

const ShoppingCart = () => {
    const {
        cart,
        wishlist,
        ingredients,
        removeFromCart,
        updateIngredient,
        clearCart,
        addToCart,
        addToWishlist,
        removeFromWishlist,
        moveToShoppingList,
        moveToWishlist,
        toggleCartItemChecked
    } = useApp();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIngredientId, setSelectedIngredientId] = useState(null); // Track selected ingredient for side panel
    const [selectedStore, setSelectedStore] = useState('all'); // Store filter
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('shopping'); // 'wishlist' or 'shopping'

    const cartIngredients = ingredients.filter(ing =>
        cart.some(item => item.ingredientId === ing.id)
    );

    const wishlistIngredients = ingredients.filter(ing =>
        wishlist.some(item => item.ingredientId === ing.id)
    );

    // Get all unique stores from cart ingredients (exclude Metro and IGA)
    const EXCLUDED_STORES = ['Metro', 'IGA'];
    const allStores = [...new Set(
        cartIngredients.flatMap(ing =>
            ing.history && ing.history.length > 0
                ? ing.history.map(h => h.store).filter(store => !EXCLUDED_STORES.includes(store))
                : []
        )
    )].sort();

    // Filter cart ingredients by selected store
    const filteredCartIngredients = selectedStore === 'all'
        ? cartIngredients
        : cartIngredients.filter(ing =>
            ing.history && ing.history.some(h => h.store === selectedStore)
        );

    // Group cart ingredients by category
    const groupByCategory = (ingredientsList) => {
        const grouped = {};
        ingredientsList.forEach(ing => {
            if (!grouped[ing.category]) {
                grouped[ing.category] = [];
            }
            grouped[ing.category].push(ing);
        });
        return grouped;
    };

    const groupedCartItems = groupByCategory(filteredCartIngredients);
    const groupedWishlistItems = groupByCategory(wishlistIngredients);

    // Handler to move item from wishlist to shopping list
    const handleMoveToShoppingList = (ingredientId) => {
        moveToShoppingList(ingredientId);
    };

    // Handler to remove from wishlist
    const handleRemoveFromWishlist = (ingredientId) => {
        removeFromWishlist(ingredientId);
    };

    // Handler to move item from shopping list to wishlist
    const handleMoveToWishlist = (ingredientId) => {
        moveToWishlist(ingredientId);
    };

    const toggleCheck = (id) => {
        toggleCartItemChecked(id);
    };

    const handleRestock = () => {
        // Get checked items
        const checkedItems = cart.filter(item => item.isChecked);

        // Move checked items to In Stock using their default location
        checkedItems.forEach(item => {
            const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
            updateIngredient(item.ingredientId, {
                stockStatus: 'In Stock',
                location: ingredient.defaultLocation || 'Room Temp' // Fallback to Room Temp if no default
            }, { shouldUpdateBoughtDate: true }); // Auto-update bought date when restocking from cart
            removeFromCart(item.ingredientId);
        });

        // Reset UI
        setSelectedIngredientId(null); // Close side panel if the selected item is removed

        // If cart is empty, go back to inventory
        if (cart.length === checkedItems.length) {
            navigate('/inventory');
        }
    };

    // Search Logic
    const searchResults = searchQuery.length > 0
        ? ingredients.filter(ing =>
            ing.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !cart.some(item => item.ingredientId === ing.id)
        )
        : [];

    const handleAddToCart = (id) => {
        addToCart(id);
        setSearchQuery('');
    };

    const CATEGORY_ORDER = [
        '原材料',
        '水果',
        '零食',
        '半成品',
        '調味料',
        '無食材類型'
    ];

    const sortCategories = (a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a);
        const indexB = CATEGORY_ORDER.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    };

    const handleStoreSelect = (store) => {
        setSelectedStore(store);
        setIsFilterMenuOpen(false);
    };

    return (
        <div className="shopping-cart-container">
            {/* Left Panel: Shopping List */}
            <div className="cart-list-panel">
                <h2 className="cart-header">
                    {activeTab === 'wishlist' ? 'Want to Buy' : 'Shopping Cart'}
                    {activeTab === 'shopping' && selectedStore !== 'all' ? (
                        <span>
                            {' '}({filteredCartIngredients.length} of {cart.length})
                        </span>
                    ) : activeTab === 'shopping' ? (
                        <span> ({cart.length})</span>
                    ) : (
                        <span> ({wishlist.length})</span>
                    )}
                </h2>

                {/* Tab Segmented Control */}
                <div className="tab-control">
                    <button
                        className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
                        onClick={() => setActiveTab('wishlist')}
                    >
                        Want to Buy ({wishlist.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'shopping' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shopping')}
                    >
                        Final Shopping List ({cart.length})
                    </button>
                </div>

                {/* Search Bar and Store Filter - Combined */}
                <div className="search-filter-container">
                    <div className="search-filter-wrapper">
                        {/* Search Bar */}
                        <div className="search-bar-wrapper">
                            <Search size={20} className="search-icon" />
                            <input
                                placeholder="Search to add ingredients..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="clear-search-btn"
                                >
                                    <X size={18} />
                                </button>
                            )}

                            {searchQuery && (
                                <div className="search-results-dropdown">
                                    {searchResults.length === 0 ? (
                                        <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--color-muted)' }}>
                                            No ingredients found.
                                        </div>
                                    ) : (
                                        searchResults.map(ing => (
                                            <div
                                                key={ing.id}
                                                onClick={() => handleAddToCart(ing.id)}
                                                className="search-result-item"
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                    {ing.emoji && <span style={{ fontSize: '1.2rem' }}>{ing.emoji}</span>}
                                                    <div>
                                                        <div style={{ fontWeight: '500' }}>{ing.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                                                            {ing.stockStatus} • {ing.location}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Plus size={20} color="var(--color-primary)" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Store Filter Dropdown */}
                        {allStores.length > 0 && (
                            <div className="filter-wrapper">
                                <button
                                    className={`btn btn-outline filter-toggle-btn ${selectedStore !== 'all' ? 'active' : ''}`}
                                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                >
                                    <Filter size={20} />
                                    <span>{selectedStore === 'all' ? 'Filter' : selectedStore}</span>
                                </button>

                                {isFilterMenuOpen && (
                                    <div className="filter-dropdown">
                                        <button
                                            onClick={() => handleStoreSelect('all')}
                                            className={`filter-option ${selectedStore === 'all' ? 'active' : ''}`}
                                        >
                                            All ({cartIngredients.length})
                                        </button>
                                        {allStores.map(store => {
                                            const storeCount = cartIngredients.filter(ing =>
                                                ing.history && ing.history.some(h => h.store === store)
                                            ).length;
                                            return (
                                                <button
                                                    key={store}
                                                    onClick={() => handleStoreSelect(store)}
                                                    className={`filter-option ${selectedStore === store ? 'active' : ''}`}
                                                >
                                                    {store} ({storeCount})
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Wishlist Tab Content */}
                {activeTab === 'wishlist' && (
                    wishlist.length === 0 ? (
                        <div className="empty-cart-state">
                            <ShoppingBag size={48} color="var(--color-muted)" />
                            <h2 style={{ marginTop: 'var(--spacing-md)' }}>Your wishlist is empty</h2>
                            <p style={{ color: 'var(--color-muted)' }}>Add items you're thinking about buying.</p>
                        </div>
                    ) : (
                        <div className="cart-items-container">
                            {Object.keys(groupedWishlistItems).sort(sortCategories).map(category => (
                                <div key={category}>
                                    <h4 className="category-header">
                                        {category}
                                        <span className="category-count">
                                            {groupedWishlistItems[category].length}
                                        </span>
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                        {groupedWishlistItems[category].map(ing => {
                                            const isSelected = selectedIngredientId === ing.id;
                                            return (
                                                <div
                                                    key={ing.id}
                                                    className={`card wishlist-item-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => setSelectedIngredientId(ing.id)}
                                                >
                                                    <div className="item-details">
                                                        {ing.emoji && <span className="item-emoji">{ing.emoji}</span>}
                                                        <div className="item-info">
                                                            <h3 className="item-name">
                                                                {ing.name}
                                                            </h3>
                                                            {ing.history && ing.history.length > 0 && (
                                                                <div className="store-tags">
                                                                    {[...new Set(ing.history.map(h => h.store))].map((store, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="store-tag"
                                                                        >
                                                                            {store}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={(e) => { e.stopPropagation(); handleMoveToShoppingList(ing.id); }}
                                                            title="Move to Shopping List"
                                                        >
                                                            <ArrowRight size={16} />
                                                        </button>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveFromWishlist(ing.id); }}
                                                            title="Remove from Wishlist"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Shopping List Tab Content */}
                {activeTab === 'shopping' && (
                    cart.length === 0 ? (
                        <div className="empty-cart-state">
                            <ShoppingBag size={48} color="var(--color-muted)" />
                            <h2 style={{ marginTop: 'var(--spacing-md)' }}>Your cart is empty</h2>
                            <p style={{ color: 'var(--color-muted)' }}>Add items using the search bar above or from the inventory.</p>
                            <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => navigate('/inventory')}>
                                Back to Inventory
                            </button>
                        </div>
                    ) : (
                        <div className="cart-items-container">
                            {Object.keys(groupedCartItems).sort(sortCategories).map(category => (
                                <div key={category}>
                                    <h4 className="category-header">
                                        {category}
                                        <span className="category-count">
                                            {groupedCartItems[category].length}
                                        </span>
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                        {groupedCartItems[category].map(ing => {
                                            const cartItem = cart.find(item => item.ingredientId === ing.id);
                                            const isChecked = cartItem?.isChecked || false;
                                            const isSelected = selectedIngredientId === ing.id;
                                            return (
                                                <div
                                                    key={ing.id}
                                                    className={`card cart-item-card ${isChecked ? 'checked' : ''} ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => setSelectedIngredientId(ing.id)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1 }}>
                                                        <div
                                                            className={`checkbox-wrapper ${isChecked ? 'checked' : ''}`}
                                                            onClick={(e) => { e.stopPropagation(); toggleCheck(ing.id); }}
                                                        >
                                                            {isChecked ? <CheckSquare size={24} /> : <Square size={24} />}
                                                        </div>
                                                        <div className="item-details">
                                                            {ing.emoji && <span className="item-emoji">{ing.emoji}</span>}
                                                            <div className="item-info">
                                                                <h3 className={`item-name ${isChecked ? 'checked' : ''}`}>
                                                                    {ing.name}
                                                                </h3>
                                                                {ing.history && ing.history.length > 0 && (
                                                                    <div className="store-tags">
                                                                        {[...new Set(ing.history.map(h => h.store))].map((store, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="store-tag"
                                                                            >
                                                                                {store}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={(e) => { e.stopPropagation(); handleMoveToWishlist(ing.id); }}
                                                        title="Move to Want to Buy"
                                                    >
                                                        <ArrowLeft size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Right Panel: Ingredient Details */}
            {selectedIngredientId && (
                <div className="details-panel">
                    <div className="details-close-btn">
                        <button onClick={() => setSelectedIngredientId(null)} className="btn btn-icon">
                            <X size={20} />
                        </button>
                    </div>
                    <IngredientDetail id={selectedIngredientId} />
                </div>
            )}

            {cart.filter(item => item.isChecked).length > 0 && (
                <div className="restock-bar">
                    <div>
                        <span style={{ fontWeight: 'bold' }}>{cart.filter(item => item.isChecked).length} items selected</span>
                        <div style={{ fontSize: '0.85rem', marginTop: '4px', opacity: 0.9 }}>
                            Will be moved to their default locations
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        onClick={(e) => { e.stopPropagation(); handleRestock(); }}
                    >
                        Move to Stock
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShoppingCart;
