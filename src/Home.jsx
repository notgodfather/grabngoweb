import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import { formatPrice } from './types';
import CartModal from './CartModal';


// --- Style Definitions (Updated for Mobile Responsiveness) ---

const COLORS = {
  primary: '#34d399', 
  primaryDark: '#059669', 
  secondary: '#1d4ed8', 
  background: '#f8fafc', 
  cardBackground: '#ffffff',
  text: '#1f2937', 
  subText: '#6b7280', 
  border: '#e5e7eb', 
  danger: '#ef4444', 
};

// Global content container style
const mainContentStyle = {
  padding: '24px',
  // Increased bottom padding to accommodate for floating cart + bottom nav
  paddingBottom: '160px', 
  maxWidth: 1200,
  margin: '0 auto',
  backgroundColor: COLORS.background, 
};

// --- Header Styles (Unchanged) ---
const hdrWrapStyle = {
  padding: '12px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const hdrTopRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const hdrHelloStyle = {
  fontSize: '1.25rem', 
  fontWeight: 700,
  color: COLORS.text,
  display: 'flex',
  alignItems: 'center',
};

const noticeChipStyle = {
  fontSize: 12,
  padding: '6px 12px',
  borderRadius: 999,
  background: COLORS.danger + '15', 
  color: COLORS.danger,
  border: `1px solid ${COLORS.danger}50`,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  transition: 'all 0.3s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
};

const hdrSubStyle = {
  fontSize: '0.95rem',
  color: COLORS.subText,
  marginBottom: 8,
};

const hdrActionsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const hdrSearchStyle = {
  padding: '10px 14px',
  borderRadius: 12,
  border: `1px solid ${COLORS.border}`,
  flex: 1,
  fontSize: '1rem',
  transition: 'border-color 0.2s',
};

const cartChipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none', 
  background: COLORS.primary,
  color: COLORS.cardBackground,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 6px rgba(52, 211, 153, 0.2)', 
};

const cartCountPillStyle = {
  marginLeft: 4,
  minWidth: 20,
  height: 20,
  borderRadius: 999,
  background: COLORS.cardBackground,
  color: COLORS.primaryDark,
  fontSize: 12,
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
};

// --- Menu Grid Styles (Key Fix: Min width reduced for 2 columns on mobile) ---
const menuTilesGridStyle = {
  display: 'grid',
  // Fixed: Adjusted minmax to ensure at least two columns on small screens
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
  gap: 16,
  marginTop: 16,
};

const menuTileCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  padding: 12,
  borderRadius: 16, 
  border: `1px solid ${COLORS.border}`,
  background: COLORS.cardBackground,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)', 
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const tileImageWrapStyle = {
  width: '100%',
  height: 120,
  borderRadius: 12,
  background: COLORS.background,
  overflow: 'hidden',
};

const tileImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const tileNameStyle = {
  fontWeight: 800,
  fontSize: '1rem', 
  lineHeight: 1.3,
  color: COLORS.text,
  marginTop: 8,
};

const tileSubStyle = {
  color: COLORS.subText,
  fontSize: 12,
  marginTop: 2,
  minHeight: 20,
  overflow: 'hidden',
};

const addTileBtnStyle = {
  padding: '8px 14px',
  borderRadius: 999,
  border: 'none',
  background: COLORS.primary,
  color: COLORS.cardBackground,
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 12,
  lineHeight: 1,
  transition: 'background 0.2s',
};

const qtyBtnTileStyle = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.cardBackground,
  color: COLORS.text,
  cursor: 'pointer',
  fontSize: '1.1rem',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color 0.2s',
};

const qtyCountStyle = {
  minWidth: 20,
  textAlign: 'center',
  fontWeight: 800,
  fontSize: 14,
  color: COLORS.text,
};

const tileOutStyle = {
  padding: '6px 12px',
  borderRadius: 999,
  background: COLORS.border,
  color: COLORS.subText,
  fontWeight: 700,
  fontSize: 12,
};

// --- Categories Page Styles (Unchanged) ---
const categoriesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  gap: 16, 
  marginTop: 16,
};

const categoryCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 12,
  borderRadius: 16,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.cardBackground,
  boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const categoryImagePlaceholderStyle = {
  width: '100%',
  height: 80,
  borderRadius: 10,
  background: COLORS.background, 
  marginBottom: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  color: COLORS.subText,
  fontWeight: 700,
};

