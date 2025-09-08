import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import { formatPrice } from './types';
import CartModal from './CartModal';
import TrendingFeed from './TrendingFeed';

export default function Home() {
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);

  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckingOut, setCheckingOut] = useState(false);

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : {};
    } catch (e) {
      console.error("Failed to parse cart from localStorage", e);
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError('');
      
      const [catRes, itemRes, trendRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_available', true).order('display_order', { ascending: true }),
        supabase.from('food_items').select('*').order('name', { ascending: true }),
        supabase.rpc('get_trending_items')
      ]);

      if (!isMounted) return;

      if (catRes.error) {
        setError(catRes.error.message);
        setLoading(false);
        return; 
      }
      if (itemRes.error) {
        setError(itemRes.error.message);
        setLoading(false);
        return;
      }

      setCategories(catRes.data || []);
      setItems(itemRes.data || []);

      if (trendRes.error) {
        console.error("Could not fetch trending items:", trendRes.error.message);
      } else {
        setTrendingItems(trendRes.data || []);
      }

      setLoading(false);
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const inCategory = activeCat === 'all' || it.category_id === activeCat;
      const matchesSearch = !q || it.name.toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q);
      return inCategory && matchesSearch;
    });
  }, [items, search, activeCat]);

  const updateCartQuantity = (item, direction) => {
    setCart((c) => {
      const currentQty = c[item.id]?.qty || 0;
      const newQty = currentQty + direction;

      if (newQty <= 0) {
        const clone = { ...c };
        delete clone[item.id];
        return clone;
      }
      return { ...c, [item.id]: { item, qty: newQty } };
    });
  };

  const cartArray = Object.values(cart);
  const cartTotal = cartArray.reduce((sum, cartItem) => sum + Number(cartItem.item.price) * cartItem.qty, 0);

  const handleCheckout = async () => {
  if (!profile?.sub) {
    alert('You must be logged in to place an order.');
    return;
  }
  if (cartArray.length === 0) return;

  setCheckingOut(true);

  try {
    const userDetails = {
      uid: profile.sub,
      displayName: profile.name || 'Guest',
      email: profile.email || 'noemail@example.com',
      phoneNumber: profile.phone || profile.phoneNumber || '9999999999',
    };

    // Step 1: Create Cashfree payment order
    const response = await fetch(`${import.meta.env.VITE_CASHFREE_API_URL}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: cartTotal,
        currency: 'INR',
        cart: cartArray.map(ci => ({
          price: Number(ci.item.price),
          quantity: ci.qty,
          id: ci.item.id,
          name: ci.item.name,
          image: ci.item.image_url,
        })),
        user: userDetails,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create payment order');

    if (!window.Cashfree) {
      alert('Cashfree SDK not loaded');
      setCheckingOut(false);
      return;
    }

    const mode = import.meta.env.PROD ? 'production' : data.envMode || 'sandbox';
    const cashfree = window.Cashfree({ mode });

    // Step 2: Start Cashfree payment
    await cashfree.checkout({
      paymentSessionId: data.paymentSessionId,
      redirectTarget: '_modal',
    });

    // Step 3: Verify payment status with backend
    const verifyResponse = await fetch(`${import.meta.env.VITE_CASHFREE_API_URL}/api/verify-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: data.cfOrderId }),
    });

    const verifyData = await verifyResponse.json();
    if (!verifyResponse.ok) throw new Error(verifyData.error || 'Failed to verify payment');

    if (verifyData.status === 'PAID' || verifyData.status === 'SUCCESS') {
      // Step 4: Record order in Supabase only after payment success
      const recordResponse = await fetch(`${import.meta.env.VITE_CASHFREE_API_URL}/api/record-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.sub,
          userEmail: profile.email,
          cart: cartArray,
          orderId: data.cfOrderId,
        }),
      });

      const recordData = await recordResponse.json();
      if (!recordResponse.ok) throw new Error(recordData.error || 'Failed to record order');

      alert('Payment successful! Your order has been placed.');
      setCart({});
      setCartOpen(false);
    } else {
      alert(`Payment status: ${verifyData.status}. Please check your order.`);
    }
  } catch (err) {
    alert(`Payment failed: ${err.message}`);
  } finally {
    setCheckingOut(false);
  }
};




  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Header
        profile={profile}
        search={search}
        onSearchChange={setSearch}
        cartCount={cartArray.reduce((n, ci) => n + ci.qty, 0)}
        onViewCart={() => setCartOpen(true)}
      />

      {loading && <p>Loading menu...</p>}
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      {!loading && (
        <>
          <TrendingFeed items={trendingItems} />
          <CategoryBar
            categories={categories}
            activeCategory={activeCat}
            onCategoryChange={setActiveCat}
          />
          <MenuGrid
            items={filteredItems}
            onAddToCart={(item) => updateCartQuantity(item, 1)}
            cart={cart}
            onRemoveFromCart={(item) => updateCartQuantity(item, -1)}
          />
        </>
      )}

      {isCartOpen && (
        <CartModal
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQuantity={(itemId, direction) => {
            const item = items.find(i => i.id === itemId);
            if (item) updateCartQuantity(item, direction);
          }}
          onCheckout={handleCheckout}
          isCheckingOut={isCheckingOut}
        />
      )}
    </div>
  );
}

function Header({ profile, search, onSearchChange, cartCount, onViewCart }) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : '';

  return (
    <div>
      {firstName && (
        <div style={greetingContainerStyle}>
          <h1 style={greetingHeadingStyle}>
            👋 Hello, <span style={nameStyle}>{firstName}</span>
          </h1>
          <p style={subheadingStyle}>What are you craving today?</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        {!firstName && <h2 style={headerTitleStyle}>GrabNGo</h2>}

        <input
          placeholder="Search for food..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            ...searchInputStyle,
            marginLeft: firstName ? 0 : 'auto',
            width: firstName ? '100%' : 360
          }}
        />
        <button onClick={onViewCart} style={viewCartButtonStyle}>
          🛒 Cart ({cartCount})
        </button>
      </div>
    </div>
  );
}


function MenuGrid({ items, onAddToCart, cart, onRemoveFromCart }) {
  if (items.length === 0) {
    return <p style={{ color: '#64748b' }}>No items found. Try a different search or category.</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginTop: 20 }}>
      {items.map((item) => {
        const cartItem = cart[item.id];
        const quantityInCart = cartItem?.qty || 0;
        const isAvailable = item.is_available;

        return (
          <div key={item.id} style={{ ...menuItemStyle, opacity: isAvailable ? 1 : 0.6 }}>
            <div style={{ height: 180, background: '#f1f5f9' }}>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.name}</div>
              <div style={{ color: '#64748b', fontSize: 14, height: 40, overflow: 'hidden', marginTop: 4 }}>
                {item.description || 'A delicious and freshly prepared item.'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto', paddingTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatPrice(item.price)}</div>
                <div style={{ marginLeft: 'auto' }}>
                  {isAvailable ? (
                    quantityInCart > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => onRemoveFromCart(item)} style={quantityButtonStyle}>−</button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{quantityInCart}</span>
                        <button onClick={() => onAddToCart(item)} style={quantityButtonStyle}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => onAddToCart(item)} style={addToCartButtonStyle}>Add to Cart</button>
                    )
                  ) : (
                    <div style={outOfStockButtonStyle}>Out of Stock</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryBar({ categories, activeCategory, onCategoryChange }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 18, marginBottom: 18, overflowX: 'auto', paddingBottom: 10 }}>
      <CategoryPill label="All" active={activeCategory === 'all'} onClick={() => onCategoryChange('all')} />
      {categories.map((c) => (
        <CategoryPill key={c.id} label={c.name} active={activeCategory === c.id} onClick={() => onCategoryChange(c.id)} />
      ))}
    </div>
  );
}

function CategoryPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid #e2e8f0',
        background: active ? '#f97316' : '#fff',
        color: active ? '#fff' : '#0f172a',
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

const greetingContainerStyle = { marginBottom: 24 };
const greetingHeadingStyle = { margin: '0 0 4px 0', fontSize: '2rem', fontWeight: 600, color: '#1e293b' };
const nameStyle = { fontWeight: 700, color: '#f97316' };
const subheadingStyle = { margin: 0, fontSize: '1.1rem', color: '#64748b' };
const searchInputStyle = {
  padding: 10,
  maxWidth: '45vw',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  transition: 'all 0.2s ease-in-out',
};

const viewCartButtonStyle = { padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600 };
const addToCartButtonStyle = { padding: '10px 16px', borderRadius: 10, border: '1px solid #f97316', background: '#fff', color: '#f97316', cursor: 'pointer', fontWeight: 600 };
const quantityButtonStyle = { width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '1.2rem' };

const menuItemStyle = {
  border: '1px solid #eef2f7',
  borderRadius: 14,
  overflow: 'hidden',
  background: '#fff',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'opacity 0.2s ease-in-out',
};

const outOfStockButtonStyle = {
  padding: '10px 16px',
  borderRadius: 10,
  background: '#e2e8f0',
  color: '#64748b',
  textAlign: 'center',
  fontWeight: 600,
};
