import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ChefHat, Package } from 'lucide-react';

const Layout = () => {
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
