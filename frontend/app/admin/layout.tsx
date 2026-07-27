'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { href: '/admin/orders', label: 'Orders', icon: '📋' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user?.role !== 'admin') { router.push('/'); }
  }, [isAuthenticated, user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: '1rem' }}>Verifying access…</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        .admin-nav-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1rem; border-radius: 8px; text-decoration: none; color: #94a3b8; font-size: 0.875rem; font-weight: 500; transition: all 0.15s ease; }
        .admin-nav-link:hover { background: rgba(255,255,255,0.07); color: #f1f5f9; }
        .admin-nav-link.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; box-shadow: 0 4px 15px rgba(99,102,241,0.4); }
        .admin-main { flex: 1; overflow-y: auto; background: #f8fafc; }
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: '240px',
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 1rem',
          position: 'fixed',
          height: '100vh',
          zIndex: 10,
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.025em' }}>
              ⚡ Admin Panel
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{user.name}</div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Back to shop */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
            <Link href="/" className="admin-nav-link" style={{ color: '#64748b' }}>
              <span>←</span>
              <span>Back to Shop</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="admin-main" style={{ marginLeft: '240px', padding: '2rem', minHeight: '100vh' }}>
          {children}
        </div>
      </div>
    </>
  );
}
