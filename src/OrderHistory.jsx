import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { formatPrice } from './types';

export default function OrderHistory() {
  const profile = JSON.parse(localStorage.getItem('profile') || 'null'); // user persisted locally [web:65]
  const userId = profile?.sub || ''; // safe default [web:65]
  const [orders, setOrders] = useState([]); // orders list [web:65]
  const [loading, setLoading] = useState(true); // loading state [web:65]
  const [error, setErr] = useState(''); // error message [web:65]

  const fetchUserOrders = async () => {
    // Disambiguate embeds with !fk_name hints:
    // - order_items!order_items_order_id_fkey => order_items.order_id -> orders.id
    // - food_items!order_items_item_id_fkey  => order_items.item_id  -> food_items.id
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items!order_items_order_id_fkey(
          *,
          food_items!order_items_item_id_fkey(name, image_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }); // newest first [web:65]

    if (error) {
      setErr(error.message); // show error [web:65]
      console.error('Error fetching user orders', error); // log for debugging [web:65]
    } else {
      setOrders(data || []); // update list [web:65]
    }
    setLoading(false); // stop spinner [web:65]
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false); // no user, stop [web:65]
      return; // early exit [web:65]
    }

    fetchUserOrders(); // initial load [web:65]

    const interval = setInterval(() => {
      fetchUserOrders(); // periodic refresh [web:65]
    }, 10000);

    return () => clearInterval(interval); // cleanup [web:65]
  }, [userId]);

  if (loading) return <div style={{ padding: 24 }}>Loading your orders...</div>; // simple loading UI [web:65]
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>{error}</div>; // error UI [web:65]

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2>Your Order History</h2>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p> // empty state [web:65]
      ) : (
        <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
          {orders.map((o) => {
            const total = (o.order_items || []).reduce((sum, r) => sum + Number(r.price) * r.qty, 0); // compute total [web:65]
            return (
              <div key={o.id} style={{ border: '1px solid #eef2f7', borderRadius: 12, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>Order #{String(o.id).slice(-8)}</div> {/* show last 8 chars */} {/* [web:65] */}
                  <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: 14 }}>
                    {new Date(o.created_at).toLocaleString()} {/* localized timestamp */} {/* [web:65] */}
                  </div>
                  <span style={userStatusPillStyle(o.status)}>{o.status}</span> {/* status pill */} {/* [web:65] */}
                </div>
                <div style={{ marginTop: 12, display: 'grid', gap: 8, borderTop: '1px solid #eef2f7', paddingTop: 12 }}>
                  {(o.order_items || []).map((r) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {r.food_items?.image_url ? (
                        <img src={r.food_items.image_url} alt="" width={44} height={44} style={{ borderRadius: 8, objectFit: 'cover' }} /> // item image [web:65]
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9' }} /> // placeholder [web:65]
                      )}
                      <div style={{ fontWeight: 600, flex: 1 }}>{r.food_items?.name || 'Item'}</div> {/* item name */} {/* [web:65] */}
                      <div style={{ color: '#64748b' }}>x{r.qty}</div> {/* quantity */} {/* [web:65] */}
                      <div style={{ width: 90, textAlign: 'right', fontWeight: 600 }}>
                        {formatPrice(Number(r.price) * r.qty)} {/* line total */} {/* [web:65] */}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, textAlign: 'right', fontWeight: 700, borderTop: '1px solid #eef2f7', paddingTop: 10, fontSize: '1.1rem' }}>
                  Total: {formatPrice(total)} {/* order total */} {/* [web:65] */}
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
}); // simple color coding [web:65]
