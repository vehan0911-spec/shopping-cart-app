'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { setAuthFromToken } = useAuth();

  useEffect(() => {
    if (token) {
      setAuthFromToken(token);
      // Redirect after auth is set
      router.push('/');
    } else {
      router.push('/login');
    }
  }, [token, router, setAuthFromToken]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Completing login...</h2>
    </div>
  );
}
