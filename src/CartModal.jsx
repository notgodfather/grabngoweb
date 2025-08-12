import React, { useEffect, useState } from 'react';
import { formatPrice } from './types';

export default function CartModal({ cart, onClose, onUpdateQuantity, onCheckout, isCheckingOut }) {
  const cartArray = Object.values(cart);
  const total = cartArray.reduce((sum, ci) => sum + Number(ci.item.price) * ci.qty, 0);

  // --- CHANGE 1: Add state to control the slide-in/out animation ---
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // When the component mounts, trigger the slide-in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10); // A tiny delay ensures the transition is applied
    return () => clearTimeout(timer);
  }, []);

  // --- CHANGE 2: Create a new close handler for the slide-out animation ---
  const handleClose = () => {
    setIsVisible(false);
    // Wait for the animation to finish before calling the parent's onClose
    setTimeout(onClose, 300); // This duration should match the transition time
  };

  // --- CHANGE 3: Apply new styles and animation state to the modal ---
  const dynamicContentStyle = {
    ...modalContentStyle,
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
  };

  return (
    // The backdrop now only darkens the background and handles the close action
    <div
      style={modalBackdropStyle}
      onClick={handleClose}
    >
      {/* The content is now a side drawer with its own styles and animation */}
      <div
        style={dynamicContentStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* The header of the cart drawer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Your Cart</h2>
          <button onClick={handleClose} style={closeButtonStyle}>&times;</button>
        </div>

        {/* The list of cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cartArray.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>Your cart is empty.</p>
          ) : (
            cartArray.map(({ item, qty }) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src={item.image_url} alt={item.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ color: '#64748b' }}>{formatPrice(item.price)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => onUpdateQuantity(item.id, -1)} style={quantityButtonStyle}>−</button>
                  <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{qty}</span>
                  <button onClick={() => onUpdateQuantity(item.id, 1)} style={quantityButtonStyle}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* The footer with the total and checkout button */}
        {cartArray.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Total</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatPrice(total)}</div>
            </div>
            <button
              disabled={isCheckingOut}
              onClick={onCheckout}
              style={{ ...placeOrderButtonStyle, opacity: isCheckingOut ? 0.6 : 1 }}
            >
              {isCheckingOut ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- CHANGE 4: Updated styles for the new side drawer design ---

const modalBackdropStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  transition: 'background-color 0.3s ease-in-out',
  zIndex: 1000
};

const modalContentStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  maxWidth: 420, // A good width for a side panel
  background: '#fff',
  boxShadow: '-5px 0 25px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease-in-out',
  display: 'flex',
  flexDirection: 'column', // Organize content vertically
};

const closeButtonStyle = {
  background: 'transparent', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#64748b', lineHeight: 1
};

const quantityButtonStyle = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '1.2rem'
};

const placeOrderButtonStyle = {
  background: '#f97316', color: '#fff', border: 0, padding: '14px 20px',
  borderRadius: 12, fontWeight: 600, cursor: 'pointer',
  width: '100%', // Make button full-width
  fontSize: '1rem'
};
