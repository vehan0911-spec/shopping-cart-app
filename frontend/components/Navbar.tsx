'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import CartIcon from './CartIcon';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="-rotate-1 inline-flex items-center">
          <span className="rounded border-2 border-ink px-2.5 py-1 font-display text-sm uppercase tracking-widest">
            Market
          </span>
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <Link
            href="/"
            className="font-display text-xs uppercase tracking-wide transition-colors hover:text-veg"
          >
            Shop
          </Link>

          {user && (
            <>
              <Link
                href="/orders"
                className="font-display text-xs uppercase tracking-wide transition-colors hover:text-fruit"
              >
                My Orders
              </Link>
              <Link
                href="/checkout"
                className="font-display text-xs uppercase tracking-wide transition-colors hover:text-cake"
              >
                Checkout
              </Link>
            </>
          )}

          <Link href="/cart" aria-label="View cart">
            <CartIcon />
          </Link>

          {user ? (
            <div className="flex items-center gap-3 border-l border-line pl-3">
              <span className="hidden text-ink/70 sm:inline">Hi, {user.name}</span>
              <button
                onClick={logout}
                className="rounded-full border-2 border-fruit px-3 py-1.5 font-display text-xs uppercase tracking-wide text-fruit transition-colors hover:bg-fruit hover:text-white"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l border-line pl-3">
              <Link
                href="/login"
                className="rounded-full border-2 border-ink px-3 py-1.5 font-display text-xs uppercase tracking-wide transition-colors hover:bg-ink hover:text-paper"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-accent px-3 py-1.5 font-display text-xs uppercase tracking-wide text-accent-ink transition hover:brightness-95"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}