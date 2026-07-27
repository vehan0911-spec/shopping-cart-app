'use client';

import { useCart } from '../context/CartContext';

export default function CartIcon() {
  const { cart } = useCart();
  const itemCount = cart?.totalItems || 0;

  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink/80 transition-colors hover:border-ink">
      <span className="text-lg" aria-hidden>
        🧺
      </span>
      {itemCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] rotate-3 items-center justify-center rounded-full bg-accent px-1 font-mono text-[11px] font-semibold text-accent-ink shadow-sm">
          {itemCount}
        </span>
      )}
    </span>
  );
}