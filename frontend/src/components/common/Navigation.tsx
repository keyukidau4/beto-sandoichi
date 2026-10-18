import React from 'react';
import { useAppSelector } from '../../hooks';

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  roles?: string[];
}

interface NavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick: (itemId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'tabs' | 'pills' | 'underline';
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({
  items,
  activeItem,
  onItemClick,
  orientation = 'horizontal',
  variant = 'tabs',
  className = '',
}) => {
  const { user } = useAppSelector((state) => state.auth);

  // Filter items based on user role
  const filteredItems = items.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return user && item.roles.includes(user.role);
  });

  const baseClasses = orientation === 'horizontal' 
    ? 'flex flex-wrap' 
    : 'flex flex-col space-y-1';

  const getItemClasses = (item: NavigationItem) => {
    const isActive = activeItem === item.id;
    
    const baseItemClasses = 'relative flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
    
    switch (variant) {
      case 'tabs':
        return `${baseItemClasses} ${
          isActive
            ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 border-b-2 border-transparent'
        }`;
      
      case 'pills':
        return `${baseItemClasses} rounded-lg ${
          isActive
            ? 'text-white bg-primary-600'
            : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
        }`;
      
      case 'underline':
        return `${baseItemClasses} ${
          isActive
            ? 'text-primary-600 border-b-2 border-primary-600'
            : 'text-gray-600 hover:text-primary-600 border-b-2 border-transparent'
        }`;
      
      default:
        return baseItemClasses;
    }
  };

  return (
    <nav className={`${baseClasses} ${className}`}>
      {filteredItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={getItemClasses(item)}
          type="button"
        >
          {item.icon && (
            <span className="flex-shrink-0">
              {item.icon}
            </span>
          )}
          <span>{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

// Breadcrumb component
export const Breadcrumb: React.FC<{
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  separator?: React.ReactNode;
  className?: string;
}> = ({
  items,
  separator = (
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  className = '',
}) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="flex-shrink-0">
              {separator}
            </span>
          )}
          {index === items.length - 1 ? (
            <span className="text-gray-500 font-medium">
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Sidebar navigation component
export const SidebarNavigation: React.FC<{
  items: NavigationItem[];
  activeItem?: string;
  onItemClick: (itemId: string) => void;
  collapsed?: boolean;
  className?: string;
}> = ({
  items,
  activeItem,
  onItemClick,
  collapsed = false,
  className = '',
}) => {
  const { user } = useAppSelector((state) => state.auth);

  const filteredItems = items.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <nav className={`space-y-1 ${className}`}>
      {filteredItems.map((item) => {
        const isActive = activeItem === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              isActive
                ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-600'
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
            }`}
            title={collapsed ? item.label : undefined}
          >
            {item.icon && (
              <span className={`flex-shrink-0 ${collapsed ? '' : 'mr-3'}`}>
                {item.icon}
              </span>
            )}
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
};

// Tab navigation component
export const TabNavigation: React.FC<{
  tabs: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Navigation;