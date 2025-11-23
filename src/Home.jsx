import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import { formatPrice } from './types';
import CartModal from './CartModal';

const ORANGE = "#ff7300";
const FLAT_ITEM_DISCOUNT = 5.00;

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
      if (catRes.error) { setError(catRes.error.message); setLoading(false); return; }
      if (itemRes.error) { setError(itemRes.error.message); setLoading(false); return; }
      if (settingsRes.error) { console.error('Could not fetch order acceptance setting:', settingsRes.error.message); }
      else { setAcceptingOrders(settingsRes.data?.receive_orders ?? true); }
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
    const discountedPrice = Math.max(0, itemPrice - FLAT_ITEM_DISCOUNT);
    return sum + discountedPrice * cartItem.qty;
  }, 0);

  const pollForOrder = async (orderId, { timeoutMs = 60000, intervalMs = 2000 } = {}) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await supabase.from('orders').select('id').eq('id', orderId).single();
      if (data?.id) return true;
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return false;
  };

  const handleCheckout = async (totalAmount) => {
    if (!acceptingOrders) { alert('Online ordering is temporarily disabled. Please try again later.'); return; }
    if (!profile?.sub) { alert('You must be logged in to place an order.'); return; }
    if (cartArray.length === 0) return;
    if (inFlightOrderId) { alert(`Your previous payment is being finalized (Order ID: ${inFlightOrderId}). Please wait a moment.`); return; }
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
      if (!window.Cashfree) { alert('Cashfree SDK not loaded'); setCheckingOut(false); return; }
      const mode = import.meta.env.PROD ? 'production' : data.envMode || 'sandbox';
      const cashfree = window.Cashfree({ mode });
      setInFlightOrderId(orderId);
      await cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: '_modal',
      });
      const found = await pollForOrder(orderId, { timeoutMs: 60000, intervalMs: 2000 });
      if (!found) {
        alert('Payment received. Finalizing your order in the background. Please check My Orders shortly.');
        return;
      }
      alert('Payment successful! Your order has been placed.');
      setCart({});
      closeCart();
      setInFlightOrderId(null);
    } catch (err) {
      alert(`Order process failed: ${err.message}`);
    } finally { setCheckingOut(false); }
  };

  return (
    <div style={rootStyle}>
      {/* Sticky/floating header */}
      <div style={stickyHeaderStyle}>
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
      <div style={mainContentStyle}>
        {!acceptingOrders && (
          <div style={orderPausedBannerStyle}>
            ⚠️ Online orders are currently disabled.
          </div>
        )}

        {loading && <p style={loadingStyle}>Loading menu...</p>}
        {error && <p style={errorStyle}>{error}</p>}

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
            itemDiscount={FLAT_ITEM_DISCOUNT}
          />
        )}
        {cartArray.length > 0 && !isCartOpen && !inFlightOrderId && (
          <button
            onClick={openCart}
            style={floatingCartStyle}
            aria-label="View cart"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
              <div style={cartBadgeStyle}>{cartArray.reduce((n, ci) => n + ci.qty, 0)}</div>
              <div style={{ fontWeight: 700 }}>View cart</div>
              <div style={{ marginLeft: 'auto', fontWeight: 800 }}>{formatPrice(cartTotal)}</div>
              <span aria-hidden style={{ fontSize: 17, marginLeft: 5 }}>›</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// Categories Page
function CategoriesPage({ categories, onPickCategory }) {
  if (!categories?.length) {
    return <p style={{ color: '#64748b' }}>No categories available.</p>;
  }
  return (
    <div style={categoriesGridStyle}>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onPickCategory(c.id)}
          style={categoryCardStyle}>
          <div style={categoryImageStyle} />
          <div style={{ fontWeight: 700 }}>{c.name}</div>
          <div style={{ color: '#64748b', fontSize: 12 }}>Tap to view</div>
        </button>
      ))}
    </div>
  );
}

