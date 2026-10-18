import React, { useState, useEffect } from "react";
import { useProductsWithState } from "../../services/apiHooks";
import { useAppDispatch } from "../../hooks";
import { setFilters, clearFilters } from "../../store/productSlice";
import ProductCard from "./ProductCard";
import ApiLoadingSpinner from "../common/ApiLoadingSpinner";

interface ProductListProps {
  initialType?: "banhmi" | "drink";
  showFilters?: boolean;
  showAddToCart?: boolean;
  className?: string;
}

const ProductList: React.FC<ProductListProps> = ({
  initialType,
  showFilters = true,
  showAddToCart = true,
  className = "",
}) => {
  const dispatch = useAppDispatch();
  const [selectedType, setSelectedType] = useState<"banhmi" | "drink" | "all">(
    initialType || "all"
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Prepare filters for API call
  const filters = {
    ...(selectedType !== "all" && { type: selectedType }),
    ...(searchTerm.trim() && { searchTerm: searchTerm.trim() }),
  };

  const { products, isLoading, error, refetch } = useProductsWithState(filters);

  // Update Redux filters when local filters change
  useEffect(() => {
    if (selectedType === "all" && !searchTerm.trim()) {
      dispatch(clearFilters());
    } else {
      dispatch(setFilters(filters));
    }
  }, [selectedType, searchTerm, dispatch]);

  const handleTypeChange = (type: "banhmi" | "drink" | "all") => {
    setSelectedType(type);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearFilters = () => {
    setSelectedType("all");
    setSearchTerm("");
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          商品の読み込みに失敗しました: {error}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                商品検索
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="商品名で検索..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div className="sm:w-48">
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                カテゴリー
              </label>
              <select
                id="type"
                value={selectedType}
                onChange={(e) =>
                  handleTypeChange(e.target.value as "banhmi" | "drink" | "all")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                <option value="banhmi">バインミー</option>
                <option value="drink">ドリンク</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(selectedType !== "all" || searchTerm.trim()) && (
              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  フィルターをクリア
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <ApiLoadingSpinner />
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && (
        <>
          {/* Results Summary */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {products.length}件の商品が見つかりました
              {selectedType !== "all" && (
                <span className="ml-1">
                  ({selectedType === "banhmi" ? "バインミー" : "ドリンク"})
                </span>
              )}
            </p>
          </div>

          {/* Products */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  showAddToCart={showAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4m-4 0H9m11 0a2 2 0 01-2 2M7 13a2 2 0 01-2-2M5 11V9a2 2 0 012-2m0 0V6a2 2 0 012-2h1m-3 4h3m6 0h3m-3 0h-1m-4 0h-1m-4 0H6m3 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v1"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                商品が見つかりませんでした
              </h3>
              <p className="text-gray-500">
                {selectedType !== "all" || searchTerm.trim()
                  ? "検索条件を変更してもう一度お試しください"
                  : "現在、商品が登録されていません"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;
