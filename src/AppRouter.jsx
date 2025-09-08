import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';

import { ADMIN_EMAIL } from './config';

import LoginPage from './App.jsx';
import Home from './Home.jsx';
import OrderHistory from './OrderHistory.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

import AdminRoute from './pages/admin/AdminRoute.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminItems from './pages/admin/AdminItems.jsx';

export default function AppRouter() {
  return (
    <>
      <TopNav />
      <Routes>
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

// --- Corrected TopNav Component ---

function TopNav() {
  const isAuthed = localStorage.getItem('isAuthed') === 'true';
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');
  
  const navigate = useNavigate();

  // If the user is not authenticated, render nothing.
  if (!isAuthed) {
    return null;
  }
  
  const isAdmin = profile?.email === ADMIN_EMAIL;

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('isAuthed');
    localStorage.removeItem('profile');
    localStorage.removeItem('cart');
    navigate('/');
    window.location.reload(); // Force a refresh to clear state
  };

  return (
    <nav style={navStyle}>
      <span style={{fontWeight:'bold', fontSize:'18px'}}>GrabNGo</span>
      {/* This div now contains all links and the button, pushed to the right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* User links */}
        <Link to="/home" style={linkStyle}>Menu</Link>
        <Link to="/orders" style={linkStyle}>My Orders</Link>
        
        {/* Admin links (only shown if the user is an admin) */}
        {isAdmin && (
          <>
            <Link to="/admin/orders" style={adminLinkStyle}>Manage Orders</Link>
            <Link to="/admin/items" style={adminLinkStyle}>Manage Items</Link>
          </>
        )}

        {/* Logout button */}
        <button onClick={handleLogout} style={logoutButtonStyle}>
          Logout
        </button>
      </div>
    </nav>
  );
}

// --- Styles ---

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 24px',
  borderBottom: '1px solid #eef2f7',
  background: '#fff',
};

const linkStyle = { 
  textDecoration: 'none', 
  color: '#334155', 
  fontWeight: 500 
};

const adminLinkStyle = { 
  ...linkStyle, 
  background: '#f1f5f9', 
  color: '#1e293b', 
  padding: '8px 12px', 
  borderRadius: 8 
};

const logoutButtonStyle = {
  background: '#fee2e2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  padding: '8px 12px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer'
};
