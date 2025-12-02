import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ChefHat, Package, ShoppingCart, TrendingUp, Calendar, Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import '../styles/Layout.css';

const Layout = () => {
    const { cart } = useApp();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <div className="layout">
            <header className="layout-header">
                <div className="container header-container">
                    <h1 className="logo">
                        <span className="logo-icon">🍳</span>
                        <span className="logo-text">Alize's Kitchen</span>
                    </h1>

                    <button
                        className="mobile-menu-btn"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                        <NavLink
                            to="/recipes"
                            className={({ isActive }) => `nav-link ${isActive ? 'btn btn-primary' : 'btn btn-outline'}`}
                            onClick={closeMenu}
                        >
                            <ChefHat size={20} />
                            Recipes
                        </NavLink>
                        <NavLink
                            to="/meal-planner"
                            className={({ isActive }) => `nav-link ${isActive ? 'btn btn-secondary' : 'btn btn-outline'}`}
                            onClick={closeMenu}
                        >
                            <Calendar size={20} />
                            Planner
                        </NavLink>
                        <NavLink
                            to="/inventory"
                            className={({ isActive }) => `nav-link ${isActive ? 'btn btn-secondary' : 'btn btn-outline'}`}
                            onClick={closeMenu}
                        >
                            <Package size={20} />
                            Inventory
                        </NavLink>
                        <NavLink
                            to="/compare"
                            className={({ isActive }) => `nav-link ${isActive ? 'btn btn-secondary' : 'btn btn-outline'}`}
                            onClick={closeMenu}
                        >
                            <TrendingUp size={20} />
                            Compare
                        </NavLink>
                        <NavLink
                            to="/shopping-cart"
                            className={({ isActive }) => `nav-link ${isActive ? 'btn btn-primary' : 'btn btn-outline'}`}
                            onClick={closeMenu}
                        >
                            <ShoppingCart size={20} />
                            Cart
                            {cart.length > 0 && (
                                <span className="cart-badge">
                                    {cart.length}
                                </span>
                            )}
                        </NavLink>
                    </nav>
                </div>
            </header>
            <main className="container">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
