import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product, ProductState } from '../types';

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  loading: false,
  error: null,
  filters: {},
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    fetchProductsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProductsSuccess: (state, action: PayloadAction<Product[]>) => {
      state.loading = false;
      state.products = action.payload;
      state.error = null;
    },
    fetchProductsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchProductStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProductSuccess: (state, action: PayloadAction<Product>) => {
      state.loading = false;
      state.currentProduct = action.payload;
      state.error = null;
    },
    fetchProductFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
      state.currentProduct = action.payload;
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
      if (state.currentProduct && state.currentProduct._id === action.payload._id) {
        state.currentProduct = action.payload;
      }
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
    },
    removeProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(p => p._id !== action.payload);
      if (state.currentProduct && state.currentProduct._id === action.payload) {
        state.currentProduct = null;
      }
    },
    setFilters: (state, action: PayloadAction<{ type?: 'banhmi' | 'drink'; searchTerm?: string }>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    updateProductStock: (state, action: PayloadAction<{ productId: string; newStock: number }>) => {
      const product = state.products.find(p => p._id === action.payload.productId);
      if (product) {
        product.stock = action.payload.newStock;
      }
      if (state.currentProduct && state.currentProduct._id === action.payload.productId) {
        state.currentProduct.stock = action.payload.newStock;
      }
    },
  },
});

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  fetchProductStart,
  fetchProductSuccess,
  fetchProductFailure,
  setCurrentProduct,
  updateProduct,
  addProduct,
  removeProduct,
  setFilters,
  clearFilters,
  clearError,
  updateProductStock,
} = productSlice.actions;

export default productSlice.reducer;