// --- Floating Cart Pill Style (Key Fix: Adjusted bottom position) ---
const floatingCartStyle = {
  position: 'fixed',
  left: 24,
  right: 24,
  // Fixed: Added extra space (84px) to ensure it clears the bottom navigation bar
  bottom: 'calc(84px + max(0px, env(safe-area-inset-bottom)))', 
  zIndex: 1300,
  background: COLORS.primaryDark, 
  color: COLORS.cardBackground,
  border: 'none',
  borderRadius: 32, 
  padding: '16px 20px',
  boxShadow: '0 10px 20px rgba(52, 211, 153, 0.4)', 
  transition: 'all 0.3s ease',
};

const cartBadgeStyle = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: 14,
};

// --- Helper Components (Updated with minimal changes) ---

function CategoriesPage({ categories, onPickCategory }) {
  if (!categories?.length) {
    return <p style={{ color: COLORS.subText, padding: 12 }}>No categories available.</p>;
  }
  return (
    <div style={categoriesGridStyle}>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onPickCategory(c.id)}
          style={categoryCardStyle}
        >
          <div style={categoryImagePlaceholderStyle}>
            {c.image_url ? 
              <img src={c.image_url} alt={c.name} style={tileImageStyle} loading="lazy" />
              : c.name.charAt(0)}
          </div>
          <div style={{ fontWeight: 800, color: COLORS.text }}>{c.name}</div>
          <div style={{ color: COLORS.subText, fontSize: 12, marginTop: 4 }}>View Menu</div>
        </button>
      ))}
    </div>
  );
}

