import React from 'react';
import Cart from './Cart';

/**
 * Demo component to showcase cart functionality
 * This component demonstrates cart persistence and basic cart operations
 */
const CartDemo: React.FC = () => {

  const handleCheckout = () => {
    alert('注文機能は次のタスクで実装されます');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">ショッピングカート デモ</h1>
        <p className="text-gray-600">
          商品をカートに追加するには、商品一覧ページから商品を選択してください。
          カートの内容は自動的にローカルストレージに保存されます。
        </p>
      </div>

      <Cart 
        onCheckout={handleCheckout}
        className="max-w-2xl mx-auto"
      />

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">実装された機能:</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• カートアイテムの表示（商品名、画像、オプション、価格）</li>
          <li>• 数量の増減コントロール</li>
          <li>• アイテムの削除</li>
          <li>• カート全体のクリア</li>
          <li>• 小計計算（オプション料金を含む）</li>
          <li>• 合計金額の表示</li>
          <li>• ローカルストレージへの自動保存</li>
          <li>• レスポンシブデザイン</li>
        </ul>
      </div>
    </div>
  );
};

export default CartDemo;