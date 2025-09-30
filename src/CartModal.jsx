import React, { useEffect, useState } from 'react';
import { formatPrice } from './types';

export default function CartModal({ cart, onClose, onUpdateQuantity, onCheckout, isCheckingOut }) {
  const cartArray = Object.values(cart);
  const total = cartArray.reduce((sum, ci) => sum + Number(ci.item.price) * ci.qty, 0);

  // Calculate 5% service charge
  const serviceCharge = total * 0.05;

  // Final amount including service charge
  const totalWithService = total + serviceCharge;

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); 
  };

  const dynamicContentStyle = {
    ...modalContentStyle,
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
  };

  return (
    <div
      style={modalBackdropStyle}
      onClick={handleClose}
    >
      <div
        style={dynamicContentStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Your Cart</h2>
          <button onClick={handleClose} style={closeButtonStyle}>&times;</button>
        </div>
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
        {cartArray.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Subtotal</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatPrice(total)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Service Charge (5%)</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatPrice(serviceCharge)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Total</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatPrice(totalWithService)}</div>
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
  maxWidth: 420,
  background: '#fff',
  boxShadow: '-5px 0 25px rgba(0,0,0,0.1)',
  transition: 'transform 0.3s ease-in-out',
  display: 'flex',
  flexDirection: 'column',
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
  width: '100%',
  fontSize: '1rem'
};
