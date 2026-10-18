export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// export interface AuthenticatedRequest extends Express.Request {
//   user?: {
//     id: string;
//     email: string;
//     role: 'admin' | 'staff' | 'buyer';
//     status: 'pending' | 'approved' | 'blacklisted';
//   };
// }