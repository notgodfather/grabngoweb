import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import { formatPrice } from './types';
import CartModal from './CartModal';

export default function Home() {
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckingOut, setCheckingOut] = useState(false);

  const [activeTab, setActiveTab] = useState('menu');

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : {};
    } catch (e) {
      console.error("Failed to parse cart from localStorage", e);
      return {};
    }
  });

  const [acceptingOrders, setAcceptingOrders] = useState(true);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError('');

      const [catRes, itemRes, settingsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_available', true).order('display_order', { ascending: true }),
        supabase.from('food_items').select('*').order('name', { ascending: true }),
        supabase.from('settings').select('receive_orders').limit(1).single(),
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
      if (settingsRes.error) {
        console.error("Could not fetch order acceptance setting:", settingsRes.error.message);
      } else {
        setAcceptingOrders(settingsRes.data?.receive_orders ?? true);
      }

      setCategories(catRes.data || []);
      setItems(itemRes.data || []);
      setLoading(false);
    }
    loadData();

    const interval = setInterval(loadData, 300000);
    return () => { isMounted = false; clearInterval(interval); };
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

  const handleCheckout = async (totalAmount) => {
    if (!acceptingOrders) {
      alert('Online ordering is temporarily disabled. Please try again later.');
      return;
    }
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

      const response = await fetch(`${import.meta.env.VITE_CASHFREE_API_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
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

      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_modal',
      });

      const verifyOrderId = data.orderId;
      const verifyResponse = await fetch(`${import.meta.env.VITE_CASHFREE_API_URL}/api/verify-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: verifyOrderId }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyData.error || 'Failed to verify payment');

      if (verifyData.status === 'PAID' || verifyData.status === 'SUCCESS') {
        const recordResponse = await fetch(`${import.meta.env.VITE_CASHFREE_API_URL}/api/record-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile.sub,
            userEmail: profile.email,
            cart: cartArray,
            orderId: verifyOrderId,
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

  const goToOrders = () => {
    window.location.href = '/orders';
  };

  return (
    <div style={{ padding: 24, paddingBottom: 120, maxWidth: 1200, margin: '0 auto' }}>
      {!acceptingOrders && (
        <div style={{
          background: '#fee2e2',
          color: '#b91c1c',
          padding: 12,
          borderRadius: 8,
          textAlign: 'center',
          fontWeight: 600,
          marginBottom: 16
        }}>
          ⚠️ Online orders are currently disabled.
        </div>
      )}

      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'saturate(180%) blur(8px)',
        WebkitBackdropFilter: 'saturate(180%) blur(8px)',
        borderBottom: '1px solid rgba(226,232,240,0.6)',
        paddingTop: 'max(0px, env(safe-area-inset-top))'
      }}>
        <Header
          profile={profile}
          search={search}
          onSearchChange={setSearch}
          cartCount={cartArray.reduce((n, ci) => n + ci.qty, 0)}
          onViewCart={() => setCartOpen(true)}
        />
      </div>

      {loading && <p>Loading menu...</p>}
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      {!loading && (
        <>
          {activeTab === 'menu' && (
            <MenuGrid
              items={filteredItems}
              onAddToCart={(item) => updateCartQuantity(item, 1)}
              cart={cart}
              onRemoveFromCart={(item) => updateCartQuantity(item, -1)}
              acceptingOrders={acceptingOrders}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesPage
              categories={categories}
              onPickCategory={(catId) => { setActiveCat(catId); setActiveTab('menu'); }}
            />
          )}
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

      {cartArray.length > 0 && !isCartOpen && (
  <>
    {/* Spacer so content and bottom nav aren’t covered */}
    <div style={{ height: 84 }} />

    {/* Floating "View cart" pill */}
    <button
      onClick={() => setCartOpen(true)}
      style={floatingCartStyle}
      aria-label="View cart"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        <div style={cartBadgeStyle}>{cartArray.reduce((n, ci) => n + ci.qty, 0)}</div>
        <div style={{ fontWeight: 700 }}>View cart</div>
        <div style={{ marginLeft: 'auto', fontWeight: 700 }}>{formatPrice(cartTotal)}</div>
        <span aria-hidden style={{ fontSize: 18 }}>›</span>
      </div>
    </button>
  </>
)}

      {!isCartOpen && (
  <div style={bottomNavStyle} role="navigation" aria-label="Primary">
    <button
      style={activeTab === 'menu' ? navBtnActiveStyle : navBtnStyle}
      onClick={() => setActiveTab('menu')}
    >
      🍽️
      <div style={navLabelStyle}>Menu</div>
    </button>
    <button
      style={activeTab === 'categories' ? navBtnActiveStyle : navBtnStyle}
      onClick={() => setActiveTab('categories')}
    >
      🗂️
      <div style={navLabelStyle}>Categories</div>
    </button>
    <button
      style={navBtnStyle}
      onClick={() => { setActiveTab('orders'); goToOrders(); }}
    >
      🧾
      <div style={navLabelStyle}>My Orders</div>
    </button>
  </div>
)}

    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: '1px solid #e2e8f0',
        background: active ? '#f97316' : '#fff',
        color: active ? '#fff' : '#0f172a',
        padding: '6px 12px',
        borderRadius: 999,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );
}

function CategoriesPage({ categories, onPickCategory }) {
  if (!categories?.length) {
    return <p style={{ color: '#64748b' }}>No categories available.</p>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginTop: 12 }}>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onPickCategory(c.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: 12,
            borderRadius: 14,
            border: '1px solid #eef2f7',
            background: '#fff',
            boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ width: '100%', height: 80, borderRadius: 10, background: '#f8fafc', marginBottom: 8 }} />
          <div style={{ fontWeight: 700 }}>{c.name}</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>Tap to view</div>
        </button>
      ))}
    </div>
  );
}

function MenuGrid({ items, onAddToCart, cart, onRemoveFromCart, acceptingOrders }) {
  if (items.length === 0) {
    return <p style={{ color: '#64748b' }}>No items found. Try a different search or category.</p>;
  }

  return (
    <div style={menuTilesGridStyle}>
      {items.map((item) => {
        const qty = cart[item.id]?.qty || 0;
        const isAvailable = item.is_available;

        return (
          <button
            key={item.id}
            style={{ ...menuTileCardStyle, opacity: isAvailable ? 1 : 0.6 }}
            onClick={() => { /* optional: open details later */ }}
          >
            <div style={tileImageWrapStyle}>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} style={tileImageStyle} />
              )}
            </div>

            <div style={{ paddingTop: 8, width: '100%' }}>
              <div style={tileNameStyle}>{item.name}</div>
              <div style={tileSubStyle}>Tap to view</div>

              <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                <div style={tilePriceStyle}>{formatPrice(item.price)}</div>
                <div style={{ marginLeft: 'auto' }}>
                  {isAvailable && acceptingOrders ? (
                    qty > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={(e) => { e.stopPropagation(); onRemoveFromCart(item); }} style={qtyBtnTileStyle}>−</button>
                        <span style={qtyCountStyle}>{qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); onAddToCart(item); }} style={qtyBtnTileStyle}>+</button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); onAddToCart(item); }} style={addTileBtnStyle}>ADD</button>
                    )
                  ) : (
                    <div style={tileOutStyle}>{acceptingOrders ? 'Out' : 'Paused'}</div>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
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
          <p style={demostyle}>This MENU is for VIDYARTHI KHANA.</p>
          <p style={demostyle}>Keep checking your order status in My Orders Section and go pick your order when it's ready for pickup.</p>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
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
        <button onClick={onViewCart} style={cartCount === 0 ? viewCartButtonStyle : filledCartButtonStyle}>
          🛒 Cart ({cartCount})
        </button>
      </div>
    </div>
  );
}

/* Styles kept from previous step */
const greetingContainerStyle = { marginBottom: 16 };
const greetingHeadingStyle = { margin: '0 0 4px 0', fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' };
const nameStyle = { fontWeight: 800, color: '#f97316' };
const subheadingStyle = { margin: 0, fontSize: '1rem', color: '#64748b' };
const searchInputStyle = {
  padding: 10,
  maxWidth: '45vw',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  transition: 'all 0.2s ease-in-out',
};

const viewCartButtonStyle = { padding: '10px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700 };
const addToCartButtonStyle = { padding: '10px 16px', borderRadius: 12, border: '1px solid #16a34a', background: '#ecfdf5', color: '#166534', cursor: 'pointer', fontWeight: 700 };
const quantityButtonStyle = { width: 36, height: 36, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '1.2rem' };

const menuItemStyle = {
  border: '1px solid #eef2f7',
  borderRadius: 18,
  overflow: 'hidden',
  background: '#fff',
  boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform .12s ease, box-shadow .12s ease',
};

const outOfStockButtonStyle = {
  padding: '10px 16px',
  borderRadius: 12,
  background: '#e2e8f0',
  color: '#64748b',
  textAlign: 'center',
  fontWeight: 700,
};
const filledCartButtonStyle = { padding: '10px 16px', borderRadius: 12, border: '1px solid #f97316', background: '#f97316', color: '#fff', cursor: 'pointer', fontWeight: 700 };
const demostyle = { color: 'red', fontWeight: 'bold' };
const headerTitleStyle = { fontWeight: 800, color: '#f97316', marginRight: 'auto' };

const floatingCartStyle = {
  position: 'fixed',
  left: 16,
  right: 16,
  // Place pill above the bottom nav (assume nav height ≈ 56px)
  bottom: 'calc(56px + max(16px, env(safe-area-inset-bottom)))',
  zIndex: 1300,
  background: '#22c55e',
  color: '#fff',
  border: 'none',
  borderRadius: 28,
  padding: '14px 18px',
  boxShadow: '0 12px 24px rgba(34,197,94,0.35)',
};


const cartBadgeStyle = {
  width: 36,
  height: 36,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
};

const bottomNavStyle = {
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
  justifyContent: 'space-around',
};

const navBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#0f172a',
  fontSize: 18,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
};

const navBtnActiveStyle = {
  ...navBtnStyle,
  color: '#f97316',
  fontWeight: 800
};

const navLabelStyle = {
  fontSize: 12,
  marginTop: 2
};

const menuItemStyleCompact = {
  border: '1px solid #eef2f7',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#fff',
  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
  display: 'flex',
  flexDirection: 'column',
};

const addToCartButtonStyleCompact = {
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid #16a34a',
  background: '#ecfdf5',
  color: '#166534',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 12,
};

const quantityButtonStyleCompact = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '1rem',
};

const outOfStockButtonStyleCompact = {
  padding: '8px 12px',
  borderRadius: 10,
  background: '#e2e8f0',
  color: '#64748b',
  textAlign: 'center',
  fontWeight: 700,
  fontSize: 12,
};
// 2-up compact grid like Categories
const menuTilesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)', // exactly two columns
  gap: 12,
  marginTop: 8
};


// Card matches Categories aesthetics
const menuTileCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  padding: 12,
  borderRadius: 14,
  border: '1px solid #eef2f7',
  background: '#fff',
  boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
  cursor: 'pointer'
};

const tileImageWrapStyle = {
  width: '100%',
  height: 110,
  borderRadius: 12,
  background: '#f8fafc',
  overflow: 'hidden'
};

const tileImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const tileNameStyle = {
  fontWeight: 700,
  fontSize: '0.95rem',
  lineHeight: 1.2,
  color: '#0f172a'
};

const tileSubStyle = {
  color: '#64748b',
  fontSize: 12,
  marginTop: 2,
  minHeight: 20, // pick 20 or 24 and keep only one definition
  overflow: 'hidden'
};

const tilePriceStyle = {
  fontWeight: 800,
  fontSize: '0.95rem',
  color: '#0f172a'
};

const addTileBtnStyle = {
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid #16a34a',
  background: '#ecfdf5',
  color: '#166534',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 12,
  lineHeight: 1
};

const qtyBtnTileStyle = {
  width: 28,
  height: 28,
  borderRadius: 999,
  border: '1px solid #e2e8f0',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '1rem',
  lineHeight: 1
};

const qtyCountStyle = {
  minWidth: 18,
  textAlign: 'center',
  fontWeight: 800,
  fontSize: 12
};

const tileOutStyle = {
  padding: '6px 10px',
  borderRadius: 999,
  background: '#e2e8f0',
  color: '#64748b',
  fontWeight: 700,
  fontSize: 12
};