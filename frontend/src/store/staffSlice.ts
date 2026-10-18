import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { StaffState, InventoryItem, StockHistoryItem, InventoryStats, ProductStockHistory } from '../types/staff';

const initialState: StaffState = {
  inventory: [],
  lowStockProducts: [],
  recentStockHistory: [],
  inventoryStats: null,
  currentProductHistory: null,
  loading: false,
  error: null,
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    // Error handling
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Inventory management
    setInventory: (state, action: PayloadAction<InventoryItem[]>) => {
      state.inventory = action.payload;
      state.loading = false;
      state.error = null;
    },

    setLowStockProducts: (state, action: PayloadAction<InventoryItem[]>) => {
      state.lowStockProducts = action.payload;
      state.loading = false;
      state.error = null;
    },

    setRecentStockHistory: (state, action: PayloadAction<StockHistoryItem[]>) => {
      state.recentStockHistory = action.payload;
      state.loading = false;
      state.error = null;
    },

    setInventoryStats: (state, action: PayloadAction<InventoryStats>) => {
      state.inventoryStats = action.payload;
      state.loading = false;
      state.error = null;
    },

    setCurrentProductHistory: (state, action: PayloadAction<ProductStockHistory>) => {
      state.currentProductHistory = action.payload;
      state.loading = false;
      state.error = null;
    },

    clearCurrentProductHistory: (state) => {
      state.currentProductHistory = null;
    },

    // Update single inventory item
    updateInventoryItem: (state, action: PayloadAction<InventoryItem>) => {
      const index = state.inventory.findIndex(item => item._id === action.payload._id);
      if (index !== -1) {
        state.inventory[index] = action.payload;
      }
    },

    // Reset state
    resetStaffState: (state) => {
      state = initialState;
      return state;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setInventory,
  setLowStockProducts,
  setRecentStockHistory,
  setInventoryStats,
  setCurrentProductHistory,
  clearCurrentProductHistory,
  updateInventoryItem,
  resetStaffState,
} = staffSlice.actions;

export default staffSlice.reducer;