// MenuGrid
function MenuGrid({ items, onAddToCart, cart, onRemoveFromCart, acceptingOrders }) {
  if (items.length === 0) {
    return <p style={{ color: '#64748b' }}>No items found. Try a different search or category.</p>;
  }
  return (
    <div style={menuTilesGridStyle}>
      {items.map((item) => {
        const qty = cart[item.id]?.qty || 0;
        const isAvailable = item.is_available;
        const originalPrice = Number(item.price);
        const discountedPrice = Math.max(0, originalPrice - FLAT_ITEM_DISCOUNT);
        const isDiscounted = originalPrice > discountedPrice;
        return (
          <button
            key={item.id}
            style={{ ...menuTileCardStyle, opacity: isAvailable ? 1 : 0.6 }}>
            <div style={tileImageWrapStyle}>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} style={tileImageStyle} loading="lazy" />
              )}
            </div>
            <div style={{ paddingTop: 8, width: '100%' }}>
              <div style={tileNameStyle}>{item.name}</div>
              <div style={tileSubStyle}>{item.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
                <div style={tilePriceWrapStyle}>
                  {isDiscounted && (
                    <span style={originalPriceStyle}>{formatPrice(originalPrice)}</span>
                  )}
                  <div style={tilePriceStyle}>{formatPrice(discountedPrice)}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {isAvailable && acceptingOrders ? (
                    qty > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
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

// Header
function Header({ profile, search, onSearchChange, cartCount, onViewCart, acceptingOrders, inFlightOrderId }) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Guest';
  return (
    <div style={hdrWrapStyle}>
      <div style={hdrTopRowStyle}>
        <div style={hdrHelloStyle}>
          <span style={{ marginRight: 8, color: ORANGE }}>👋</span>
          <span style={{ fontWeight: 800 }}>Hi, {firstName}</span>
        </div>
        {!acceptingOrders && (
          <div style={noticeChipStyle}>Ordering paused</div>
        )}
        {inFlightOrderId && (
          <div style={{
            ...noticeChipStyle,
            background: '#fff7ed',
            color: '#c2410c',
            border: '1px solid #fed7aa'
          }}>
            Finalizing #{String(inFlightOrderId).slice(-8)}
          </div>
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
          🛒<span style={{ marginLeft: 6 }}>Cart</span>
          <span style={cartCountPillStyle}>{cartCount}</span>
        </button>
      </div>
    </div>
  );
}

// --- Styles ---

const rootStyle = { background: "#fbfaf6", minHeight: "100vh", fontFamily: "Inter,sans-serif" };
const stickyHeaderStyle = {
  position: "sticky", top: 0, background: "#fff", zIndex: 1000,
  borderBottom: `2px solid #ffd1a5`, boxShadow: "0 2px 26px #ff730017",
  padding: "18px 10px 14px 10px"
};
const mainContentStyle = { padding: 18, paddingBottom: 100, maxWidth: 730, margin: '0 auto' };
const loadingStyle = { padding: 30, fontSize: "1.15rem", textAlign: "center", color: ORANGE };
const errorStyle = { color: '#b91c1c', padding: 10, margin: '10px 0' };
const orderPausedBannerStyle = {
  background: '#fee2e2',
  color: '#b91c1c',
  padding: 12,
  borderRadius: 8,
  textAlign: 'center',
  fontWeight: 600,
  marginBottom: 14
};
const categoriesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))',
  gap: 13,
  marginTop: 16
};
const categoryCardStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 13,
  borderRadius: 13, border: '1px solid #eef2f7', background: '#fff', boxShadow: '0 3px 10px #ffd1a007',
  textAlign: 'left', cursor: 'pointer'
};
const categoryImageStyle = { width: '100%', height: 80, borderRadius: 10, background: '#f8fafc', marginBottom: 8 };
const menuTilesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))',
  gap: 17,
  marginTop: 11
};
const menuTileCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  padding: 12,
  borderRadius: 14,
  border: '1px solid #eef2f7',
  background: '#fff',
  boxShadow: '0 3px 10px #ffd1a033',
  cursor: 'pointer'
};
const tileImageWrapStyle = {
  width: '100%',
  height: 100,
  borderRadius: 12,
  background: '#f8fafc',
  overflow: 'hidden',
  marginBottom: 6,
  display: "flex", alignItems: "center", justifyContent: "center"
};
const tileImageStyle = {
  width: '85px',
  height: '85px',
  objectFit: 'cover',
  borderRadius: 10
};
const tileNameStyle = { fontWeight: 700, fontSize: '1.13rem', lineHeight: 1.2, color: '#0f172a', marginBottom: 6 };
const tileSubStyle = { color: '#64748b', fontSize: 13, marginTop: 2, minHeight: 20, overflow: 'hidden' };
const tilePriceWrapStyle = { display: 'flex', alignItems: 'center', gap: 7 };
const originalPriceStyle = { textDecoration: 'line-through', color: '#94a3b8', fontSize: '1rem', fontWeight: 500, marginTop: 2, marginRight: 7 };
const tilePriceStyle = { fontWeight: 800, fontSize: '1.02rem', color: ORANGE };
const addTileBtnStyle = {
  padding: '8px 24px',
  borderRadius: 999,
  border: `1px solid ${ORANGE}`,
  background: ORANGE,
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 13,
  lineHeight: 1,
  boxShadow: '0 2px 8px #ffd1a024'
};
const qtyBtnTileStyle = {
  width: 30,
  height: 30,
  borderRadius: 99,
  border: `1px solid ${ORANGE}`,
  background: "#fff",
  color: ORANGE,
  cursor: "pointer",
  fontSize: "1.15rem",
  fontWeight: 700
};
const qtyCountStyle = {
  minWidth: 18,
  textAlign: 'center',
  fontWeight: 800,
  fontSize: 14,
  color: ORANGE,
  margin: "0 8px"
};
const tileOutStyle = {
  padding: '7px 18px',
  borderRadius: 999,
  background: '#f1f5f9',
  color: '#64748b',
  fontWeight: 700,
  fontSize: 13,
  marginLeft: 7
};
const floatingCartStyle = {
  position: 'fixed',
  left: "50%",
  bottom: "36px",
  transform: "translateX(-50%)",
  zIndex: 1300,
  background: ORANGE,
  color: "#fff",
  borderRadius: 29,
  boxShadow: "0 8px 32px #ffd1a066",
  padding: "16px 24px",
  fontWeight: 800,
  fontSize: "1.02rem",
  minWidth: 190,
  border: "none",
  cursor: "pointer"
};
const cartBadgeStyle = {
  width: 33,
  height: 33,
  borderRadius: 99,
  background: "#fff6e6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  color: ORANGE,
  fontSize: 16
};
const hdrWrapStyle = { padding: '10px 0 8px 0', display: 'flex', flexDirection: 'column', gap: 6 };
const hdrTopRowStyle = { display: 'flex', alignItems: 'center', gap: 12 };
const hdrHelloStyle = { fontSize: '1.15rem', fontWeight: 700, color: ORANGE, display: 'flex', alignItems: 'center' };
const noticeChipStyle = {
  marginLeft: 'auto',
  fontSize: 12,
  padding: '6px 13px',
  borderRadius: 999,
  background: '#fee2e2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
  whiteSpace: 'nowrap'
};
const hdrSubStyle = { fontSize: '0.99rem', color: '#64748b', margin: "5px 0 8px 0" };
const hdrActionsRowStyle = { display: 'flex', alignItems: 'center', gap: 13 };
const hdrSearchStyle = {
  padding: "12px 18px",
  borderRadius: 14,
  border: "1.3px solid #ffd1a5",
  flex: 1,
  fontSize: 15,
  boxShadow: "0 1px 10px #ffd1a02d"
};
const cartChipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid #ffe2c2',
  background: ORANGE,
  fontWeight: 700,
  color: "#fff",
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};
const cartCountPillStyle = {
  marginLeft: 8,
  minWidth: 22,
  height: 22,
  borderRadius: 999,
  background: '#fff6e6',
  color: ORANGE,
  fontSize: 14,
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 7px'
};
