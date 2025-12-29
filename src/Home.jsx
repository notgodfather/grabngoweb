import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import { formatPrice } from './types';
import CartModal from './CartModal';

// ──────────────────────────────────────────────────────────────────────────────
// MODERN 2025 FOOD APP STYLING
// ──────────────────────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#22c55e',         // fresh vibrant green
  primaryDark: '#15803d',
  accent: '#f59e0b',          // warm orange — great for prices & highlights
  danger: '#ef4444',
  background: '#fafafa',
  surface: '#ffffff',
  surfaceHover: '#f8fafc',
  text: '#111827',
  textSecondary: '#4b5563',
  border: '#e2e8f0',
  shadowSoft: '0 8px 24px rgba(0,0,0,0.08)',
  shadowStrong: '0 16px 40px rgba(0,0,0,0.14)',
  gradientOverlay: 'linear-gradient(to top, rgba(0,0,0,0.58) 0%, transparent 52%)',
};

// Layout
const mainContentStyle = {
  padding: '24px',
  paddingBottom: '180px', // space for floating cart + safe area
  maxWidth: 1200,
  margin: '0 auto',
  backgroundColor: COLORS.background,
  minHeight: '100vh',
};

// Header
const headerContainerStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  width: '100%',
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: `1px solid ${COLORS.border}`,
  paddingTop: 'env(safe-area-inset-top)',
};

const hdrWrapStyle = {
  padding: '16px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const hdrTopRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

const hdrHelloStyle = {
  fontSize: '1.42rem',
  fontWeight: 800,
  color: COLORS.text,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const noticeChipStyle = {
  padding: '6px 14px',
  borderRadius: 999,
  fontSize: '0.81rem',
  fontWeight: 700,
  background: 'rgba(239,68,68,0.12)',
  color: COLORS.danger,
  border: `1px solid ${COLORS.danger}40`,
};

const hdrSubStyle = {
  fontSize: '1rem',
  color: COLORS.textSecondary,
  fontWeight: 500,
};

const hdrActionsRowStyle = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
};

const hdrSearchStyle = {
  flex: 1,
  padding: '12px 16px',
  borderRadius: 16,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.surface,
  fontSize: '1rem',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  ':focus': {
    borderColor: COLORS.primary,
    boxShadow: `0 0 0 3px ${COLORS.primary}20`,
  },
};

const cartChipStyle = {
  padding: '12px 18px',
  borderRadius: 16,
  background: COLORS.primary,
  color: 'white',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  border: 'none',
  boxShadow: '0 4px 14px rgba(34,197,94,0.32)',
  transition: 'all 0.22s ease',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

// Menu Grid & Cards
const menuGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
  gap: 20,
  marginTop: 20,
};

const menuTileCardStyle = {
  borderRadius: 20,
  overflow: 'hidden',
  background: COLORS.surface,
  border: `1px solid ${COLORS.border}`,
  boxShadow: COLORS.shadowSoft,
  transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
  cursor: 'pointer',
  ':hover': {
    transform: 'translateY(-8px)',
    boxShadow: COLORS.shadowStrong,
  },
};

const tileImageWrapStyle = {
  position: 'relative',
  width: '100%',
  height: 168,
  overflow: 'hidden',
};

const tileImageStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center 35%',
  transition: 'transform 0.45s ease',
};

const imageGradientOverlay = {
  position: 'absolute',
  inset: 0,
  background: COLORS.gradientOverlay,
  pointerEvents: 'none',
};

