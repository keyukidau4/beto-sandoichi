import React, { useState, useCallback } from 'react';
import { useGetProductsQuery, useDeleteProductMutation } from '../../services/api';
import { useAppDispatch } from '../../hooks';
import { addNotification } from '../../store/notificationSlice';
import type { Product } from '../../types';
import ProductForm from './ProductForm';
import ProductList from './ProductList';

type ProductManagementProps = object

const ProductManagement: React.FC<ProductManagementProps> = () => {
  const dispatch = useAppDispatch();
  const [deleteProduct] = useDeleteProductMutation();
  
  // State for managing UI
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<{
    type?: 'banhmi' | 'drink';
    searchTerm?: string;
  }>({});

  // Fetch products with filters
  const { 
    data: productsResponse, 
    isLoading, 
    error, 
    refetch 
  } = useGetProductsQuery(filters);

  const products = productsResponse?.data || [];

  // Handle product deletion (soft delete)
  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (!window.confirm('この商品を削除してもよろしいですか？')) {
      return;
    }

    try {
      const result = await deleteProduct(productId).unwrap();
      
      if (result.success) {
        dispatch(addNotification({
          type: 'success',
          message: '商品が正常に削除されました',
        }));
        refetch();
      }
    } catch (error: unknown) {
      console.log({error});
      
      dispatch(addNotification({
        type: 'error',
        message: '商品の削除に失敗しました',
      }));
    }
  }, [deleteProduct, dispatch, refetch]);

  // Handle edit product
  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowCreateForm(true);
  }, []);

  // Handle create new product
  const handleCreateProduct = useCallback(() => {
    setEditingProduct(null);
    setShowCreateForm(true);
  }, []);

  // Handle form close
  const handleFormClose = useCallback(() => {
    setShowCreateForm(false);
    setEditingProduct(null);
  }, []);

  // Handle form success
  const handleFormSuccess = useCallback(() => {
    setShowCreateForm(false);
    setEditingProduct(null);
    refetch();
  }, [refetch]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">商品の読み込みに失敗しました</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
        <button
          onClick={handleCreateProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer"
        >
          新しい商品を追加
        </button>
      </div>

      {/* Product Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ProductForm
              product={editingProduct}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </div>
        </div>
      )}

      {/* Product List */}
      <ProductList
        products={products}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onFilterChange={handleFilterChange}
        filters={filters}
      />
    </div>
  );
};

export default ProductManagement;