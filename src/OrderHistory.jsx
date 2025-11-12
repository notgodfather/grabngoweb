import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { formatPrice } from './types';

export default function OrderHistory() {
  const profile = JSON.parse(localStorage.getItem('profile') || 'null');
  const userId = profile?.sub || '';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState('');

  // There are two identical useEffects here. We'll keep one.
  useEffect(() => {
    const fetchUserOrders = async () => {
      // Set loading to true on each fetch to show refresh
      setLoading(true); 
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, food_items(name, image_url))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        setErr(error.message);
        console.error("Error fetching user orders:", error);
      } else {
        // --- THIS IS THE KEY DIAGNOSTIC LOG ---
        console.log('Fetched orders data from Supabase:', JSON.stringify(data, null, 2));
        // -----------------------------------------
        setOrders(data || []);
      }
      setLoading(false);
    };

    if (userId) {
      fetchUserOrders(); // Fetch immediately on load

      const interval = setInterval(() => {
        console.log('--- Refreshing orders (every 10s) ---');
        fetchUserOrders();
      }, 10000);

      // Cleanup interval on component unmount
      return () => {
        clearInterval(interval);
      };
    } else {
      // If no user ID, don't try to fetch
      setLoading(false);
    }
  }, [userId]);

  if (loading && orders.length === 0) return <div style={{ padding: 24 }}>Loading your orders...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2>Your Order History</h2>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
          {orders.map((o) => {
            // Check if o.order_items is a valid array before trying to reduce it
            const total = Array.isArray(o.order_items) 
              ? o.order_items.reduce((sum, r) => sum + Number(r.price) * r.qty, 0)
              : 0;
              
            return (
              <div key={o.id} style={{ border: '1px solid #eef2f7', borderRadius: 12, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>Order #{o.id.slice(-8)}</div>
                  <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: 14 }}>
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                  <span style={userStatusPillStyle(o.status)}>{o.status}</span>
                </div>
                
                <div style={{ marginTop: 12, display: 'grid', gap: 8, borderTop: '1px solid #eef2f7', paddingTop: 12 }}>
                  {/* Also check if order_items is an array before mapping */}
                  {Array.isArray(o.order_items) && o.order_items.map((r) => (
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
