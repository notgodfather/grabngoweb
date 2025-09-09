import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { formatPrice } from './types';

export default function OrderHistory() {
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');
  const userId = profile?.sub || '';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState('');

  const fetchUserOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, food_items(name, image_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setErr(error.message);
      console.error("Error fetching user orders", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };
useEffect(() => {
  const fetchUserOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, food_items(name, image_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setErr(error.message);
      console.error("Error fetching user orders", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  if (userId) {
    // 1. Fetch initial data.
    fetchUserOrders();

    // 2. Set up the polling interval.
    const interval = setInterval(() => {
      fetchUserOrders();
    }, 10000);

    // 3. Cleanup the interval.
    return () => {
      clearInterval(interval);
    };
  }
}, [userId]);


  if (loading) return <div style={{ padding: 24 }}>Loading your orders...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2>Your Order History</h2>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
          {orders.map((o) => {
            const total = o.order_items.reduce((sum, r) => sum + Number(r.price) * r.qty, 0);
            return (
              <div key={o.id} style={{ border: '1px solid #eef2f7', borderRadius: 12, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>Order #{o.id.slice(-8)}</div>
                  <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: 14 }}>
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                  {/* --- NEW: Display the real-time status --- */}
                  <span style={userStatusPillStyle(o.status)}>{o.status}</span>
                </div>
                <div style={{ marginTop: 12, display: 'grid', gap: 8, borderTop: '1px solid #eef2f7', paddingTop: 12 }}>
                  {o.order_items.map((r) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {r.food_items?.image_url ? (
                        <img src={r.food_items.image_url} alt="" width={44} height={44} style={{ borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9' }} />
                      )}
                      <div style={{ fontWeight: 600, flex: 1 }}>{r.food_items?.name || 'Item'}</div>
                      <div style={{ color: '#64748b' }}>x{r.qty}</div>
                      <div style={{ width: 90, textAlign: 'right', fontWeight: 600 }}>{formatPrice(Number(r.price) * r.qty)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, textAlign: 'right', fontWeight: 700, borderTop: '1px solid #eef2f7', paddingTop: 10, fontSize: '1.1rem' }}>
                  Total: {formatPrice(total)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
const userStatusPillStyle = (status) => ({
    padding: '4px 10px',
    borderRadius: 999,
    fontWeight: 600,
    fontSize: 12,
    backgroundColor: status === 'Ready for Pickup' ? '#22c55e' : (status === 'Preparing' ? '#f59e0b' : '#d1d5db'),
    color: status === 'Ready for Pickup' ? '#fff' : '#1f2937',
});
