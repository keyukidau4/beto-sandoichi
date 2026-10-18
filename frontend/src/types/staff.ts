export interface InventoryItem {
  _id: string;
  name: string;
  type: 'banhmi' | 'drink';
  stock: number;
  isLowStock: boolean;
  imageUrl?: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockHistoryItem {
  _id: string;
  productId: string;
  productName: string;
  changeType: 'order_deduction' | 'admin_adjustment' | 'restock';
  previousStock: number;
  newStock: number;
  changeAmount: number;
  orderId?: string;
  adminId?: string;
  note?: string;
  createdAt: string;
}

export interface InventoryStats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
}

export interface ProductStockHistory {
  product: {
    _id: string;
    name: string;
    type: 'banhmi' | 'drink';
    currentStock: number;
  };
  history: StockHistoryItem[];
}

export interface StaffState {
  inventory: InventoryItem[];
  lowStockProducts: InventoryItem[];
  recentStockHistory: StockHistoryItem[];
  inventoryStats: InventoryStats | null;
  currentProductHistory: ProductStockHistory | null;
  loading: boolean;
  error: string | null;
}