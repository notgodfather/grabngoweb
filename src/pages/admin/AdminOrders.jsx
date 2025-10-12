import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../types';

const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready for Pickup', 'Completed'];

// Helper: Get today's date string in YYYY-MM-DD
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// Dashboard Stat Card component
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      padding: 24, minWidth: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, border: `2px solid ${color || '#eef2f7'}`
    }}>
      <div style={{ fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      {icon && <div>{icon}</div>}
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard stats
  const [stats, setStats] = useState({
    totalRevenueToday: 0,
    ordersCountToday: 0,
    avgOrderAmount: 0,
    pendingOrders: 0,
  });

  // Fetch admin orders
  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, food_items(name))')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Fetch Daily Revenue (history table)

  // Fetch Today's Performance Stats
  useEffect(() => {
    const fetchStats = async () => {
      // Get orders placed today
      const { data: ordersToday, error: ordersTodayErr } = await supabase
        .from('orders')
        .select('id, status, order_items(price, qty)')
        .gte('created_at', todayStr() + 'T00:00:00')
        .lte('created_at', todayStr() + 'T23:59:59');

      if (ordersTodayErr) {
        // Handle error
        setStats(s => ({ ...s, error: ordersTodayErr.message }));
        return;
      }

      // Calculate total revenue today and count
      let totalRevenue = 0, avgOrder = 0, pending = 0, count = ordersToday.length || 0;
      if (ordersToday && ordersToday.length > 0) {
        for (const order of ordersToday) {
          const items = order.order_items || [];
          totalRevenue += items.reduce((sum, item) => sum + (item.price * item.qty), 0);
          if (order.status === 'Pending') pending += 1;
        }
        avgOrder = count > 0 ? totalRevenue / count : 0;
      }
      setStats({
        totalRevenueToday: totalRevenue,
        ordersCountToday: count,
        avgOrderAmount: avgOrder,
        pendingOrders: pending,
      });
    };
    fetchStats();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setOrders(currentOrders =>
      currentOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert(`Error updating status: ${error.message}`);
      fetchOrders();
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading all orders...</div>;
  if (error) return <div style={{ padding: 24, color: '#b91c1c' }}>Error: {error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 24 }}>Admin - Order Management</h1>

      {/* Performance Dashboard Cards */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 36 }}>
        <StatCard
          label="Total Revenue Today"
          value={formatPrice(stats.totalRevenueToday)}
          icon={<span style={{ fontSize: 20, background: "#dcfce7", padding:10, borderRadius:10 }}>💵</span>}
          color="#22c55e"
        />
        <StatCard
          label="Orders Count"
          value={stats.ordersCountToday}
          icon={<span style={{ fontSize: 20, background: "#e0edfd", padding:10, borderRadius:10 }}>🛒</span>}
          color="#3b82f6"
        />
        <StatCard
          label="Average Order Amount"
          value={formatPrice(stats.avgOrderAmount)}
          icon={<span style={{ fontSize: 20, background: "#e0edfd", padding:10, borderRadius:10 }}>📈</span>}
          color="#0ea5e9"
        />
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders}
          icon={<span style={{ fontSize: 20, background: "#fff7ed", padding:10, borderRadius:10 }}>⏳</span>}
          color="#fbbf24"
        />
      </div>

      {/* Orders List */}
      <div style={{ display: 'grid', gap: 20 }}>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orders.map(order => (
            <div key={order.id} style={orderCardStyle}>
              <div style={orderHeaderStyle}>
                <div>
                  <span style={{ fontWeight: 700 }}>Order ID:</span>
                  <span style={{ fontFamily: 'monospace', marginLeft: 8 }}>{order.id.slice(-8)}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700 }}>User:</span>
                  <span style={{ marginLeft: 8 }}>{order.user_email}</span>
                </div>
                <div style={{ color: '#64748b', fontSize: 14 }}>
                  {new Date(order.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #eef2f7', borderBottom: '1px solid #eef2f7' }}>
                {(order.order_items || []).map(item => (
                  <div key={item.id} style={lineItemStyle}>
                    <span>{item.qty} x</span>
                    <span style={{ fontWeight: 600 }}>{item.food_items?.name || 'Item'}</span>
                    <span style={{ marginLeft: 'auto' }}>{formatPrice(item.price)}</span>
                  </div>
                ))}
              </div>
              <div style={orderFooterStyle}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  Total: {formatPrice((order.order_items || []).reduce((sum, i) => sum + i.price * i.qty, 0))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 600 }}>Status:</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    style={statusSelectStyle(order.status)}
                  >
                    {ORDER_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const orderCardStyle = {
  background: '#fff',
  border: '1px solid #eef2f7',
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
};

const orderHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  flexWrap: 'wrap',
  gap: 12,
};

const lineItemStyle = {
  display: 'flex',
  gap: 8,
  padding: '4px 0'
};

const orderFooterStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
};

const statusSelectStyle = (status) => ({
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #ccc',
  fontWeight: 600,
  backgroundColor: status === 'Ready for Pickup' ? '#dcfce7' : (status === 'Completed' ? '#f1f5f9' : '#fff'),
  color: status === 'Ready for Pickup' ? '#166534' : '#334155',
});
