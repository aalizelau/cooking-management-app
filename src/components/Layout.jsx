import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ChefHat, Package, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Layout = () => {
    const { cart } = useApp();

    return (
        <div className="layout">
            <header style={{
                padding: 'var(--spacing-md)',
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card-bg)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>Kitchen Manager</h1>
                    <nav style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <NavLink
                            to="/recipes"
                            className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-outline'}
                            style={{ gap: 'var(--spacing-sm)' }}
                        >
                            <ChefHat size={20} />
                            Recipes
                        </NavLink>
                        <NavLink
                            to="/inventory"
                            className={({ isActive }) => isActive ? 'btn btn-secondary' : 'btn btn-outline'}
                            style={{ gap: 'var(--spacing-sm)' }}
                        >
                            <Package size={20} />
                            Inventory
                        </NavLink>
                        <NavLink
                            to="/shopping-cart"
                            className={({ isActive }) => isActive ? 'btn btn-primary' : 'btn btn-outline'}
                            style={{ gap: 'var(--spacing-sm)', position: 'relative' }}
                        >
                            <ShoppingCart size={20} />
                            Cart
                            {cart.length > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
                                    backgroundColor: 'var(--color-danger)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
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
