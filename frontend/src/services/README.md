# RTK Query API Implementation

This directory contains the RTK Query implementation for the BanhMi App, providing a complete API layer with caching, error handling, and state management.

## Overview

The API implementation consists of:

- **`api.ts`**: Main RTK Query API slice with all endpoints
- **`apiHooks.ts`**: Enhanced hooks that integrate with Redux slices
- **`index.ts`**: Exports for easy importing

## Features

### ✅ Authentication Endpoints
- Login, Register, Logout
- Current user retrieval
- Automatic token handling with cookies

### ✅ Product Management
- CRUD operations for products
- Filtering by type and search
- Product view tracking
- Stock management

### ✅ Order Management
- Order creation and retrieval
- Order status updates
- Point-based payments

### ✅ Point System
- Point transaction history
- Point balance updates
- Automatic point calculations

### ✅ User Management (Admin)
- User listing and status updates
- Contact request handling
- Analytics data

### ✅ Error Handling
- Automatic error notifications
- Retry mechanisms
- Loading states

### ✅ Caching & Performance
- Automatic caching with tags
- Optimistic updates
- Background refetching

## Usage Examples

### Basic Query Usage

```typescript
import { useGetProductsQuery } from '../services';

const ProductList = () => {
  const { data, isLoading, error, refetch } = useGetProductsQuery({
    type: 'banhmi'
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.data?.message}</div>;

  return (
    <div>
      {data?.data.map(product => (
        <div key={product._id}>{product.name}</div>
      ))}
    </div>
  );
};
```

### Enhanced Hooks with State Management

```typescript
import { useAuthWithState } from '../services';

const LoginForm = () => {
  const { login } = useAuthWithState();

  const handleSubmit = async (formData) => {
    try {
      await login(formData);
      // Success notification automatically shown
      // Auth state automatically updated
    } catch (error) {
      // Error notification automatically shown
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Mutation Usage

```typescript
import { useCreateOrderMutation } from '../services';

const OrderForm = () => {
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const handleSubmit = async (orderData) => {
    try {
      const result = await createOrder(orderData).unwrap();
      console.log('Order created:', result);
    } catch (error) {
      console.error('Order failed:', error);
    }
  };

  return (
    <button onClick={handleSubmit} disabled={isLoading}>
      {isLoading ? 'Creating...' : 'Create Order'}
    </button>
  );
};
```

### Error Handling

```typescript
import { ApiErrorHandler } from '../components/common';

const ProductList = () => {
  const { data, error, isLoading } = useGetProductsQuery();

  return (
    <div>
      {error && <ApiErrorHandler error={error} showRetry />}
      {/* Rest of component */}
    </div>
  );
};
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/:id/view` - Track product view

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Points
- `GET /api/points/history` - Get point transactions
- `PUT /api/users/:id/points` - Update user points (Admin)

### User Management (Admin)
- `GET /api/users` - Get all users
- `PUT /api/users/:id/status` - Update user status
- `GET /api/admin/analytics` - Get analytics data

## Error Handling

The API implementation includes comprehensive error handling:

1. **Network Errors**: Automatic retry and user feedback
2. **Authentication Errors**: Automatic logout and redirect
3. **Validation Errors**: Field-specific error messages
4. **Server Errors**: User-friendly error messages

## Caching Strategy

RTK Query provides automatic caching with the following tags:

- `User`: User data and authentication state
- `Product`: Product listings and details
- `Order`: Order data and history
- `PointTransaction`: Point transaction history
- `ContactRequest`: Contact requests

## Testing

Tests are included in `__tests__/api.test.ts` covering:

- Endpoint configuration
- Query building
- Store integration
- Error handling

Run tests with:
```bash
npm test services/api.test.ts
```

## Integration with Existing Code

The RTK Query implementation is designed to work alongside existing Redux slices:

1. **Auth Slice**: Enhanced hooks update auth state automatically
2. **Product Slice**: Can be used for local state while RTK Query handles API calls
3. **Notification Slice**: Automatic error and success notifications

## Performance Considerations

- **Automatic Caching**: Reduces unnecessary API calls
- **Background Updates**: Keeps data fresh without blocking UI
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Selective Invalidation**: Only refetches affected data

## Future Enhancements

- [ ] Offline support with RTK Query persistence
- [ ] Real-time updates with WebSocket integration
- [ ] Advanced caching strategies for large datasets
- [ ] Request deduplication for concurrent requests