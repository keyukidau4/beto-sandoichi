import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks';
import type { User } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: User['role'] | User['role'][];
  requiredStatus?: User['status'] | User['status'][];
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredStatus,
  fallbackPath = '/login',
  showUnauthorized = false,
}) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowedRoles.includes(user.role)) {
      if (showUnauthorized) {
        return <UnauthorizedMessage userRole={user.role} requiredRoles={allowedRoles} />;
      }
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check status requirements
  if (requiredStatus) {
    const allowedStatuses = Array.isArray(requiredStatus) ? requiredStatus : [requiredStatus];
    if (!allowedStatuses.includes(user.status)) {
      if (showUnauthorized) {
        return <PendingApprovalMessage userStatus={user.status} />;
      }
      return <Navigate to="/pending-approval" replace />;
    }
  }

  return <>{children}</>;
};

// Component to show unauthorized message
const UnauthorizedMessage: React.FC<{
  userRole: User['role'];
  requiredRoles: User['role'][];
}> = ({ userRole, requiredRoles }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
      <div className="mb-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">アクセス権限がありません</h3>
      <p className="text-sm text-gray-600 mb-4">
        このページにアクセスするには{requiredRoles.join('または')}の権限が必要です。
      </p>
      <p className="text-xs text-gray-500">
        現在のロール: {getRoleDisplayName(userRole)}
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        戻る
      </button>
    </div>
  </div>
);

// Component to show pending approval message
const PendingApprovalMessage: React.FC<{
  userStatus: User['status'];
}> = ({ userStatus }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
      <div className="mb-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
          <svg
            className="h-6 w-6 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {userStatus === 'pending' ? '承認待ちです' : 'アカウントが無効です'}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {userStatus === 'pending'
          ? '管理者による承認をお待ちください。承認後、全ての機能をご利用いただけます。'
          : userStatus === 'blacklisted'
          ? 'アカウントが無効化されています。詳細については管理者にお問い合わせください。'
          : 'アカウントの状態を確認してください。'}
      </p>
      <p className="text-xs text-gray-500">
        現在のステータス: {getStatusDisplayName(userStatus)}
      </p>
    </div>
  </div>
);

// Helper function to get role display name
const getRoleDisplayName = (role: User['role']): string => {
  switch (role) {
    case 'admin':
      return '管理者';
    case 'staff':
      return 'スタッフ';
    case 'buyer':
      return '購入者';
    default:
      return role;
  }
};

// Helper function to get status display name
const getStatusDisplayName = (status: User['status']): string => {
  switch (status) {
    case 'pending':
      return '承認待ち';
    case 'approved':
      return '承認済み';
    case 'blacklisted':
      return '無効';
    default:
      return status;
  }
};