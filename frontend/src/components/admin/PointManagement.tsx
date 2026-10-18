import React, { useState } from 'react';
import { 
  useGetUsersQuery, 
  useUpdateUserPointsMutation
} from '../../services/api';
import type { User, BuyerProfile } from '../../types';
import PointHistory from '../profile/PointHistory';

interface UserWithProfile extends User {
  buyerProfile?: BuyerProfile;
}

const PointManagement: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pointsToAdd, setPointsToAdd] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: usersResponse, isLoading: usersLoading } = useGetUsersQuery();
  const [updateUserPoints, { isLoading: updateLoading }] = useUpdateUserPointsMutation();

  const users = (usersResponse?.data || []) as UserWithProfile[];
  
  // Filter users to show only buyers with profiles
  const buyers = users.filter(user => 
    user.role === 'buyer' && 
    user.buyerProfile &&
    (searchTerm === '' || 
     user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.buyerProfile.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedUser = users.find(user => user._id === selectedUserId);

  const handleUpdatePoints = async () => {
    if (!selectedUserId || pointsToAdd === 0 || !note.trim()) {
      return;
    }

    try {
      await updateUserPoints({
        userId: selectedUserId,
        points: pointsToAdd,
        note: note.trim()
      }).unwrap();

      // Reset form
      setPointsToAdd(0);
      setNote('');
      setIsModalOpen(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('Failed to update points:', error);
    }
  };

  const openModal = (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
    setPointsToAdd(0);
    setNote('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUserId('');
    setPointsToAdd(0);
    setNote('');
  };

  if (usersLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">ポイント管理</h1>
          <p className="text-sm text-gray-600 mt-1">
            ユーザーのポイント残高を管理し、ポイント履歴を確認できます
          </p>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー検索
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="メールアドレスまたは名前で検索"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            ユーザー一覧 ({buyers.length}名)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  現在のポイント
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buyers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.buyerProfile?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status === 'approved' ? '承認済み' : 
                       user.status === 'pending' ? '承認待ち' : 'ブラックリスト'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.buyerProfile?.point.toLocaleString()} ポイント
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal(user._id)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                    >
                      ポイント追加
                    </button>
                    <button
                      onClick={() => setSelectedUserId(selectedUserId === user._id ? '' : user._id)}
                      className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors"
                    >
                      {selectedUserId === user._id ? '履歴を閉じる' : '履歴を見る'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {buyers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? '検索条件に一致するユーザーが見つかりません' : 'ユーザーが見つかりません'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Point History for Selected User */}
      {selectedUserId && selectedUserId !== '' && !isModalOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedUser?.buyerProfile?.name} さんのポイント履歴
            </h2>
          </div>
          <div className="p-6">
            <PointHistory userId={selectedUserId} />
          </div>
        </div>
      )}

      {/* Add Points Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ポイント追加
              </h3>
              
              {selectedUser && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">ユーザー:</span> {selectedUser.buyerProfile?.name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">現在のポイント:</span> {selectedUser.buyerProfile?.point.toLocaleString()} ポイント
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="pointsToAdd" className="block text-sm font-medium text-gray-700 mb-1">
                    追加ポイント数
                  </label>
                  <input
                    type="number"
                    id="pointsToAdd"
                    value={pointsToAdd}
                    onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="追加するポイント数を入力"
                    min="1"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    正の数値を入力してください（減算する場合は負の数値）
                  </p>
                </div>

                <div>
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                    備考 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ポイント追加の理由を入力してください"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  disabled={updateLoading}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpdatePoints}
                  disabled={updateLoading || pointsToAdd === 0 || !note.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateLoading ? '更新中...' : 'ポイント更新'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointManagement;