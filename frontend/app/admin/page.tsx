'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}

const STAT_CARDS = [
  { key: 'totalProducts', label: 'Total Products', icon: '📦', color: '#6366f1', bg: '#eef2ff', href: '/admin/products' },
  { key: 'totalOrders',   label: 'Total Orders',   icon: '📋', color: '#0ea5e9', bg: '#f0f9ff', href: '/admin/orders' },
  { key: 'totalUsers',    label: 'Total Users',    icon: '👥', color: '#10b981', bg: '#ecfdf5', href: '#' },
  { key: 'totalRevenue',  label: 'Revenue',        icon: '💰', color: '#f59e0b', bg: '#fffbeb', href: '#', isMoney: true },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalOrders: 0, totalUsers: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        });
        if (res.ok) setStats(await res.json());
      } catch (e) {
        console.error('Failed to load stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .stat-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.07); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; text-decoration: none; display: block; border: 1px solid #f1f5f9; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .quick-link { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: white; border-radius: 12px; text-decoration: none; color: #1e293b; border: 1px solid #e2e8f0; transition: all 0.15s; font-weight: 500; font-size: 0.9rem; }
        .quick-link:hover { border-color: #6366f1; background: #fafafe; box-shadow: 0 2px 8px rgba(99,102,241,0.1); }
        .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.025em' }}>
          Dashboard
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Welcome back, <strong>{user?.name}</strong>! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {STAT_CARDS.map(card => (
          <Link key={card.key} href={card.href} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {card.label}
                </p>
                {loading ? (
                  <div className="skeleton" style={{ width: '80px', height: '36px', marginTop: '0.5rem' }} />
                ) : (
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#0f172a', marginTop: '0.25rem', lineHeight: 1 }}>
                    {(card as any).isMoney
                      ? `$${stats[card.key as keyof Stats].toFixed(0)}`
                      : stats[card.key as keyof Stats]}
                  </p>
                )}
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { href: '/admin/products', icon: '➕', label: 'Add Product' },
            { href: '/admin/categories', icon: '🏷️', label: 'Add Category' },
            { href: '/admin/orders', icon: '📋', label: 'View Orders' },
            { href: '/', icon: '🛍️', label: 'View Shop' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="quick-link">
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
