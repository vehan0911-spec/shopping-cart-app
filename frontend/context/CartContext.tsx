'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import api, { Product } from '../lib/api';

// Define Cart Item type (includes product details)
export interface CartItem {
  productId: Product;
  quantity: number;
  price: number;
}

// Define Cart type
export interface Cart {
  _id: string;
  sessionId: string;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
}

// Context value type
interface CartContextType {
  cart: Cart | null;
  loading: boolean;       // true only while fetching the cart initially
  mutating: boolean;      // true while add/update/remove/clear is in progress
  error: string | null;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  getSessionId: () => string;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep session ID in a ref so it never changes identity and never triggers re-renders
  const sessionIdRef = useRef<string>('');

  // Always read from localStorage so that logout's new session ID is picked up immediately.
  // The ref is only used as a fallback when localStorage is empty (SSR / first run).
  const getSessionId = useCallback((): string => {
    if (typeof window === 'undefined') return 'guest-session';

    let id = localStorage.getItem('cartSessionId');
    if (!id) {
      // No session yet — generate one
      id = sessionIdRef.current ||
        `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('cartSessionId', id);
    }
    sessionIdRef.current = id;
    return id;
  }, []);

  // Fetch cart from backend — stable reference via useCallback
  const fetchCart = useCallback(async () => {
    const sid = getSessionId();
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/cart', {
        headers: { 'x-session-id': sid },
      });
      setCart(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch cart');
      console.error('Fetch cart error:', err);
    } finally {
      setLoading(false);
    }
  }, [getSessionId]);

  // Add item to cart
  const addToCart = useCallback(
    async (productId: string, quantity: number = 1) => {
      const sid = getSessionId();
      setMutating(true);
      setError(null);
      try {
        const res = await api.post(
          '/cart',
          { productId, quantity },
          { headers: { 'x-session-id': sid } }
        );
        setCart(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to add item');
        console.error('Add to cart error:', err);
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [getSessionId]
  );

  // Update quantity
  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const sid = getSessionId();
      setMutating(true);
      setError(null);
      try {
        const res = await api.put(
          `/cart/${productId}`,
          { quantity },
          { headers: { 'x-session-id': sid } }
        );
        setCart(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to update quantity');
        console.error('Update quantity error:', err);
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [getSessionId]
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (productId: string) => {
      const sid = getSessionId();
      setMutating(true);
      setError(null);
      try {
        const res = await api.delete(`/cart/${productId}`, {
          headers: { 'x-session-id': sid },
        });
        setCart(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to remove item');
        console.error('Remove from cart error:', err);
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [getSessionId]
  );

  // Clear cart
  const clearCart = useCallback(async () => {
    const sid = getSessionId();
    setMutating(true);
    setError(null);
    try {
      const res = await api.delete('/cart', {
        headers: { 'x-session-id': sid },
      });
      setCart(res.data.cart);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to clear cart');
      console.error('Clear cart error:', err);
      throw err;
    } finally {
      setMutating(false);
    }
  }, [getSessionId]);

  // Fetch cart exactly once on mount
  useEffect(() => {
    fetchCart();
    // fetchCart is stable (useCallback with no changing deps), so this runs once
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        mutating,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        getSessionId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};