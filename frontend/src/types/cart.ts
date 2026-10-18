export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedOptions: string[];
  subtotal: number;
  imageUrl?: string;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  loading: boolean;
  error: string | null;
}