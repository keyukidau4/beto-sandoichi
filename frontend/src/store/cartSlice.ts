import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, CartState } from '../types';

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        item => 
          item.productId === action.payload.productId &&
          JSON.stringify(item.selectedOptions.sort()) === JSON.stringify(action.payload.selectedOptions.sort())
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
        // Add option costs
        const optionCost = existingItem.selectedOptions.includes('パクチー') ? 50 : 0;
        existingItem.subtotal += existingItem.quantity * optionCost;
      } else {
        state.items.push(action.payload);
      }

      cartSlice.caseReducers.calculateTotals(state);
    },
    removeFromCart: (state, action: PayloadAction<{ productId: string; selectedOptions: string[] }>) => {
      state.items = state.items.filter(
        item => !(
          item.productId === action.payload.productId &&
          JSON.stringify(item.selectedOptions.sort()) === JSON.stringify(action.payload.selectedOptions.sort())
        )
      );
      cartSlice.caseReducers.calculateTotals(state);
    },
    updateQuantity: (state, action: PayloadAction<{ productId: string; selectedOptions: string[]; quantity: number }>) => {
      const item = state.items.find(
        item => 
          item.productId === action.payload.productId &&
          JSON.stringify(item.selectedOptions.sort()) === JSON.stringify(action.payload.selectedOptions.sort())
      );

      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(i => i !== item);
        } else {
          item.quantity = action.payload.quantity;
          item.subtotal = item.quantity * item.price;
          // Add option costs
          const optionCost = item.selectedOptions.includes('パクチー') ? 50 : 0;
          item.subtotal += item.quantity * optionCost;
        }
      }

      cartSlice.caseReducers.calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.totalItems = 0;
      state.error = null;
    },
    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalAmount = state.items.reduce((total, item) => total + item.subtotal, 0);
    },
    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCartError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    loadCartFromStorage: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  calculateTotals,
  setCartLoading,
  setCartError,
  loadCartFromStorage,
} = cartSlice.actions;

export default cartSlice.reducer;