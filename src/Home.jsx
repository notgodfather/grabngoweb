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
  // --- CHANGE 1: Add state to track the checkout process ---
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
      const [catRes, itemRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_available', true).order('display_order', { ascending: true }),
        supabase.from('food_items').select('*').eq('is_available', true).order('name', { ascending: true })
      ]);


      if (!isMounted) return;


      if (catRes.error) setError(catRes.error.message);
      else if (itemRes.error) setError(itemRes.error.message);
      else {
        setCategories(catRes.data || []);
        setItems(itemRes.data || []);
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


  // --- CHANGE 2: Replace the direct order placement with the Razorpay payment flow ---
  const handleCheckout = async () => {
    if (!profile?.sub) {
      alert('You must be logged in to place an order.');
      return;
    }
    if (cartArray.length === 0) return;

    setCheckingOut(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-order', {
        body: {
          amount: cartTotal * 100, // Amount in paisa
          currency: 'INR',
          notes: {
            // This data will be passed to the webhook for final order creation
            custom_data: JSON.stringify({ cart, profile })
          }
        }
      });

      if (error) throw error;
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'GrabNGo',
        description: 'Food Order Payment',
        order_id: data.id,
        handler: function (response) {
          // This runs on successful payment
          alert('Payment successful! Your order has been placed.');
          setCart({});
          setCartOpen(false);
          // Note: We don't need to setCheckingOut(false) here because the component unmounts
        },
        prefill: {
          name: profile.name || '',
          email: profile.email || '',
        },
        theme: { color: '#f97316' },
        modal: {
            // This runs if the user closes the payment modal
            ondismiss: function() {
                setCheckingOut(false);
            }
        }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      alert(`Payment failed: ${err.message}`);
      setCheckingOut(false);
    }
  };


  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Header
        search={search}
        onSearchChange={setSearch}
        cartCount={cartArray.reduce((n, ci) => n + ci.qty, 0)}
        onViewCart={() => setCartOpen(true)}
      />


      {loading && <p>Loading menu...</p>}
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}


      {!loading && (
        <>
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
          // --- CHANGE 3: Pass the new state down to the cart modal ---
          isCheckingOut={isCheckingOut}
        />
      )}
    </div>
  );
}



// --- YOUR STYLED CHILD COMPONENTS ARE PRESERVED EXACTLY AS YOU PROVIDED THEM ---


function Header({ search, onSearchChange, cartCount, onViewCart }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
      <h2 style={{ margin: 0, marginRight: 'auto' }}>GrabNGo Menu</h2>
      <input
        placeholder="Search for food..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ padding: 10, width: 360, maxWidth: '45vw', borderRadius: 10, border: '1px solid #e2e8f0' }}
      />
      <button onClick={onViewCart} style={viewCartButtonStyle}>
        🛒 Cart ({cartCount})
      </button>
    </div>
  );
}


function MenuGrid({ items, onAddToCart, cart, onRemoveFromCart }) {
    if (items.length === 0) {
      return <p style={{ color: '#64748b' }}>No items found. Try a different search or category.</p>;
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {items.map((item) => {
          const cartItem = cart[item.id];
          const quantityInCart = cartItem?.qty || 0;
          return (
            <div key={item.id} style={{ border: '1px solid #eef2f7', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ height: 180, background: '#f1f5f9' }}>
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.name}</div>
                <div style={{ color: '#64748b', fontSize: 14, height: 40, overflow: 'hidden', marginTop: 4 }}>
                  {item.description || 'A delicious and freshly prepared item.'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatPrice(item.price)}</div>
                  <div style={{ marginLeft: 'auto' }}>
                    {quantityInCart > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => onRemoveFromCart(item)} style={quantityButtonStyle}>−</button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{quantityInCart}</span>
                        <button onClick={() => onAddToCart(item)} style={quantityButtonStyle}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => onAddToCart(item)} style={addToCartButtonStyle}>Add to Cart</button>
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
    <div style={{ display: 'flex', gap: 10, marginBottom: 18, overflowX: 'auto', paddingBottom: 10 }}>
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
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </button>
  );
}


const viewCartButtonStyle = {
  padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600
};


const addToCartButtonStyle = {
  padding: '10px 16px', borderRadius: 10, border: '1px solid #f97316', background: '#fff', color: '#f97316', cursor: 'pointer', fontWeight: 600
};


const quantityButtonStyle = {
  width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '1.2rem'
};
