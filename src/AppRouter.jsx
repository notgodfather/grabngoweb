import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';

// Import the central configuration
import { ADMIN_EMAIL } from './config';

// Import Page Components
import LoginPage from './App.jsx';
import Home from './Home.jsx';
import OrderHistory from './OrderHistory.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

// Import Admin Components
import AdminRoute from './pages/admin/AdminRoute.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminItems from './pages/admin/AdminItems.jsx';

export default function AppRouter() {
  return (
    <>
      <TopNav />
      <Routes>
        {/* Public and User Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route 
          path="/admin/items" 
          element={<AdminRoute><AdminItems /></AdminRoute>} 
        />
        <Route 
          path="/admin/orders" 
          element={<AdminRoute><AdminOrders /></AdminRoute>} 
        />
      </Routes>
    </>
  );
}

function TopNav() {
  const isAuthed = localStorage.getItem('isAuthed') === 'true';
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');
  
  // The admin check now uses the imported email from config.js
  const isAdmin = profile?.email === ADMIN_EMAIL;
  
  const navigate = useNavigate();

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('isAuthed');
    localStorage.removeItem('profile');
    localStorage.removeItem('cart');
    navigate('/');
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '10px 24px', borderBottom: '1px solid #eef2f7', background: '#fff' }}>
      <Link to="/" style={{ textDecoration: 'none', fontWeight: 700, color: '#0f172a', fontSize: '1.2rem' }}>GrabNGo</Link>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        {isAuthed && (
          <>
            <Link to="/home" style={linkStyle}>Menu</Link>
            <Link to="/orders" style={linkStyle}>My Orders</Link>
          </>
        )}
        {isAdmin && (
          <>
            <Link to="/admin/orders" style={adminLinkStyle}>Manage Orders</Link>
            <Link to="/admin/items" style={adminLinkStyle}>Manage Items</Link>
          </>
        )}
        {isAuthed && (
          <button onClick={handleLogout} style={logoutButtonStyle}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

// Styles
const linkStyle = { textDecoration: 'none', color: '#334155', fontWeight: 500 };
const adminLinkStyle = { ...linkStyle, background: '#f1f5f9', color: '#1e293b', padding: '8px 12px', borderRadius: 8 };
const logoutButtonStyle = {
  background: '#fee2e2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  padding: '8px 12px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer'
};
