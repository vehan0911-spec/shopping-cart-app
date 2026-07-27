'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-center font-display text-2xl uppercase tracking-tight">Welcome back</h1>

      <div className="rounded-2xl border border-line bg-paper-raised p-6">
        {error && <p className="mb-4 font-mono text-sm text-fruit">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block font-mono text-xs uppercase tracking-wide text-ink/50">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink transition-colors focus:border-ink focus:outline-none"
            />
          </div>
          <div className="mb-5">
            <label className="mb-1 block font-mono text-xs uppercase tracking-wide text-ink/50">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink transition-colors focus:border-ink focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent py-2.5 font-display text-sm uppercase tracking-wide text-accent-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink/60">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-veg hover:underline">
            Register
          </Link>
        </p>

        <div className="mt-5 border-t border-line pt-5 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-wide text-ink/40">Or continue with</p>
          <a
            href="http://localhost:5000/api/auth/google"
            className="inline-block rounded-full border-2 border-ink px-5 py-2 font-display text-xs uppercase tracking-wide transition-colors hover:bg-ink hover:text-paper"
          >
            Sign in with Google
          </a>
        </div>
      </div>
    </div>
  );
}