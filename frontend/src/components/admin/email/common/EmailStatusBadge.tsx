import React from 'react';

interface EmailStatusBadgeProps {
  status: 'pending' | 'sent' | 'failed' | 'sending' | 'completed';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const EmailStatusBadge: React.FC<EmailStatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showIcon = true 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '待機中',
          icon: '⏳',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'sending':
        return {
          label: '送信中',
          icon: '📤',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'sent':
        return {
          label: '送信済み',
          icon: '✅',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'completed':
        return {
          label: '完了',
          icon: '✅',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'failed':
        return {
          label: '失敗',
          icon: '❌',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          label: '不明',
          icon: '❓',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full border font-medium ${config.className} ${sizeClasses}`}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};

export default EmailStatusBadge;