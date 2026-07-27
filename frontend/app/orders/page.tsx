'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Order {
  _id: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export default function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/orders`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          // Deduplicate by _id in case the API returns duplicate orders
          const seen = new Map();
          const unique = data.filter((order: Order) => {
            if (seen.has(order._id)) return false;
            seen.set(order._id, true);
            return true;
          });
          setOrders(unique);
        } else {
          setError('Failed to fetch orders');
        }
      } catch (err) {
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading orders...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No orders yet</h2>
        <p style={{ color: '#666' }}>You haven't placed any orders yet.</p>
        <Link href="/" style={{ color: '#0070f3' }}>Start shopping</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>My Orders</h1>
      <div style={{ marginTop: '2rem' }}>
        {orders.map((order) => (
          <div key={order._id} style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Order #{order._id.slice(-8).toUpperCase()}</strong>
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.25rem 0' }}>
                  {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 'bold' }}>${order.totalAmount.toFixed(2)}</span>
                <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                  <span
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: order.orderStatus === 'delivered' ? '#28a745' : '#ffc107',
                      color: 'white',
                    }}
                  >
                    {order.orderStatus}
                  </span>
                </p>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              {order.items.map((item, index) => (
                <span key={`${item.name}-${index}`}>
                  {item.name} × {item.quantity}
                  {index < order.items.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
            <Link
              href={`/order-confirmation?orderId=${order._id}`}
              style={{ display: 'inline-block', marginTop: '0.5rem', color: '#0070f3', fontSize: '0.9rem' }}
            >
              View Details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
