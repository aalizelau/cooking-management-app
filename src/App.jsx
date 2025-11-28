import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import RecipeGallery from './pages/RecipeGallery';
import InventoryDashboard from './pages/InventoryDashboard';
import ShoppingCart from './pages/ShoppingCart';
import RecipeDetail from './pages/RecipeDetail';
import IngredientDetail from './pages/IngredientDetail';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/recipes" replace />} />
            <Route path="recipes" element={<RecipeGallery />} />
            <Route path="recipes/:id" element={<RecipeDetail />} />
            <Route path="inventory" element={<InventoryDashboard />} />
            <Route path="shopping-cart" element={<ShoppingCart />} />
            <Route path="inventory/:id" element={<IngredientDetail />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
