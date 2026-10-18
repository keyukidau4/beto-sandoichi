export interface ProductOption {
  name: string;
  extraCost: number;
}

export interface Product {
  _id: string;
  name: string;
  type: 'banhmi' | 'drink';
  description: string;
  price: number;
  stock: number;
  options: ProductOption[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: {
    type?: 'banhmi' | 'drink';
    searchTerm?: string;
  };
}