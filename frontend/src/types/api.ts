// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  tel: string;
  zip1: string;
  zip2: string;
  address1: string;
  address2: string;
}

export interface LoginResponse {
  user: import('./user').User;
  buyerProfile?: import('./user').BuyerProfile;
}

// Product API types
export interface ProductFilters {
  type?: 'banhmi' | 'drink';
  searchTerm?: string;
}

export interface CreateProductRequest {
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
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  _id: string;
}

// Point Transaction types
export interface PointTransaction {
  _id: string;
  userId: string;
  orderId?: string;
  type: 'purchase_reward' | 'bank_deposit_transfer_add' | 'purchase_deduction';
  amount: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

// Contact Request types are defined in user.ts

// Image Upload types
export interface ImageUploadResponse {
  success: boolean;
  message: string;
  data?: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    size: number;
  };
  error?: string;
}