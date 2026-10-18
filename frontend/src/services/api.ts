import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
// import type { RootState } from '../store'; // Not used currently
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  User,
  BuyerProfile,
  Product,
  ProductFilters,
  CreateProductRequest,
  UpdateProductRequest,
  Order,
  CreateOrderRequest,
  PointTransaction,
  ContactRequest,
  CreateContactRequest,
  EmailTemplate,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  SendEmailRequest,
  EmailHistoryItem,
  BulkEmailRequest,
  BulkSendProgress,
  PreviewTemplateRequest,
  EmailHistoryResponse,
} from "../types";

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  credentials: "include", // Include cookies for JWT
  prepareHeaders: (headers) => {
    // Add any additional headers if needed
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

// Base query with error handling
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Token expired or invalid, logout user
    // Import logout action dynamically to avoid circular dependency
    const { logout } = await import('../store/authSlice');
    api.dispatch(logout());
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Product", "Order", "PointTransaction", "ContactRequest", "EmailTemplate", "EmailHistory", "Staff", "StockHistory", "AdminOrder"],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["User"],
    }),

    register: builder.mutation<LoginResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),

    logout: builder.mutation<null, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
        body:{}
      }),
      invalidatesTags: ["User"],
    }),

    getCurrentUser: builder.query<
      { user: User; buyerProfile?: BuyerProfile },
      void
    >({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    // Product endpoints
    getProducts: builder.query<ApiResponse<Product[]>, ProductFilters | void>({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters && "type" in filters && filters.type)
          params.append("type", filters.type);
        if (filters && "searchTerm" in filters && filters.searchTerm)
          params.append("search", filters.searchTerm);

        return {
          url: `/products${params.toString() ? `?${params.toString()}` : ""}`,
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Product" as const,
                id: _id,
              })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),

    getProduct: builder.query<ApiResponse<Product>, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),

    createProduct: builder.mutation<ApiResponse<Product>, CreateProductRequest>(
      {
        query: (productData) => ({
          url: "/products",
          method: "POST",
          body: productData,
        }),
        invalidatesTags: [{ type: "Product", id: "LIST" }],
      }
    ),

    updateProduct: builder.mutation<ApiResponse<Product>, UpdateProductRequest>(
      {
        query: ({ _id, ...productData }) => ({
          url: `/products/${_id}`,
          method: "PUT",
          body: productData,
        }),
        invalidatesTags: (_result, _error, { _id }) => [
          { type: "Product", id: _id },
          { type: "Product", id: "LIST" },
        ],
      }
    ),

    deleteProduct: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),

    trackProductView: builder.mutation<ApiResponse<null>, string>({
      query: (productId) => ({
        url: `/products/${productId}/view`,
        method: "POST",
        body: {}
      }),
    }),

    // Order endpoints
    getOrders: builder.query<ApiResponse<Order[]>, void>({
      query: () => "/orders",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "Order" as const,
                id: _id,
              })),
              { type: "Order", id: "LIST" },
            ]
          : [{ type: "Order", id: "LIST" }],
    }),

    getOrder: builder.query<ApiResponse<Order>, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),

    createOrder: builder.mutation<ApiResponse<Order>, CreateOrderRequest>({
      query: (orderData) => ({
        url: "/orders",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: [
        { type: "Order", id: "LIST" },
        { type: "Product", id: "LIST" }, // Invalidate products to update stock
        "PointTransaction", // Invalidate point transactions
      ],
    }),

    updateOrderStatus: builder.mutation<
      ApiResponse<Order>,
      { id: string; status: Order["status"] }
    >({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
      ],
    }),

    // Point Transaction endpoints
    getPointTransactions: builder.query<
      ApiResponse<PointTransaction[]>,
      string | void
    >({
      query: (userId) =>
        userId ? `/users/${userId}/points/history` : "/points/history",
      providesTags: ["PointTransaction"],
    }),

    updateUserPoints: builder.mutation<
      ApiResponse<BuyerProfile>,
      { userId: string; points: number; note: string }
    >({
      query: ({ userId, points, note }) => ({
        url: `/users/${userId}/points`,
        method: "PUT",
        body: { points, note },
      }),
      invalidatesTags: ["User", "PointTransaction"],
    }),

    // Contact Request endpoints
    getContactRequests: builder.query<ApiResponse<ContactRequest[]>, void>({
      query: () => "/users/admin/contact",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "ContactRequest" as const,
                id: _id,
              })),
              { type: "ContactRequest", id: "LIST" },
            ]
          : [{ type: "ContactRequest", id: "LIST" }],
    }),

    getUserContactRequests: builder.query<ApiResponse<ContactRequest[]>, void>({
      query: () => "/users/contact",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "ContactRequest" as const,
                id: _id,
              })),
              { type: "ContactRequest", id: "LIST" },
            ]
          : [{ type: "ContactRequest", id: "LIST" }],
    }),

    createContactRequest: builder.mutation<
      ApiResponse<ContactRequest>,
      CreateContactRequest
    >({
      query: (requestData) => ({
        url: "/users/contact",
        method: "POST",
        body: requestData,
      }),
      invalidatesTags: [{ type: "ContactRequest", id: "LIST" }],
    }),

    updateContactRequest: builder.mutation<
      ApiResponse<ContactRequest>,
      { id: string; adminResponse: string; status: "done" }
    >({
      query: ({ id, adminResponse, status }) => ({
        url: `/users/contact/${id}`,
        method: "PUT",
        body: { adminResponse, status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ContactRequest", id },
        { type: "ContactRequest", id: "LIST" },
      ],
    }),

    // User Management endpoints (Admin only)
    getUsers: builder.query<
      ApiResponse<Array<User & { buyerProfile?: BuyerProfile }>>,
      void
    >({
      query: () => "/users",
      providesTags: ["User"],
    }),

    updateUserStatus: builder.mutation<
      ApiResponse<User>,
      { userId: string; status: User["status"] }
    >({
      query: ({ userId, status }) => ({
        url: `/users/${userId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["User"],
    }),

    bulkUpdateUserStatus: builder.mutation<
      ApiResponse<{ modifiedCount: number; matchedCount: number }>,
      { userIds: string[]; status: User["status"] }
    >({
      query: ({ userIds, status }) => ({
        url: "/users/bulk/status",
        method: "PUT",
        body: { userIds, status },
      }),
      invalidatesTags: ["User"],
    }),

    getUserStatistics: builder.query<
      ApiResponse<{
        total: number;
        byStatus: {
          pending: number;
          approved: number;
          blacklisted: number;
        };
        byRole: {
          admin: number;
          staff: number;
          buyer: number;
        };
      }>,
      void
    >({
      query: () => "/users/statistics",
      providesTags: ["User"],
    }),

    // Analytics endpoints (Admin only)
    getAnalytics: builder.query<
      ApiResponse<{
        topOrderedProducts: Array<{ product: Product; orderCount: number }>;
        topViewedProducts: Array<{ product: Product; viewCount: number }>;
        userRegistrationStats: {
          total: number;
          pending: number;
          approved: number;
          blacklisted: number;
        };
      }>,
      void
    >({
      query: () => "/admin/analytics",
    }),

    // Email Template endpoints (Admin only)
    getEmailTemplates: builder.query<ApiResponse<EmailTemplate[]>, void>({
      query: () => "/admin/email-templates",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: "EmailTemplate" as const,
                id: _id,
              })),
              { type: "EmailTemplate", id: "LIST" },
            ]
          : [{ type: "EmailTemplate", id: "LIST" }],
    }),

    getEmailTemplate: builder.query<ApiResponse<EmailTemplate>, string>({
      query: (id) => `/admin/email-templates/${id}`,
      providesTags: (_result, _error, id) => [{ type: "EmailTemplate", id }],
    }),

    createEmailTemplate: builder.mutation<
      ApiResponse<EmailTemplate>,
      CreateEmailTemplateRequest
    >({
      query: (templateData) => ({
        url: "/admin/email-templates",
        method: "POST",
        body: templateData,
      }),
      invalidatesTags: [{ type: "EmailTemplate", id: "LIST" }],
    }),

    updateEmailTemplate: builder.mutation<
      ApiResponse<EmailTemplate>,
      UpdateEmailTemplateRequest
    >({
      query: ({ _id, ...templateData }) => ({
        url: `/admin/email-templates/${_id}`,
        method: "PUT",
        body: templateData,
      }),
      invalidatesTags: (_result, _error, { _id }) => [
        { type: "EmailTemplate", id: _id },
        { type: "EmailTemplate", id: "LIST" },
      ],
    }),

    deleteEmailTemplate: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/admin/email-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "EmailTemplate", id },
        { type: "EmailTemplate", id: "LIST" },
      ],
    }),

    // Email Sending endpoints (Admin only)
    sendEmailToUsers: builder.mutation<ApiResponse<null>, SendEmailRequest>({
      query: (emailData) => ({
        url: "/admin/send-email",
        method: "POST",
        body: emailData,
      }),
    }),

    getUsersForEmail: builder.query<
      ApiResponse<Array<User & { name?: string; tel?: string }>>,
      void
    >({
      query: () => "/admin/users-for-email",
      providesTags: ["User"],
    }),

    // Bulk Email endpoints
    sendBulkEmail: builder.mutation<
      ApiResponse<{ historyId: string }>,
      BulkEmailRequest
    >({
      query: (emailData) => ({
        url: "/admin/email/send-bulk",
        method: "POST",
        body: emailData,
      }),
      invalidatesTags: ["EmailHistory"],
    }),

    getBulkEmailProgress: builder.query<
      ApiResponse<BulkSendProgress>,
      string
    >({
      query: (historyId) => `/admin/email/send-progress/${historyId}`,
    }),

    // Email History endpoints
    getEmailHistory: builder.query<
      ApiResponse<EmailHistoryResponse>,
      {
        page?: number;
        limit?: number;
        dateFrom?: string;
        dateTo?: string;
        templateType?: string;
        status?: string;
        searchTerm?: string;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
        return {
          url: `/admin/email/history${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.history.map(({ _id }) => ({
                type: "EmailHistory" as const,
                id: _id,
              })),
              { type: "EmailHistory", id: "LIST" },
            ]
          : [{ type: "EmailHistory", id: "LIST" }],
    }),

    getEmailHistoryDetail: builder.query<
      ApiResponse<EmailHistoryItem>,
      string
    >({
      query: (id) => `/admin/email/history/${id}`,
      providesTags: (_result, _error, id) => [{ type: "EmailHistory", id }],
    }),

    resendFailedEmails: builder.mutation<
      ApiResponse<{ historyId: string }>,
      { historyId: string; recipientIds: string[] }
    >({
      query: ({ historyId, recipientIds }) => ({
        url: `/admin/email/history/${historyId}/resend`,
        method: "POST",
        body: { recipientIds },
      }),
      invalidatesTags: ["EmailHistory"],
    }),

    // Template Preview endpoint
    previewEmailTemplate: builder.mutation<
      ApiResponse<{ previewHtml: string }>,
      PreviewTemplateRequest
    >({
      query: ({ templateId, sampleData }) => ({
        url: `/admin/email/templates/${templateId}/preview`,
        method: "POST",
        body: { sampleData },
      }),
    }),

    // Admin Order Management endpoints
    getAdminOrders: builder.query<
      ApiResponse<{
        orders: Array<{
          _id: string;
          orderNumber: string;
          buyerName: string;
          buyerEmail: string;
          totalAmount: number;
          paymentType: '代引き' | 'ポイント';
          status: 'pending' | 'paid' | 'cancelled';
          createdAt: string;
          itemCount: number;
        }>;
        pagination: {
          currentPage: number;
          totalPages: number;
          totalOrders: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>,
      {
        page?: number;
        limit?: number;
        status?: 'pending' | 'paid' | 'cancelled';
        paymentType?: '代引き' | 'ポイント';
        dateFrom?: string;
        dateTo?: string;
        searchTerm?: string;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            searchParams.append(key, value.toString());
          }
        });
        return {
          url: `/admin/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
        };
      },
      providesTags: (result) =>
        result?.data?.orders
          ? [
              ...result.data.orders.map(({ _id }) => ({
                type: "AdminOrder" as const,
                id: _id,
              })),
              { type: "AdminOrder", id: "LIST" },
            ]
          : [{ type: "AdminOrder", id: "LIST" }],
    }),

    getAdminOrderDetail: builder.query<
      ApiResponse<{
        _id: string;
        orderNumber: string;
        buyerName: string;
        buyerEmail: string;
        totalAmount: number;
        paymentType: '代引き' | 'ポイント';
        status: 'pending' | 'paid' | 'cancelled';
        pointsUsed?: number;
        pointsEarned?: number;
        createdAt: string;
        updatedAt: string;
        deliveryAddress: {
          name: string;
          tel: string;
          zip: string;
          address: string;
        };
        items: Array<{
          productId: string;
          productName: string;
          quantity: number;
          selectedOptions: string[];
          subtotal: number;
        }>;
      }>,
      string
    >({
      query: (id) => `/admin/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminOrder", id }],
    }),

    updateAdminOrderStatus: builder.mutation<
      ApiResponse<Order>,
      { id: string; status: 'pending' | 'paid' | 'cancelled' }
    >({
      query: ({ id, status }) => ({
        url: `/admin/orders/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "AdminOrder", id },
        { type: "AdminOrder", id: "LIST" },
        { type: "Order", id },
        { type: "Order", id: "LIST" },
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
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
  useGetUserContactRequestsQuery,
  useCreateContactRequestMutation,
  useUpdateContactRequestMutation,

  // User Management hooks
  useGetUsersQuery,
  useUpdateUserStatusMutation,
  useBulkUpdateUserStatusMutation,
  useGetUserStatisticsQuery,

  // Analytics hooks
  useGetAnalyticsQuery,

  // Email Template hooks
  useGetEmailTemplatesQuery,
  useGetEmailTemplateQuery,
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,

  // Email Sending hooks
  useSendEmailToUsersMutation,
  useGetUsersForEmailQuery,

  // Bulk Email hooks
  useSendBulkEmailMutation,
  useGetBulkEmailProgressQuery,

  // Email History hooks
  useGetEmailHistoryQuery,
  useGetEmailHistoryDetailQuery,
  useResendFailedEmailsMutation,

  // Template Preview hooks
  usePreviewEmailTemplateMutation,

  // Admin Order Management hooks
  useGetAdminOrdersQuery,
  useGetAdminOrderDetailQuery,
  useUpdateAdminOrderStatusMutation,
} = api;
