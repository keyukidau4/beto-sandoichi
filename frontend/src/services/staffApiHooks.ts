import { api } from './api';
import type { InventoryItem, StockHistoryItem, InventoryStats, ProductStockHistory } from '../types/staff';

// Define API response types
interface InventoryResponse {
  success: boolean;
  data: InventoryItem[];
}

interface StockHistoryResponse {
  success: boolean;
  data: StockHistoryItem[];
}

interface InventoryStatsResponse {
  success: boolean;
  data: InventoryStats;
}

interface ProductStockHistoryResponse {
  success: boolean;
  data: ProductStockHistory;
}

interface ProductDetailsResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    type: 'banhmi' | 'drink';
    description: string;
    price: number;
    stock: number;
    options: Array<{
      name: string;
      extraCost: number;
    }>;
    imageUrl?: string;
    isLowStock: boolean;
    isOutOfStock: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

// Extend the API with staff endpoints
export const staffApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get inventory overview
    getInventoryOverview: builder.query<InventoryItem[], void>({
      query: () => '/staff/inventory',
      transformResponse: (response: InventoryResponse) => response.data,
      providesTags: ['Staff', 'Product'],
    }),

    // Get low stock products
    getLowStockProducts: builder.query<InventoryItem[], void>({
      query: () => '/staff/inventory/low-stock',
      transformResponse: (response: InventoryResponse) => response.data,
      providesTags: ['Staff', 'Product'],
    }),

    // Get inventory statistics
    getInventoryStats: builder.query<InventoryStats, void>({
      query: () => '/staff/inventory/stats',
      transformResponse: (response: InventoryStatsResponse) => response.data,
      providesTags: ['Staff', 'Product'],
    }),

    // Get recent stock history
    getRecentStockHistory: builder.query<StockHistoryItem[], number | void>({
      query: (limit = 20) => `/staff/inventory/history?limit=${limit}`,
      transformResponse: (response: StockHistoryResponse) => response.data,
      providesTags: ['Staff', 'StockHistory'],
    }),

    // Get product details (read-only for staff)
    getStaffProductDetails: builder.query<ProductDetailsResponse['data'], string>({
      query: (productId) => `/staff/products/${productId}`,
      transformResponse: (response: ProductDetailsResponse) => response.data,
      providesTags: (_result, _error, productId) => [
        { type: 'Staff', id: productId },
        { type: 'Product', id: productId },
      ],
    }),

    // Get product stock history
    getProductStockHistory: builder.query<ProductStockHistory, string>({
      query: (productId) => `/staff/products/${productId}/history`,
      transformResponse: (response: ProductStockHistoryResponse) => response.data,
      providesTags: (_result, _error, productId) => [
        { type: 'Staff', id: productId },
        { type: 'StockHistory', id: productId },
      ],
    }),
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetInventoryOverviewQuery,
  useGetLowStockProductsQuery,
  useGetInventoryStatsQuery,
  useGetRecentStockHistoryQuery,
  useGetStaffProductDetailsQuery,
  useGetProductStockHistoryQuery,
  useLazyGetInventoryOverviewQuery,
  useLazyGetLowStockProductsQuery,
  useLazyGetInventoryStatsQuery,
  useLazyGetRecentStockHistoryQuery,
  useLazyGetStaffProductDetailsQuery,
  useLazyGetProductStockHistoryQuery,
} = staffApi;