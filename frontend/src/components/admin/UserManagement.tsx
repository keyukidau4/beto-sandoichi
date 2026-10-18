import React, { useState, useMemo } from "react";
import {
  useGetUsersQuery,
  useUpdateUserStatusMutation,
  useBulkUpdateUserStatusMutation,
} from "../../services/api";
import type { User, BuyerProfile } from "../../types/user";
import { useAppDispatch } from "../../hooks/useAppDispatch";
import { addNotification } from "../../store/notificationSlice";

interface UserWithProfile extends User {
  buyerProfile?: BuyerProfile;
}

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { data: usersResponse, isLoading, error, refetch } = useGetUsersQuery();
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [bulkUpdateUserStatus] = useBulkUpdateUserStatusMutation();

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | User["status"]>(
    "all"
  );
  const [roleFilter, setRoleFilter] = useState<"all" | User["role"]>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const users = usersResponse?.data || [];

  // Filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user: UserWithProfile) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.buyerProfile?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        false;

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  // Handle status update
  const handleStatusUpdate = async (
    userId: string,
    newStatus: User["status"]
  ) => {
    try {
      await updateUserStatus({ userId, status: newStatus }).unwrap();
      dispatch(
        addNotification({
          type: "success",
          message: "ユーザーステータスを更新しました",
        })
      );
      refetch();
    } catch (error) {
      console.log({error});
      
      dispatch(
        addNotification({
          type: "error",
          message: "ステータス更新に失敗しました",
        })
      );
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: User["status"]) => {
    if (selectedUsers.size === 0) {
      dispatch(
        addNotification({
          type: "warning",
          message: "ユーザーを選択してください",
        })
      );
      return;
    }

    try {
      const userIds = Array.from(selectedUsers);
      const result = await bulkUpdateUserStatus({
        userIds,
        status: newStatus,
      }).unwrap();

      dispatch(
        addNotification({
          type: "success",
          message:
            result.message ||
            `${result.data.modifiedCount}人のユーザーステータスを更新しました`,
        })
      );

      setSelectedUsers(new Set());
      refetch();
    } catch (error) {
      console.log({error});
      dispatch(
        addNotification({
          type: "error",
          message: "一括更新に失敗しました",
        })
      );
    }
  };

  // Handle individual user selection
  const handleUserSelect = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allUserIds = new Set(filteredUsers.map((user) => user._id));
      setSelectedUsers(allUserIds);
    } else {
      setSelectedUsers(new Set());
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: User["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "blacklisted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "staff":
        return "bg-blue-100 text-blue-800";
      case "buyer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">ユーザー一覧の取得に失敗しました</p>
        <button
          onClick={() => refetch()}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">ユーザー管理</h2>
        <div className="text-sm text-gray-600">
          {filteredUsers.length} / {users.length} ユーザー
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              検索
            </label>
            <input
              type="text"
              id="search"
              placeholder="メールアドレスまたは名前で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ステータス
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              <option value="pending">承認待ち</option>
              <option value="approved">承認済み</option>
              <option value="blacklisted">ブラックリスト</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="role-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              役割
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as typeof roleFilter)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              <option value="admin">管理者</option>
              <option value="staff">スタッフ</option>
              <option value="buyer">購入者</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setRoleFilter("all");
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              リセット
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedUsers.size}人選択中
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkStatusUpdate("approved")}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  一括承認
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate("pending")}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                >
                  承認待ちに戻す
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate("blacklisted")}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  ブラックリスト
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    filteredUsers.length > 0 &&
                    selectedUsers.size === filteredUsers.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ユーザー情報
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                役割
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ポイント
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                登録日
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクション
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user: UserWithProfile) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user._id)}
                    onChange={(e) =>
                      handleUserSelect(user._id, e.target.checked)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.buyerProfile?.name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.buyerProfile && (
                      <div className="text-xs text-gray-400">
                        {user.buyerProfile.tel}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role === "admin"
                      ? "管理者"
                      : user.role === "staff"
                      ? "スタッフ"
                      : "購入者"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                      user.status
                    )}`}
                  >
                    {user.status === "pending"
                      ? "承認待ち"
                      : user.status === "approved"
                      ? "承認済み"
                      : "ブラックリスト"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.buyerProfile ? `${user.buyerProfile.point}pt` : "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {user.status === "pending" && (
                      <button
                        onClick={() => handleStatusUpdate(user._id, "approved")}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        承認
                      </button>
                    )}
                    {user.status === "approved" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusUpdate(user._id, "pending")
                          }
                          className="text-yellow-600 hover:text-yellow-900 text-sm font-medium"
                        >
                          承認取消
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(user._id, "blacklisted")
                          }
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          ブラックリスト
                        </button>
                      </>
                    )}
                    {user.status === "blacklisted" && (
                      <button
                        onClick={() => handleStatusUpdate(user._id, "pending")}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        復活
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              条件に一致するユーザーが見つかりません
            </p>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">
            {users.filter((u) => u.status === "pending").length}
          </div>
          <div className="text-sm text-gray-600">承認待ち</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.status === "approved").length}
          </div>
          <div className="text-sm text-gray-600">承認済み</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">
            {users.filter((u) => u.status === "blacklisted").length}
          </div>
          <div className="text-sm text-gray-600">ブラックリスト</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-sm text-gray-600">総ユーザー数</div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
