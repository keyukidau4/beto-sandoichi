import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from './';
import { loadCartFromStorage } from '../store/cartSlice';
import type { CartItem } from '../types';

const CART_STORAGE_KEY = 'banhmi-cart';

/**
 * Custom hook for persisting cart state to localStorage
 * Automatically loads cart from localStorage on mount and saves changes
 */
export function useCartPersistence() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const hasLoadedFromStorage = useRef(false);

  // Load cart from localStorage on mount (only once)
  useEffect(() => {
    if (!hasLoadedFromStorage.current) {
      try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          const parsedCart: CartItem[] = JSON.parse(storedCart);
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            dispatch(loadCartFromStorage(parsedCart));
          }
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
      hasLoadedFromStorage.current = true;
    }
  }, [dispatch]);

  // Save cart to localStorage whenever cart items change (but not during initial load)
  useEffect(() => {
    if (hasLoadedFromStorage.current) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
    }
  }, [cartItems]);

  // Clear cart from localStorage
  const clearStoredCart = () => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cart from localStorage:', error);
    }
  };

  return { clearStoredCart };
}