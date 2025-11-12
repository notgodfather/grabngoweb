import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';
import { ADMIN_EMAILS } from './config.js';
import LoginPage from './App.jsx';
import Home from './Home.jsx';
import OrderHistory from './OrderHistory.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AboutUs from './AboutUs.jsx';

import AdminRoute from './pages/admin/AdminRoute.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminItems from './pages/admin/AdminItems.jsx';

export default function AppRouter() {
  const navigate = useNavigate();
  const location = useLocation();

  // global tab state: 'menu' | 'categories' | 'orders'
  const [activeTab, setActiveTab] = React.useState('menu');

  // keep tab in sync with route when landing directly on /orders
  React.useEffect(() => {
    if (location.pathname.startsWith('/orders')) {
      setActiveTab('orders');
    } else if (location.pathname.startsWith('/home')) {
      // keep last non-orders selection (menu/categories)
      if (activeTab === 'orders') setActiveTab('menu');
    }
  }, [location.pathname]);

  const goMenu = () => { setActiveTab('menu'); navigate('/home'); };
  const goCategories = () => { setActiveTab('categories'); navigate('/home'); };
  const goOrders = () => { setActiveTab('orders'); navigate('/orders'); };

  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home externalActiveTab={activeTab} onTabChange={setActiveTab} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderHistory />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/items" element={<AdminRoute><AdminItems /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      </Routes>

      {/* Global Bottom Nav across /home and /orders */}
      <BottomNav
        active={activeTab}
        onMenu={goMenu}
        onCategories={goCategories}
        onOrders={goOrders}
      />
    </>
  );
}

function BottomNav({ active, onMenu, onCategories, onOrders }) {
  const navStyle = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1200,
    background: '#fff',
    borderTop: '1px solid #e2e8f0',
    padding: '6px 8px',
    paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
    display: 'flex',
    justifyContent: 'space-around'
  };
  const btn = {
    background: 'transparent',
    border: 'none',
    color: '#0f172a',
    fontSize: 18,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2
  };
  const btnActive = { ...btn, color: '#f97316', fontWeight: 800 };
  const label = { fontSize: 12, marginTop: 2 };

  return (
    <div style={navStyle} role="navigation" aria-label="Primary">
      <button style={active === 'menu' ? btnActive : btn} onClick={onMenu}>
        🍽️
        <div style={label}>Menu</div>
      </button>
      <button style={active === 'categories' ? btnActive : btn} onClick={onCategories}>
        🗂️
        <div style={label}>Categories</div>
      </button>
      <button style={active === 'orders' ? btnActive : btn} onClick={onOrders}>
        🧾
        <div style={label}>My Orders</div>
      </button>
    </div>
  );
}

function TopNav() {
  const isAuthed = localStorage.getItem('isAuthed') === 'true';
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');
  const navigate = useNavigate();

  if (!isAuthed) {
    return null;
  }

  const isAdmin = !!profile?.email && ADMIN_EMAILS.includes(profile.email.toLowerCase());

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('isAuthed');
    localStorage.removeItem('profile');
    localStorage.removeItem('cart');
    navigate('/');
    window.location.reload();
  };

  return (
    <nav style={navStyle}>
      <span style={{fontWeight:'bold', fontSize:'18px'}}>GrabNGo</span>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/home" style={linkStyle}>Menu</Link>
        <Link to="/orders" style={linkStyle}>My Orders</Link>
        {isAdmin && (
          <>
            <Link to="/admin/orders" style={adminLinkStyle}>Manage Orders</Link>
            <Link to="/admin/items" style={adminLinkStyle}>Manage Items</Link>
          </>
        )}
        <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
      </div>
    </nav>
  );
}

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 24px',
  borderBottom: '1px solid #eef2f7',
  background: '#fff',
};
const linkStyle = { textDecoration: 'none', color: '#334155', fontWeight: '400' };
const adminLinkStyle = { ...linkStyle, background: '#f1f5f9', color: '#1e293b', padding: '8px 12px', borderRadius: 8 };
const logoutButtonStyle = { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' };
