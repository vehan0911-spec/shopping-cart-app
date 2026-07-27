'use client';

import { useCart } from '../../context/CartContext';
import Link from 'next/link';

export default function CartPage() {
  // Use `loading` for initial fetch, `mutating` for per-action operations
  const { cart, loading, mutating, updateQuantity, removeFromCart, clearCart, error } = useCart();

  // Show full-page loader ONLY on initial cart fetch (not on quantity updates)
  if (loading && !cart) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <p className="font-mono text-sm text-ink/50">Weighing your basket…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <p className="mb-1 font-display text-lg text-fruit">Couldn&apos;t load your basket</p>
        <p className="font-mono text-sm text-ink/50">{error}</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="mb-2 font-display text-2xl uppercase tracking-tight">Your basket is empty</h2>
        <p className="mb-5 text-sm text-ink/60">Pick something fresh and it&apos;ll show up here.</p>
        <Link
          href="/"
          className="inline-block rounded-full bg-accent px-5 py-2 font-display text-xs uppercase tracking-wide text-accent-ink transition hover:brightness-95"
        >
          Browse the stall
        </Link>
      </div>
    );
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(productId, newQuantity);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl uppercase tracking-tight">Your Basket</h1>
        <Link
          href="/"
          className="font-display text-xs uppercase tracking-wide text-ink/60 transition-colors hover:text-veg"
        >
          ← Continue shopping
        </Link>
      </div>

      {/* Inline mutation indicator — no full-page flicker */}
      {mutating && <p className="mb-3 font-mono text-xs text-ink/50">Updating basket…</p>}

      <div className="divide-y divide-line rounded-2xl border border-line bg-paper-raised">
        {cart.items.map((item) => (
          <div
            key={item.productId._id}
            className="flex flex-wrap items-center gap-4 p-4 transition-opacity duration-200 sm:flex-nowrap"
            style={{ opacity: mutating ? 0.6 : 1 }}
          >
            <img
              src={item.productId.imageUrl}
              alt={item.productId.name}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
              onError={(e) => {
                // Prevent infinite retry loop
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://picsum.photos/seed/${item.productId._id}/80/80`;
              }}
            />

            <div className="min-w-[140px] flex-1">
              <h3 className="truncate font-display text-base">{item.productId.name}</h3>
              <p className="font-mono text-xs text-ink/50">${item.price.toFixed(2)} each</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.productId._id, item.quantity - 1)}
                disabled={mutating}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-line font-mono text-sm transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                −
              </button>
              <span className="w-6 text-center font-mono text-sm">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.productId._id, item.quantity + 1)}
                disabled={mutating}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-line font-mono text-sm transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>

            <span className="price-tag min-w-[80px] justify-center">
              ${(item.price * item.quantity).toFixed(2)}
            </span>

            <button
              onClick={() => removeFromCart(item.productId._id)}
              disabled={mutating}
              className="rounded-full border-2 border-fruit px-3 py-1.5 font-display text-xs uppercase tracking-wide text-fruit transition-colors hover:bg-fruit hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-end gap-4">
        <div className="text-right">
          <p className="font-mono text-xs uppercase tracking-wide text-ink/50">Total</p>
          <p className="font-display text-2xl">${cart.totalPrice.toFixed(2)}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => clearCart()}
            disabled={mutating}
            className="rounded-full border-2 border-ink px-4 py-2 font-display text-xs uppercase tracking-wide transition-colors hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear basket
          </button>
          <Link
            href="/checkout"
            className="rounded-full bg-accent px-5 py-2 font-display text-xs uppercase tracking-wide text-accent-ink transition hover:brightness-95"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}