function MenuGrid({ items, onAddToCart, cart, onRemoveFromCart, acceptingOrders }) {
  if (items.length === 0) {
    return <p style={{ color: COLORS.subText, padding: 12 }}>No items found. Try a different search or category.</p>;
  }

  return (
    <div style={menuTilesGridStyle}>
      {items.map((item) => {
        const qty = cart[item.id]?.qty || 0;
        const isAvailable = item.is_available;
        const originalPrice = Number(item.price);

        return (
          <div
            key={item.id}
            // Removed the redundant empty onClick={() => {}} from the main div
            style={{ ...menuTileCardStyle, opacity: isAvailable ? 1 : 0.6 }}
          >
            <div style={tileImageWrapStyle}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} style={tileImageStyle} loading="lazy" />
              ) : (
                <div style={{ ...tileImageStyle, background: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.subText }}>
                  <span role="img" aria-label="dish">🍽️</span>
                </div>
              )}
            </div>

            <div style={{ paddingTop: 8, width: '100%' }}>
              <div style={tileNameStyle}>{item.name}</div>
              <div style={tileSubStyle}>{item.description || 'Tap for details'}</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: COLORS.primaryDark }}>
                  {formatPrice(originalPrice)}
                </div>

                <div>
                  {isAvailable && acceptingOrders ? (
                    qty > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveFromCart(item); }}
                          style={qtyBtnTileStyle}
                          aria-label={`Remove one ${item.name}`}
                        >
                          −
                        </button>
                        <span style={qtyCountStyle}>{qty}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
                          style={qtyBtnTileStyle}
                          aria-label={`Add one ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
                        style={addTileBtnStyle}
                      >
                        ADD
                      </button>
                    )
                  ) : (
                    <div style={tileOutStyle}>{acceptingOrders ? 'Out' : 'Paused'}</div>
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

function Header({ profile, search, onSearchChange, cartCount, onViewCart, acceptingOrders, inFlightOrderId }) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Guest';

  return (
    <div style={hdrWrapStyle}>
      <div style={hdrTopRowStyle}>
        <div style={hdrHelloStyle}>
          <span style={{ marginRight: 8 }}>👋</span>
          <span style={{ fontWeight: 800 }}>Hi, {firstName}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {inFlightOrderId && (
            <div style={{ ...noticeChipStyle, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
              Finalizing #{String(inFlightOrderId).slice(-8)}
            </div>
          )}
          {!acceptingOrders && (
            <div style={noticeChipStyle}>Ordering Paused</div>
          )}
        </div>
      </div>

      <div style={hdrSubStyle}>What are you craving today?</div>

      <div style={hdrActionsRowStyle}>
        <input
          placeholder="Search for food..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={hdrSearchStyle}
          aria-label="Search food items"
        />
        <button onClick={onViewCart} style={cartChipStyle} aria-label={`View cart with ${cartCount} items`}>
          <span role="img" aria-label="shopping cart">🛒</span>
          <span style={{ marginLeft: 2 }}>Cart</span>
          <span style={cartCountPillStyle}>{cartCount}</span>
        </button>
      </div>
    </div>
  );
}


// --- Main Component ---

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

  const [inFlightOrderId, setInFlightOrderId] = useState(localStorage.getItem('inflight_order_id') || null);

  const [activeTab, setActiveTab] = useState('menu');

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : {};
    } catch (e) {
      console.error('Failed to parse cart from localStorage', e);
      return {};
    }
  });

  const [acceptingOrders, setAcceptingOrders] = useState(true);

  const openCart = () => {
    setCartOpen(true);
    setGlobalCartOpen?.(true);
  };
  const closeCart = () => {
    setCartOpen(false);
    setGlobalCartOpen?.(false);
  };

  useEffect(() => {
    if (externalActiveTab === 'menu' || externalActiveTab === 'categories') {
      if (externalActiveTab !== activeTab) setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab, activeTab]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    if (inFlightOrderId) {
      localStorage.setItem('inflight_order_id', inFlightOrderId);
    } else {
      localStorage.removeItem('inflight_order_id');
    }
  }, [cart, inFlightOrderId]);

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
        console.error('Could not fetch order acceptance setting:', settingsRes.error.message);
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
  const cartTotal = cartArray.reduce((sum, cartItem) => {
    const itemPrice = Number(cartItem.item.price);
    return sum + itemPrice * cartItem.qty;
  }, 0);


  // Poll for order existence after checkout; webhook records when SUCCESS
  const pollForOrder = async (orderId, { timeoutMs = 60000, intervalMs = 2000 } = {}) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderId)
        .single();
      if (data?.id) return true;
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
  };

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
      const { orderId, paymentSessionId } = data;
      if (!window.Cashfree) {
        alert('Cashfree SDK not loaded');
        setCheckingOut(false);
        return;
      }
      const mode = import.meta.env.PROD ? 'production' : data.envMode || 'sandbox';
      const cashfree = window.Cashfree({ mode });
      // Track in-flight order id in case the page reloads mid-payment
      setInFlightOrderId(orderId);
      // 2) Launch Cashfree Payment Modal
      await cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal',
      });
      // 3) Poll for webhook-recorded order
      const found = await pollForOrder(orderId, { timeoutMs: 60000, intervalMs: 2000 });
      if (!found) {
        alert('Payment received. Finalizing your order in the background. Please check My Orders shortly.');
        // Keep cart until order appears; webhook will write it soon
        return;
      }
      // 4) Success
      alert('Payment successful! Your order has been placed.');
      setCart({});
      closeCart();
      setInFlightOrderId(null);
    } catch (err) {
      alert(`Order process failed: ${err.message}`);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div style={{ background: COLORS.background, minHeight: '100vh' }}>
      {/* Sticky full-width header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100vw',
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${COLORS.border}`,
        paddingTop: 'max(0px, env(safe-area-inset-top))'
      }}>
        <Header
          profile={profile}
          search={search}
          onSearchChange={setSearch}
          cartCount={cartArray.reduce((n, ci) => n + ci.qty, 0)}
          onViewCart={openCart}
          acceptingOrders={acceptingOrders}
          inFlightOrderId={inFlightOrderId}
        />
      </div>

      {/* Main constrained content */}
      <div style={mainContentStyle}>
        {!acceptingOrders && (
          <div style={{
            background: COLORS.danger + '10',
            color: COLORS.danger,
            padding: 14,
            borderRadius: 12,
            textAlign: 'center',
            fontWeight: 600,
            marginBottom: 20,
            border: `1px solid ${COLORS.danger}50`,
          }}>
            ⚠️ Online orders are currently disabled.
          </div>
        )}

        {loading && <p style={{ color: COLORS.subText }}>Loading menu...</p>}
        {error && <p style={{ color: COLORS.danger }}>{error}</p>}

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

        {/* Floating "View cart" pill */}
        {cartArray.length > 0 && !isCartOpen && !inFlightOrderId && (
          <button
            onClick={openCart}
            style={floatingCartStyle}
            aria-label={`View cart with total ${formatPrice(cartTotal)}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
              <div style={cartBadgeStyle}>{cartArray.reduce((n, ci) => n + ci.qty, 0)}</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>View Cart</div>
              <div style={{ marginLeft: 'auto', fontWeight: 800, fontSize: '1.1rem' }}>{formatPrice(cartTotal)}</div>
              <span aria-hidden style={{ fontSize: 20 }}>→</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}