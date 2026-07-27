'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

const inputClass =
  'w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink transition-colors focus:border-ink focus:outline-none';
const labelClass = 'mb-1 block font-mono text-xs uppercase tracking-wide text-ink/50';

// ─── Step 1: Address Form (no Stripe context needed) ─────────────────────────
function AddressForm({
  onComplete,
}: {
  onComplete: (clientSecret: string, orderId: string, address: ShippingAddress) => void;
}) {
  const { cart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.name || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  if (cart && cart.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="mb-2 font-display text-xl uppercase tracking-tight">Your basket is empty</h2>
        <a href="/" className="font-display text-xs uppercase tracking-wide text-veg hover:underline">
          Continue shopping
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create order
      const orderRes = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ shippingAddress }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setError(orderData.error || 'Failed to create order');
        return;
      }

      // Create Stripe payment intent
      const paymentRes = await fetch('http://localhost:5000/api/orders/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ orderId: orderData._id }),
      });
      const paymentData = await paymentRes.json();

      if (!paymentRes.ok) {
        setError(paymentData.error || 'Failed to initialize payment');
        return;
      }

      onComplete(paymentData.clientSecret, orderData._id, shippingAddress);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
      {/* Shipping Address */}
      <div className="mb-6 rounded-2xl border border-line bg-paper-raised p-5">
        <h3 className="mb-4 font-display text-sm uppercase tracking-wide text-ink/70">
          Shipping address
        </h3>
        <div className="mb-3">
          <label className={labelClass}>Full name</label>
          <input
            type="text"
            value={shippingAddress.fullName}
            onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
            required
            className={inputClass}
          />
        </div>
        <div className="mb-3">
          <label className={labelClass}>Address</label>
          <input
            type="text"
            value={shippingAddress.address}
            onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
            required
            className={inputClass}
          />
        </div>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              value={shippingAddress.city}
              onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Postal code</label>
            <input
              type="text"
              value={shippingAddress.postalCode}
              onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
              required
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input
            type="text"
            value={shippingAddress.country}
            onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
            required
            className={inputClass}
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-line bg-paper-raised p-5">
        <div>
          <h3 className="font-display text-sm uppercase tracking-wide text-ink/70">Order summary</h3>
          <p className="mt-1 font-mono text-xs text-ink/50">
            {cart?.totalItems} item{cart?.totalItems === 1 ? '' : 's'}
          </p>
        </div>
        <span className="price-tag text-base">${cart?.totalPrice.toFixed(2)}</span>
      </div>

      {error && <p className="mb-4 font-mono text-sm text-fruit">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent py-3 font-display text-sm uppercase tracking-wide text-accent-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Setting up payment…' : 'Continue to payment →'}
      </button>
    </form>
  );
}

// ─── Step 2: Payment Form (must be inside <Elements> with clientSecret) ───────
function PaymentForm({
  orderId,
  shippingAddress,
  onBack,
}: {
  orderId: string;
  shippingAddress: ShippingAddress;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { cart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation?orderId=${orderId}`,
      },
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
      {/* Shipping summary with Edit button */}
      <div className="mb-5 rounded-2xl border border-line bg-paper-raised p-4 text-sm">
        <span className="font-mono text-xs uppercase tracking-wide text-ink/50">Shipping to </span>
        <span className="text-ink/80">
          {shippingAddress.fullName}, {shippingAddress.address}, {shippingAddress.city},{' '}
          {shippingAddress.postalCode}, {shippingAddress.country}
        </span>
        <button
          type="button"
          onClick={onBack}
          className="ml-2 font-display text-xs uppercase tracking-wide text-veg underline-offset-2 hover:underline"
        >
          Edit
        </button>
      </div>

      {/* Stripe PaymentElement */}
      <div className="mb-5 rounded-2xl border border-line bg-paper-raised p-4">
        <PaymentElement />
      </div>

      {error && <p className="mb-4 font-mono text-sm text-fruit">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-lg bg-accent py-3 font-display text-sm uppercase tracking-wide text-accent-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Processing…' : `Pay $${cart?.totalPrice.toFixed(2)}`}
      </button>
    </form>
  );
}

// ─── Main Checkout Page ────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Lifted state — clientSecret lives here so <Elements> can receive it
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <p className="font-mono text-sm text-ink/50">Loading…</p>
      </div>
    );
  }

  const handleAddressComplete = (
    secret: string,
    id: string,
    address: ShippingAddress
  ) => {
    setClientSecret(secret);
    setOrderId(id);
    setShippingAddress(address);
  };

  const handleBack = () => {
    setClientSecret('');
    setOrderId('');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-center font-display text-3xl uppercase tracking-tight">Checkout</h1>

      {/* Step 1: No Stripe context needed */}
      {!clientSecret && <AddressForm onComplete={handleAddressComplete} />}

      {/* Step 2: <Elements> is only mounted AFTER we have a clientSecret */}
      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#E8A93A',
                colorBackground: '#F7FAF4',
                colorText: '#1B2A20',
                borderRadius: '8px',
              },
            },
          }}
        >
          <PaymentForm
            orderId={orderId}
            shippingAddress={shippingAddress}
            onBack={handleBack}
          />
        </Elements>
      )}
    </div>
  );
}