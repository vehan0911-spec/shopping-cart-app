'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuthFromToken: (newToken: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { fetchCart } = useCart();

  // Check localStorage on mount — run exactly once
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        // fetchCart is stable (useCallback), so calling it here is safe
        fetchCart();
      } catch (err) {
        console.error('Failed to parse stored user', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      setToken(token);
      setUser(user);
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Merge guest cart with user cart
      const sessionId = localStorage.getItem('cartSessionId') || 'guest-session';
      await api.post('/cart/merge', {}, {
        headers: {
          'x-session-id': sessionId,
          'Authorization': `Bearer ${token}`
        }
      });

      await fetchCart();
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user } = response.data;

      setToken(token);
      setUser(user);
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Merge guest cart with user cart
      const sessionId = localStorage.getItem('cartSessionId') || 'guest-session';
      await api.post('/cart/merge', {}, {
        headers: {
          'x-session-id': sessionId,
          'Authorization': `Bearer ${token}`
        }
      });

      await fetchCart();
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    delete api.defaults.headers.common['Authorization'];

    // Generate a new session ID for the guest user and update localStorage
    // BEFORE calling fetchCart so the request goes out with the new session ID
    const newSessionId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('cartSessionId', newSessionId);

    // Fetch the fresh (empty) guest cart with the new session ID
    fetchCart();
    router.push('/');
  };

  const setAuthFromToken = async (newToken: string) => {
    setLoading(true);
    try {
      // Store token
      localStorage.setItem('authToken', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      // Fetch user info
      const response = await api.get('/auth/me');
      const user = response.data.user;

      setToken(newToken);
      setUser(user);
      localStorage.setItem('authUser', JSON.stringify(user));

      // Merge guest cart into user cart
      const sessionId = localStorage.getItem('cartSessionId') || 'guest-session';
      await api.post('/cart/merge', {}, {
        headers: {
          'x-session-id': sessionId,
          'Authorization': `Bearer ${newToken}`,
        },
      });

      await fetchCart();
    } catch (error) {
      console.error('OAuth login error:', error);
      setError('Failed to complete OAuth login');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    setAuthFromToken,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};