import { Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector, useCartPersistence, useAuthInitialization } from "./hooks";
import { Layout, Toast } from "./components/common";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { AuthDemo } from "./components/auth/AuthDemo";
import Product from "./components/product/Product";
import ProductDetail from "./components/product/ProductDetail";
import { CartMain, OrderMain, OrderHistory } from "./components/order";
import { AdminDemo } from "./components/admin";
import { StaffDemo } from "./components/staff";
import { ProfileDemo } from "./components/profile";
import "./App.css";

// Protected Route Component
function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  requiredRole?: 'admin' | 'staff' | 'buyer';
}) {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Home Page Component
function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 font-japanese">
            BanhMi App
          </h1>
          <p className="text-xl mb-8">
            美味しいベトナムサンドイッチをお届けします
          </p>
        </div>
      </div>
      <Product />
    </div>
  );
}

// Login/Register Page
function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 font-japanese">
            BanhMi App
          </h2>
          <p className="mt-2 text-gray-600">
            アカウントにログインまたは新規登録
          </p>
        </div>
        <AuthDemo />
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Initialize authentication state
  const { isInitializing } = useAuthInitialization();
  
  // Initialize cart persistence
  useCartPersistence();

  const handleNavigation = (section: string) => {
    // Navigation is now handled by React Router
    console.log(`Navigate to: ${section}`);
  };

  // Show loading screen while checking authentication
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">アプリを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout onNavigate={handleNavigation} showFooter={true}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<Product />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
          } />
          
          {/* Protected Routes for authenticated users */}
          <Route path="/cart" element={
            <ProtectedRoute>
              <CartMain />
            </ProtectedRoute>
          } />
          
          <Route path="/order" element={
            <ProtectedRoute>
              <OrderMain />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfileDemo />
            </ProtectedRoute>
          } />
          
          <Route path="/orders" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 py-8">
                <OrderHistory />
              </div>
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDemo />
            </ProtectedRoute>
          } />
          
          {/* Staff Routes */}
          <Route path="/staff/*" element={
            <ProtectedRoute requiredRole="staff">
              <StaffDemo />
            </ProtectedRoute>
          } />
          
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toast />
    </ErrorBoundary>
  );
}

export default App;
