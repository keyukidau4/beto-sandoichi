import { useCallback } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { addToCart } from '../store/cartSlice';
import type { Product, CartItem } from '../types';

/**
 * Custom hook for adding products to cart with option selection
 */
export function useAddToCart() {
  const dispatch = useAppDispatch();

  const addProductToCart = useCallback((
    product: Product,
    quantity: number = 1,
    selectedOptions: string[] = []
  ) => {
    // Calculate option costs
    const optionCost = selectedOptions.includes('パクチー') ? 50 : 0;
    const subtotal = (product.price + optionCost) * quantity;

    const cartItem: CartItem = {
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity,
      selectedOptions,
      subtotal,
      imageUrl: product.imageUrl,
    };

    dispatch(addToCart(cartItem));
  }, [dispatch]);

  return { addProductToCart };
}