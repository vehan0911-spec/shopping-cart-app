'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

interface Order {
  _id: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }>;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!orderId) {
      router.push('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        setError('Failed to fetch order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading order details...</div>;
  }

  if (error) {
    return <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>{error}</div>;
  }

  if (!order) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Order not found</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span style={{ fontSize: '4rem' }}>🎉</span>
        <h1>Order Confirmed!</h1>
        <p style={{ color: '#28a745', fontSize: '1.1rem' }}>
          Thank you for your purchase. Your order has been placed successfully.
        </p>
        <p>
          Order ID: <strong>#{order._id.slice(-8).toUpperCase()}</strong>
        </p>
      </div>

      {/* Order Summary */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2>Order Summary</h2>
        <div style={{ marginTop: '1rem' }}>
          {order.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #ddd' }}>
              <span>{item.name} × {item.quantity}</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1rem' }}>
          <span>Total</span>
          <span>${order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Shipping Address */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Shipping Address</h2>
        <p>{order.shippingAddress.fullName}</p>
        <p>{order.shippingAddress.address}</p>
        <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
        <p>{order.shippingAddress.country}</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link
          href="/orders"
          style={{
            padding: '0.5rem 1.5rem',
            background: '#0070f3',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          View All Orders
        </Link>
        <Link
          href="/"
          style={{
            padding: '0.5rem 1.5rem',
            background: '#6c757d',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
