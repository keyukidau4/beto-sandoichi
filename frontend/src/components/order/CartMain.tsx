import React from 'react';
import Cart from './Cart';
import { useNavigate } from 'react-router-dom';

/**
 * Demo component to showcase cart functionality
 * This component demonstrates cart persistence and basic cart operations
 */
const CartMain: React.FC = () => {
    const navigate = useNavigate();
  const handleCheckout = () => {
    // alert('注文機能は次のタスクで実装されます');
    navigate('/order');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Cart 
        onCheckout={handleCheckout}
        className="max-w-2xl mx-auto"
      />
    </div>
  );
};

export default CartMain;