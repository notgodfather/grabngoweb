import React from 'react';
import { formatPrice } from './types';

export default function CartModal({ cart, onClose, onUpdateQuantity, onCheckout, isCheckingOut }) {
  const cartArray = Object.values(cart);
  const total = cartArray.reduce((sum, ci) => sum + Number(ci.item.price) * ci.qty, 0);

  return (
    // Modal backdrop (your styles are preserved)
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      {/* Modal content (your styles are preserved) */}
      <div
        style={{
          background: '#fff', borderRadius: 14, padding: 24,
          width: '100%', maxWidth: 500,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Your Cart</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        {cartArray.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
            {cartArray.map(({ item, qty }) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
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
                <div style={{ fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                  {formatPrice(item.price * qty)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>Total: {formatPrice(total)}</div>
          
          {/* --- THIS BUTTON IS THE ONLY PART WITH LOGIC CHANGES --- */}
          <button
            // Button is now disabled if cart is empty OR if checking out
            disabled={cartArray.length === 0 || isCheckingOut}
            onClick={onCheckout}
            // Style is updated to show a disabled state (opacity)
            style={{ 
                ...placeOrderButtonStyle, 
                marginLeft: 'auto',
                opacity: isCheckingOut ? 0.6 : 1,
            }}
          >
            {/* Text changes based on the 'isCheckingOut' state */}
            {isCheckingOut ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Your styles are preserved
const quantityButtonStyle = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '1.2rem'
};

const placeOrderButtonStyle = {
  background: '#f97316', color: '#fff', border: 0, padding: '12px 20px',
  borderRadius: 12, fontWeight: 600, cursor: 'pointer'
};
