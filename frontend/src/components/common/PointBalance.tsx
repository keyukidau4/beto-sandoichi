import React from 'react';
import { useAppSelector } from '../../hooks';

interface PointBalanceProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showIcon?: boolean;
}

const PointBalance: React.FC<PointBalanceProps> = ({
  className = '',
  size = 'medium',
  showLabel = true,
  showIcon = true
}) => {
  const { buyerProfile, user } = useAppSelector((state) => state.auth);

  if (!buyerProfile || !user) {
    return null;
  }

  const sizeClasses = {
    small: {
      container: 'px-2 py-1',
      text: 'text-sm',
      number: 'text-lg font-semibold',
      icon: 'w-4 h-4'
    },
    medium: {
      container: 'px-3 py-2',
      text: 'text-sm',
      number: 'text-xl font-bold',
      icon: 'w-5 h-5'
    },
    large: {
      container: 'px-4 py-3',
      text: 'text-base',
      number: 'text-2xl font-bold',
      icon: 'w-6 h-6'
    }
  };

  const classes = sizeClasses[size];
  const canUsePoints = user.status === 'approved';

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 ${classes.container} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {showIcon && (
            <div className={`text-blue-500 ${canUsePoints ? '' : 'opacity-50'}`}>
              <svg className={classes.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          )}
          <div>
            {showLabel && (
              <div className={`text-gray-600 ${classes.text}`}>
                保有ポイント
              </div>
            )}
            <div className={`text-blue-600 ${classes.number} ${canUsePoints ? '' : 'opacity-50'}`}>
              {buyerProfile.point.toLocaleString()}
            </div>
          </div>
        </div>
        
        {!canUsePoints && (
          <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
            承認待ち
          </div>
        )}
      </div>
      
      {!canUsePoints && (
        <div className={`mt-1 ${classes.text} text-gray-500`}>
          ポイント支払いは承認後に利用可能です
        </div>
      )}
    </div>
  );
};

export default PointBalance;