const tileInfoStyle = {
  padding: '16px 16px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const tileNameStyle = {
  fontSize: '1.14rem',
  fontWeight: 700,
  lineHeight: 1.35,
  color: COLORS.text,
  margin: 0,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const tileDescStyle = {
  fontSize: '0.84rem',
  color: COLORS.textSecondary,
  lineHeight: 1.45,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const priceStyle = {
  fontSize: '1.36rem',
  fontWeight: 800,
  color: COLORS.accent,
  letterSpacing: '-0.5px',
};

const addButtonStyle = {
  padding: '10px 22px',
  borderRadius: 999,
  background: COLORS.primary,
  color: 'white',
  border: 'none',
  fontWeight: 700,
  fontSize: '0.94rem',
  boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
  transition: 'all 0.22s ease',
  cursor: 'pointer',
};

const qtyControlsContainer = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#f1f5f9',
  padding: '6px 12px',
  borderRadius: 999,
};

const qtyButtonStyle = {
  width: 38,
  height: 38,
  borderRadius: 999,
  background: 'white',
  border: `1px solid ${COLORS.border}`,
  fontSize: '1.28rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  cursor: 'pointer',
};

// Floating Cart
const floatingCartStyle = {
  position: 'fixed',
  left: '16px',
  right: '16px',
  bottom: 'calc(84px + env(safe-area-inset-bottom))',
  background: 'rgba(34, 197, 94, 0.96)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  color: 'white',
  borderRadius: 32,
  padding: '16px 24px',
  boxShadow: '0 14px 44px rgba(34,197,94,0.38)',
  border: '1px solid rgba(255,255,255,0.22)',
  zIndex: 1300,
  transition: 'all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// ──────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ──────────────────────────────────────────────────────────────────────────────

function Header({
  profile,
  search,
  onSearchChange,
  cartCount,
  onViewCart,
  acceptingOrders,
  inFlightOrderId,
}) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Guest';

  return (
    <div style={hdrWrapStyle}>
      <div style={hdrTopRowStyle}>
        <div style={hdrHelloStyle}>
          <span>👋</span> Hi, {firstName}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {inFlightOrderId && (
            <div
              style={{
                ...noticeChipStyle,
                background: '#fffbeb',
                color: '#d97706',
                borderColor: '#fcd34d80',
              }}
            >
              Finalizing #{String(inFlightOrderId).slice(-6)}
            </div>
          )}
          {!acceptingOrders && <div style={noticeChipStyle}>Ordering Paused</div>}
        </div>
      </div>

      <div style={hdrSubStyle}>What are you craving today?</div>

      <div style={hdrActionsRowStyle}>
        <input
          placeholder="Search meals, cuisine..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={hdrSearchStyle}
          aria-label="Search food items"
        />
        <button
          onClick={onViewCart}
          style={cartChipStyle}
          aria-label={`Cart with ${cartCount} items`}
        >
          🛒 Cart
          {cartCount > 0 && (
            <span
              style={{
                background: 'white',
                color: COLORS.primary,
                borderRadius: 999,
                padding: '2px 8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                minWidth: 24,
                textAlign: 'center',
              }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function MenuGrid({ items, onAddToCart, cart, onRemoveFromCart, acceptingOrders }) {
  if (!items?.length) {
    return (
      <p style={{ color: COLORS.textSecondary, textAlign: 'center', padding: '40px 20px' }}>
        No items found. Try another search or category.
      </p>
    );
  }

  return (
    <div style={menuGridStyle}>
      {items.map((item) => {
        const qty = cart[item.id]?.qty || 0;
        const isAvailable = item.is_available;

        return (
          <div
            key={item.id}
            style={{
              ...menuTileCardStyle,
              opacity: isAvailable ? 1 : 0.62,
            }}
          >
            <div style={tileImageWrapStyle}>
              {item.image_url ? (
                <>
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={tileImageStyle}
                    loading="lazy"
                  />
                  <div style={imageGradientOverlay} />
                </>
              ) : (
                <div
                  style={{
                    ...tileImageStyle,
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3.6rem',
                  }}
                >
                  🍲
                </div>
              )}
            </div>

            <div style={tileInfoStyle}>
              <h3 style={tileNameStyle}>{item.name}</h3>
              <p style={tileDescStyle}>{item.description || '• Popular choice'}</p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                }}
              >
                <div style={priceStyle}>{formatPrice(Number(item.price))}</div>

                {isAvailable && acceptingOrders ? (
                  qty > 0 ? (
                    <div style={qtyControlsContainer}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFromCart(item);
                        }}
                        style={qtyButtonStyle}
                      >
                        −
                      </button>
                      <span
                        style={{
                          minWidth: 32,
                          textAlign: 'center',
                          fontWeight: 700,
                          color: COLORS.text,
                        }}
                      >
                        {qty}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item);
                        }}
                        style={qtyButtonStyle}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(item);
                      }}
                      style={addButtonStyle}
                    >
                      Add
                    </button>
                  )
                ) : (
                  <div
                    style={{
                      padding: '8px 18px',
                      borderRadius: 999,
                      background: '#e2e8f0',
                      color: COLORS.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.88rem',
                    }}
                  >
                    {acceptingOrders ? 'Sold Out' : 'Paused'}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FloatingCart({ cartArray, cartTotal, onClick }) {
  if (!cartArray?.length) return null;

  const itemCount = cartArray.reduce((sum, ci) => sum + ci.qty, 0);

  return (
    <button onClick={onClick} style={floatingCartStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.28)',
            borderRadius: 999,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.1rem',
          }}
        >
          {itemCount}
        </div>

        <div style={{ fontWeight: 700, fontSize: '1.18rem' }}>View Cart</div>

        <div style={{ fontWeight: 800, fontSize: '1.28rem' }}>
          {formatPrice(cartTotal)}
        </div>

        <span style={{ fontSize: 28, opacity: 0.9 }}>→</span>
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────────────────────

export default function Home({
  externalActiveTab = 'menu',
  onTabChange,
  setGlobalCartOpen,
}) {
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckingOut, setCheckingOut] = useState(false);
  const [inFlightOrderId, setInFlightOrderId] = useState(
    localStorage.getItem('inflight_order_id') || null
  );
  const [activeTab, setActiveTab] = useState('menu');

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : {};
    } catch {
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

  // ── Effects & Data ────────────────────────────────────────────────────────

  useEffect(() => {
    if (['menu', 'categories'].includes(externalActiveTab)) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    if (inFlightOrderId) {
      localStorage.setItem('inflight_order_id', inFlightOrderId);
    } else {
      localStorage.removeItem('inflight_order_id');
    }
  }, [cart, inFlightOrderId]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      const [catRes, itemRes, settingsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('is_available', true)
          .order('display_order', { ascending: true }),
        supabase.from('food_items').select('*').order('name'),
        supabase.from('settings').select('receive_orders').limit(1).single(),
      ]);

      if (!mounted) return;

      if (catRes.error || itemRes.error) {
        setError(catRes.error?.message || itemRes.error?.message || 'Failed to load menu');
      } else {
        setCategories(catRes.data || []);
        setItems(itemRes.data || []);
        setAcceptingOrders(settingsRes.data?.receive_orders ?? true);
      }

      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 300000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const inCat = activeCat === 'all' || it.category_id === activeCat;
      const matches = !q ||
        it.name.toLowerCase().includes(q) ||
        (it.description || '').toLowerCase().includes(q);
      return inCat && matches;
    });
  }, [items, search, activeCat]);

  const updateCartQuantity = (item, delta) => {
    setCart((current) => {
      const qty = (current[item.id]?.qty || 0) + delta;
      if (qty <= 0) {
        const next = { ...current };
        delete next[item.id];
        return next;
      }
      return {
        ...current,
        [item.id]: { item, qty },
      };
    });
  };

  const cartArray = Object.values(cart);
  const cartCount = cartArray.reduce((sum, ci) => sum + ci.qty, 0);
  const cartTotal = cartArray.reduce(
    (sum, ci) => sum + Number(ci.item.price) * ci.qty,
    0
  );

  // ── Checkout logic (unchanged) ────────────────────────────────────────────
  // ... your existing pollForOrder + handleCheckout functions here ...
  // (I left them out of this snippet to save space, but you should keep them)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: COLORS.background, minHeight: '100vh' }}>
      {/* Sticky Header */}
      <div style={headerContainerStyle}>
        <Header
          profile={profile}
          search={search}
          onSearchChange={setSearch}
          cartCount={cartCount}
          onViewCart={openCart}
          acceptingOrders={acceptingOrders}
          inFlightOrderId={inFlightOrderId}
        />
      </div>

      <div style={mainContentStyle}>
        {!acceptingOrders && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              color: COLORS.danger,
              padding: 16,
              borderRadius: 16,
              textAlign: 'center',
              fontWeight: 600,
              marginBottom: 24,
              border: `1px solid ${COLORS.danger}40`,
            }}
          >
            ⚠️ Online ordering is currently paused
          </div>
        )}

        {loading && (
          <p style={{ color: COLORS.textSecondary, textAlign: 'center', padding: '40px 0' }}>
            Loading delicious menu...
          </p>
        )}

        {error && <p style={{ color: COLORS.danger, textAlign: 'center' }}>{error}</p>}

        {!loading && !error && (
          <>
            {activeTab === 'menu' && (
              <MenuGrid
                items={filteredItems}
                onAddToCart={(item) => updateCartQuantity(item, 1)}
                onRemoveFromCart={(item) => updateCartQuantity(item, -1)}
                cart={cart}
                acceptingOrders={acceptingOrders}
              />
            )}

            {activeTab === 'categories' && (
              // You can also modernize CategoriesPage similarly
              // For now keeping original or you can replace with horizontal chips
              <div>Categories view (update this part too if needed)</div>
            )}
          </>
        )}

        {isCartOpen && (
          <CartModal
            cart={cart}
            onClose={closeCart}
            onUpdateQuantity={(id, delta) => {
              const item = items.find((i) => i.id === id);
              if (item) updateCartQuantity(item, delta);
            }}
            onCheckout={(amount) => {/* your handleCheckout */}}
            isCheckingOut={isCheckingOut}
          />
        )}

        {/* Modern Floating Cart */}
        {cartArray.length > 0 && !isCartOpen && !inFlightOrderId && (
          <FloatingCart
            cartArray={cartArray}
            cartTotal={cartTotal}
            onClick={openCart}
          />
        )}
      </div>
    </div>
  );
}