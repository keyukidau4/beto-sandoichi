export interface OrderItem {
  productId: OrderProduct;
  quantity: number;
  selectedOptions: string[];
  subtotal: number;
}

export interface OrderProduct {
  _id: string,
  name: string,
  type: string,
  price: number,
  imageUrl: string
}

export interface Order {
  _id: string;
  buyerId: string;
  items: OrderItem[];
  paymentType: '代引き' | 'ポイント';
  totalAmount: number;
  pointsUsed?: number;
  pointsEarned?: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  paymentType: '代引き' | 'ポイント';
  totalAmount: number;
  pointsUsed?: number;
}

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}