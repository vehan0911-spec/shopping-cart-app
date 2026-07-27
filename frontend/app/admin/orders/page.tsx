'use client';

import React from 'react';

import { useState, useEffect, useCallback } from 'react';

interface Order {
  _id: string;
  userId: { name: string; email: string } | null;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  shippingAddress: { fullName: string; city: string; country: string };
  createdAt: string;
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'completed', 'failed'];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef9c3', color: '#854d0e' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped: { bg: '#e0f2fe', color: '#0369a1' },
  delivered: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  completed: { bg: '#dcfce7', color: '#166534' },
  failed: { bg: '#fee2e2', color: '#991b1b' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const token = () => localStorage.getItem('authToken');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/orders', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setOrders(await res.json());
      else setError('Failed to load orders');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 4000); }
  };

  const updateStatus = async (id: string, field: 'orderStatus' | 'paymentStatus', value: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        flash('Status updated!', 'success');
        setOrders(prev => prev.map(o => o._id === id ? { ...o, [field]: value } : o));
      } else flash('Update failed', 'error');
    } catch { flash('Network error', 'error'); }
    finally { setUpdatingId(null); }
  };

  const filtered = orders.filter(o =>
    (!filterStatus || o.orderStatus === filterStatus) &&
    (!search || o._id.includes(search) || (o.userId?.email || '').includes(search) || (o.userId?.name || '').toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = orders.filter(o => o.paymentStatus === 'completed').reduce((s, o) => s + o.totalAmount, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .form-input { padding: 0.625rem 0.875rem; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; color: #1e293b; outline: none; transition: border 0.15s; background: white; }
        .form-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.7rem; font-weight: 600; }
        .order-row { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; cursor: pointer; }
        .order-row:hover { background: #fafafe; }
        .toast { position: fixed; bottom: 1.5rem; right: 1.5rem; padding: 0.75rem 1.25rem; border-radius: 10px; font-size: 0.875rem; font-weight: 500; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.15); animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform: translateY(0) } }
        .status-select { border: 1.5px solid #e2e8f0; border-radius: 6px; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 500; outline: none; background: white; cursor: pointer; }
        .status-select:focus { border-color: #6366f1; }
      `}</style>

      {success && <div className="toast" style={{ background: '#dcfce7', color: '#16a34a' }}>✓ {success}</div>}
      {error && <div className="toast" style={{ background: '#fee2e2', color: '#dc2626' }}>✕ {error}</div>}

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em' }}>Orders</h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          {orders.length} total orders · <span style={{ color: '#16a34a', fontWeight: '600' }}>${totalRevenue.toFixed(2)} revenue</span>
        </p>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {ORDER_STATUSES.map(s => {
          const count = orders.filter(o => o.orderStatus === s).length;
          const col = STATUS_COLORS[s];
          return (
            <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
              style={{ border: `2px solid ${filterStatus === s ? col.color : 'transparent'}`, background: col.bg, color: col.color, padding: '0.375rem 0.875rem', borderRadius: '99px', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem', transition: 'all 0.15s' }}>
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input className="form-input" type="text" placeholder="Search by order ID, name, or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '320px' }} />
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '180px' }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading orders…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No orders found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                {['Order ID', 'Customer', 'Items', 'Total', 'Order Status', 'Payment', 'Date'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <React.Fragment key={order._id}>
                  <tr className="order-row" onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}>
                    <td style={{ padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#6366f1', fontWeight: '600' }}>
                      #{order._id.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#0f172a' }}>{order.userId?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{order.userId?.email || ''}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: '700', color: '#0f172a', fontSize: '0.9rem' }}>${order.totalAmount.toFixed(2)}</td>
                    <td style={{ padding: '0.875rem 1rem' }} onClick={e => e.stopPropagation()}>
                      <select className="status-select" value={order.orderStatus} disabled={updatingId === order._id}
                        onChange={e => updateStatus(order._id, 'orderStatus', e.target.value)}
                        style={{ background: STATUS_COLORS[order.orderStatus]?.bg, color: STATUS_COLORS[order.orderStatus]?.color }}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }} onClick={e => e.stopPropagation()}>
                      <select className="status-select" value={order.paymentStatus} disabled={updatingId === order._id}
                        onChange={e => updateStatus(order._id, 'paymentStatus', e.target.value)}
                        style={{ background: STATUS_COLORS[order.paymentStatus]?.bg, color: STATUS_COLORS[order.paymentStatus]?.color }}>
                        {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                  {/* Expanded row */}
                  {expandedId === order._id && (
                    <tr>
                      <td colSpan={7} style={{ padding: '0 1rem 1rem', background: '#fafafe' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.75rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Items</div>
                            {order.items.map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                <span>{item.name} × {item.quantity}</span>
                                <span style={{ fontWeight: '500' }}>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Shipping Address</div>
                            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
                              {order.shippingAddress?.fullName}<br />
                              {order.shippingAddress?.city}, {order.shippingAddress?.country}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
