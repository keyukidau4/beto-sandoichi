import React, { useState, useMemo } from 'react';
import { useGetUsersForEmailQuery } from '../../../../services/api';
import type { User } from '../../../../types';

interface RecipientSelectorProps {
  selectedRecipients: string[];
  onSelectionChange: (recipients: string[]) => void;
  maxRecipients?: number;
  className?: string;
}

type UserWithProfile = User & { name?: string; tel?: string; point?: number };

const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  selectedRecipients,
  onSelectionChange,
  maxRecipients = 10,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  const { data: usersResponse, isLoading } = useGetUsersForEmailQuery();
  const users = usersResponse?.data || [];

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter((user: UserWithProfile) => {
      const name = user.name || '';
      const email = user.email || '';
      const tel = user.tel || '';
      
      return (
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        tel.includes(term)
      );
    });
  }, [users, searchTerm]);

  const handleUserToggle = (userId: string) => {
    const newSelection = selectedRecipients.includes(userId)
      ? selectedRecipients.filter(id => id !== userId)
      : [...selectedRecipients, userId];
    
    // Enforce max recipients limit
    if (newSelection.length <= maxRecipients) {
      onSelectionChange(newSelection);
      setSelectAll(newSelection.length === filteredUsers.length);
    } else {
      // Show warning when trying to exceed limit
      alert(`最大${maxRecipients}人まで選択可能です。`);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      onSelectionChange([]);
      setSelectAll(false);
    } else {
      const allUserIds = filteredUsers.map((user: UserWithProfile) => user._id);
      const limitedSelection = allUserIds.slice(0, maxRecipients);
      onSelectionChange(limitedSelection);
      setSelectAll(limitedSelection.length === filteredUsers.length);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-300 rounded-md p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            送信先ユーザー選択 * ({selectedRecipients.length}/{maxRecipients}人選択中)
          </label>
          {selectedRecipients.length >= maxRecipients && (
            <span className="text-xs text-red-600">
              最大{maxRecipients}人まで選択可能
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="名前、メールアドレス、電話番号で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>

        {/* Select All */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-200">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              disabled={filteredUsers.length > maxRecipients && !selectAll}
            >
              {selectAll ? '全て解除' : `全て選択${filteredUsers.length > maxRecipients ? ` (最初の${maxRecipients}人)` : ''}`}
            </button>
            <span className="text-xs text-gray-500">
              {filteredUsers.length}人が対象
            </span>
          </div>
        )}

        {/* User List */}
        <div className="border border-gray-300 rounded-md max-h-80 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? '検索条件に一致するユーザーがいません' : '送信可能なユーザーがいません'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user: UserWithProfile) => {
                const isSelected = selectedRecipients.includes(user._id);
                const isDisabled = !isSelected && selectedRecipients.length >= maxRecipients;
                
                return (
                  <label
                    key={user._id}
                    className={`flex items-center p-3 cursor-pointer transition-colors ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    } ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleUserToggle(user._id)}
                      disabled={isDisabled}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.tel && (
                            <p className="text-xs text-gray-500">
                              TEL: {user.tel}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.status === 'approved' ? '承認済み' : '未承認'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            登録: {formatDate(user.createdAt)}
                          </p>
                          {user.point !== undefined && (
                            <p className="text-xs text-gray-500">
                              ポイント: {user.point}pt
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Selection Summary */}
        {selectedRecipients.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">✓</span>
              <span className="text-sm text-blue-800">
                {selectedRecipients.length}人のユーザーが選択されています
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientSelector;