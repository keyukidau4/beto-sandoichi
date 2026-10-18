import React from 'react';
import ProductList from './ProductList';

const ProductDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Product Components Demo
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Product List Component</h2>
          <p className="text-gray-600 mb-4">
            This demonstrates the ProductList component with filtering, search, and product cards.
            Each product card includes options selection, quantity controls, and add to cart functionality.
          </p>
          
          <ProductList />
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Features Implemented:</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• ProductCard component with image, price, and options</li>
            <li>• ProductList component with filtering by type (banhmi/drink)</li>
            <li>• ProductOptions component for パクチー and チリソース selection</li>
            <li>• Product view tracking for analytics</li>
            <li>• Add to cart functionality with option cost calculation</li>
            <li>• Stock management and out-of-stock handling</li>
            <li>• Responsive design with Tailwind CSS</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProductDemo;