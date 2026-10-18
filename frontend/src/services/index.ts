// Export RTK Query API and hooks
export * from './api';

// Export enhanced hooks with state management
export * from './apiHooks';

// Export upload service
export * from './uploadService';

// Export staff API hooks
export * from './staffApiHooks';

// Re-export commonly used hooks for convenience
export {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  
  // Product hooks
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useTrackProductViewMutation,
  
  // Order hooks
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  
  // Point Transaction hooks
  useGetPointTransactionsQuery,
  useUpdateUserPointsMutation,
  
  // Contact Request hooks
  useGetContactRequestsQuery,
  useCreateContactRequestMutation,
  useUpdateContactRequestMutation,
  
  // User Management hooks
  useGetUsersQuery,
  useUpdateUserStatusMutation,
  
  // Analytics hooks
  useGetAnalyticsQuery,
} from './api';