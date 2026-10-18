import React from 'react';
import type { ProductOption } from '../../types';

interface ProductOptionsProps {
  options: ProductOption[];
  selectedOptions: string[];
  onOptionChange: (optionName: string, selected: boolean) => void;
  disabled?: boolean;
}

const ProductOptions: React.FC<ProductOptionsProps> = ({
  options,
  selectedOptions,
  onOptionChange,
  disabled = false,
}) => {
  if (!options || options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">オプション</h4>
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.name);
          const extraCostText = option.extraCost > 0 ? ` (+${option.extraCost}円)` : '';
          
          return (
            <label
              key={option.name}
              className={`flex items-center space-x-3 p-2 rounded-md border cursor-pointer transition-colors ${
                disabled
                  ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                  : isSelected
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onOptionChange(option.name, e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                {option.name}{extraCostText}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ProductOptions;