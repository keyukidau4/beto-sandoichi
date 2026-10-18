import React from 'react';
import { 
  useGetProductsQuery, 
  useGetCurrentUserQuery,
  useAuthWithState,
  useProductView,
  useOrderWithState,
} from '../../services';
import { getErrorMessage } from '../../types';

/**
 * Example component demonstrating RTK Query usage
 * This component shows how to use the API hooks for different operations
 */
const ApiUsageExample: React.FC = () => {
  const { login, logout } = useAuthWithState();
  const { trackProductView } = useProductView();
  const { createOrder } = useOrderWithState();

  // Example: Fetch current user
  const { 
    data: currentUserData, 
    isLoading: isUserLoading, 
    error: userError 
  } = useGetCurrentUserQuery();

  // Example: Fetch products with filters
  const { 
    data: productsData, 
    isLoading: isProductsLoading, 
    error: productsError,
    refetch: refetchProducts 
  } = useGetProductsQuery({ type: 'banhmi' });

  // Example: Handle login
  const handleLogin = async () => {
    try {
      await login({
        email: 'user@example.com',
        password: 'password123'
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  // Example: Handle product view tracking
  const handleProductView = async (productId: string) => {
    await trackProductView(productId);
  };

  // Example: Handle order creation
  const handleCreateOrder = async () => {
    try {
      await createOrder({
        items: [
          {
            productId: 'product-id-1',
            quantity: 2,
            selectedOptions: ['パクチー'],
            subtotal: 1100, // 1000 + 50*2 for パクチー
          }
        ],
        paymentType: '代引き',
        totalAmount: 1100,
      });
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">RTK Query API Usage Examples</h2>
      
      {/* Current User Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current User</h3>
        {isUserLoading && <p>Loading user...</p>}
        {userError && (
          <p className="text-red-500">
            Error: {getErrorMessage(userError, 'Unknown error')}
          </p>
        )}
        {currentUserData && (
          <div className="bg-gray-100 p-3 rounded">
            <p>Email: {currentUserData.user.email}</p>
            <p>Role: {currentUserData.user.role}</p>
            <p>Status: {currentUserData.user.status}</p>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Products (Banhmi)</h3>
        <button 
          onClick={() => refetchProducts()}
          className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Products
        </button>
        
        {isProductsLoading && <p>Loading products...</p>}
        {productsError && (
          <p className="text-red-500">
            Error: {getErrorMessage(productsError, 'Unknown error')}
          </p>
        )}
        {productsData?.success && (
          <div className="grid gap-2">
            {productsData.data.map((product) => (
              <div 
                key={product._id} 
                className="bg-gray-100 p-3 rounded cursor-pointer hover:bg-gray-200"
                onClick={() => handleProductView(product._id)}
              >
                <h4 className="font-medium">{product.name}</h4>
                <p>Price: ¥{product.price}</p>
                <p>Stock: {product.stock}</p>
                <p className="text-sm text-gray-600">Click to track view</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-x-2">
        <button 
          onClick={handleLogin}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Example Login
        </button>
        
        <button 
          onClick={handleCreateOrder}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Example Order
        </button>
        
        <button 
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ApiUsageExample;