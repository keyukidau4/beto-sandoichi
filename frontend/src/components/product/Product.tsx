import React from 'react';
import ProductList from './ProductList';

const Product: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <ProductList />
        </div>
      </div>
    </div>
  );
};

export default Product;