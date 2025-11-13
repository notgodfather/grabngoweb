import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import { formatPrice } from './types';
import CartModal from './CartModal';

export default function Home({ externalActiveTab = 'menu', onTabChange, setGlobalCartOpen }) {
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckingOut, setCheckingOut] = useState(false);
  const [paymentVerificationStatus, setPaymentVerificationStatus] = useState(''); // New state for status

  // local tab for Menu | Categories; 'orders' is handled by router
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

  // helpers to sync global nav visibility
  const openCart = () => {
    setCartOpen(true);
    setGlobalCartOpen?.(true);
  };
  const closeCart = () => {
    setCartOpen(false);
    setGlobalCartOpen?.(false);
  };

  // sync internal tab with global tab from router
  useEffect(() => {
    if (externalActiveTab === 'menu' || externalActiveTab === 'categories') {
      if (externalActiveTab !== activeTab) setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // --- NEW EFFECT FOR HANDLING REDIRECTED PAYMENT STATUS ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    
    if (orderId && profile?.sub) {
      // We found an order ID in the URL, indicating a payment redirect.
      // Clear the orderId from the URL immediately to prevent re-running on next refresh.
      window.history.replaceState(null, '', window.location.pathname);
      
      setCheckingOut(true);
      setPaymentVerificationStatus('Verifying payment status...');

      const verifyAndRecord = async () => {
        try {
          // Step 1: Get cart data from localStorage 
          const savedCart = JSON.parse(localStorage.getItem('cart') || '{}');
          const cartArray = Object.values(savedCart);
          if (cartArray.length === 0) {
              setPaymentVerificationStatus('Order verification failed: Cart data missing. Please check Cashfree dashboard.');
              return;
          }

          // Step 2: Verify payment on backend
          const verifyResponse = await fetch(`${import.meta.env.VITE_CASHFREE_API_URL}/api/verify-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderId }),
          });

          const verifyData = await verifyResponse.json();
          if (!verifyResponse.ok) throw new Error(verifyData.error || 'Failed to verify payment');

          if (verifyData.status === 'PAID' || verifyData.status === 'SUCCESS') {
            setPaymentVerificationStatus('Payment verified. Recording order...');

            // Step 3: Record order in database
            const recordResponse = await fetch(`${import.meta.env.VITE_CASHFREE_API_URL}/api/record-order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: profile.sub,
                userEmail: profile.email,
                cart: cartArray,
                orderId: orderId,
              }),
            });
            const recordData = await recordResponse.json();
            if (!recordResponse.ok) throw new Error(recordData.error || 'Failed to record order');

            alert('Payment successful! Your order has been placed.');
            setCart({}); // Clear cart upon successful order
            closeCart();
            setPaymentVerificationStatus('Order placed successfully!');
          } else {
            alert(`Payment status: ${verifyData.status}. Please check your order.`);
            setPaymentVerificationStatus(`Payment failed: ${verifyData.status}`);
          }
        } catch (err) {
          alert(`Payment verification failed: ${err.message}`);
          setPaymentVerificationStatus(`Verification Error: ${err.message}`);
        } finally {
          setCheckingOut(false);
        }
      };

      verifyAndRecord();
    }
  }, [profile]); 
  // --- END NEW EFFECT ---


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

      // Step 1: Create order & get payment session
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

      // Step 2: Launch checkout and let it redirect the entire browser window 
      // (to be picked up by the new useEffect hook upon page reload)
      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_self' // ensures full redirect
      });
      
      // Note: Code here will likely not execute due to browser redirect.

    } catch (err) {
      alert(`Payment failed or interrupted: ${err.message}`);
      setCheckingOut(false);
    }
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
          onViewCart={openCart}
          acceptingOrders={acceptingOrders}
        />
      </div>
      
      {/* Display verification status if checking out */}
      {isCheckingOut && (
          <div style={{
              padding: 20,
              textAlign: 'center',
              backgroundColor: '#fff',
              borderRadius: 8,
              marginTop: 16,
              border: '1px solid #e2e8f0',
              fontWeight: 600
          }}>
              {paymentVerificationStatus || 'Processing checkout...'}
          </div>
      )}

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
              onPickCategory={(catId) => {
                setActiveCat(catId);
                setActiveTab('menu');
                onTabChange?.('menu');
              }}
            />
          )}
        </>
      )}

      {isCartOpen && (
        <CartModal
          cart={cart}
          onClose={closeCart}
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
          <div style={{ height: 84 }} />
          <button
            onClick={openCart}
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
    </div>
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
            onClick={() => {}}
          >
            <div style={tileImageWrapStyle}>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} style={tileImageStyle} loading="lazy" />
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

function Header({ profile, search, onSearchChange, cartCount, onViewCart, acceptingOrders }) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Guest';

  return (
    <div style={hdrWrapStyle}>
      <div style={hdrTopRowStyle}>
        <div style={hdrHelloStyle}>
          <span style={{ marginRight: 8 }}>👋</span>
          <span style={{ fontWeight: 800 }}>Hi, {firstName}</span>
        </div>
        {/* Only show chip when ordering is paused */}
        {!acceptingOrders && (
          <div style={noticeChipStyle}>Ordering paused</div>
        )}
      </div>

      <div style={hdrSubStyle}>What are you craving today?</div>

      <div style={hdrActionsRowStyle}>
        <input
          placeholder="Search for food..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={hdrSearchStyle}
        />
        <button onClick={onViewCart} style={cartChipStyle}>
          🛒 <span style={{ marginLeft: 6 }}>Cart</span>
          <span style={cartCountPillStyle}>{cartCount}</span>
        </button>
      </div>
    </div>
  );
}


/* Styles */
const floatingCartStyle = {
  position: 'fixed',
  left: 16,
  right: 16,
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

const menuTilesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
  marginTop: 8
};

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
  minHeight: 20,
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

const hdrWrapStyle = {
  padding: '10px 0 8px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const hdrTopRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8
};

const hdrHelloStyle = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#1e293b',
  display: 'flex',
  alignItems: 'center'
};

const noticeChipStyle = {
  marginLeft: 'auto',
  fontSize: 12,
  padding: '6px 10px',
  borderRadius: 999,
  background: '#fee2e2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  whiteSpace: 'nowrap'
};

const hdrSubStyle = {
  fontSize: '0.95rem',
  color: '#64748b'
};

const hdrActionsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10
};

const hdrSearchStyle = {
  padding: 10,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  flex: 1
};

const cartChipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid #e2e8f0',
  background: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

const cartCountPillStyle = {
  marginLeft: 8,
  minWidth: 22,
  height: 22,
  borderRadius: 999,
  background: '#f97316',
  color: '#fff',
  fontSize: 12,
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 6px'
};