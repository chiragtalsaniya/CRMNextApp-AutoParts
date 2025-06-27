import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Building2, 
  Store, 
  Users, 
  Package, 
  ShoppingCart, 
  Truck, 
  BarChart3,
  Settings,
  UserCheck,
  MapPin,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface NavItem {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Dashboard', roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { to: '/companies', icon: Building2, label: 'Companies', roles: ['super_admin'] },
  { to: '/stores', icon: Store, label: 'Stores', roles: ['super_admin', 'admin'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['super_admin', 'admin', 'manager'] },
  { to: '/retailers', icon: UserCheck, label: 'Retailers', roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman'] },
  { to: '/regions', icon: MapPin, label: 'Regions', roles: ['super_admin', 'admin', 'manager'] },
  { to: '/parts', icon: Package, label: 'Parts Inventory', roles: ['super_admin', 'admin', 'manager', 'storeman'] },
  { to: '/item-status', icon: Warehouse, label: 'Item Status', roles: ['super_admin', 'admin', 'manager', 'storeman'] },
  { to: '/orders', icon: ShoppingCart, label: 'Orders', roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
  { to: '/transport', icon: Truck, label: 'Transport', roles: ['super_admin', 'admin', 'manager'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['super_admin', 'admin', 'manager'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'] },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

// Mock company data - in production this would come from your API
const mockCompanies = [
  {
    id: '1',
    name: 'AutoParts Plus',
    logo_url: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '2',
    name: 'Premier Auto Supply',
    logo_url: 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '3',
    name: 'Metro Parts Distribution',
    logo_url: ''
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuth();
  const { theme } = useTheme();

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role || '')
  );

  // Get role-specific dashboard title
  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'super_admin': return 'System Admin';
      case 'admin': return 'Company Admin';
      case 'manager': return 'Store Manager';
      case 'storeman': return 'Store Operations';
      case 'salesman': return 'Sales Portal';
      case 'retailer': return 'Retailer Portal';
      default: return 'Portal';
    }
  };

  // Get company information for current user
  const getCurrentCompany = () => {
    if (user?.company_id) {
      return mockCompanies.find(company => company.id === user.company_id);
    }
    return null;
  };

  const currentCompany = getCurrentCompany();

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 
        ${isCollapsed ? 'w-16' : 'w-64'} 
        ${theme === 'dark' ? 'bg-gray-900 text-white border-r border-gray-800' : 'bg-[#003366] text-white'} min-h-screen
        transform transition-all duration-300 ease-in-out
        ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        flex flex-col
      `}>
        {/* Header (fixed top) */}
        <div className="p-4 border-b border-blue-700 flex-shrink-0 sticky top-0 bg-inherit z-10">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                {/* Company Logo */}
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {currentCompany?.logo_url ? (
                    <img 
                      src={currentCompany.logo_url} 
                      alt={currentCompany.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#003366] font-bold text-lg">N</span>
                  )}
                </div>
                
                {/* Company/System Name */}
                <div className="flex-1 min-w-0">
                  {user?.role === 'super_admin' ? (
                    <div>
                      <h2 className="text-lg font-semibold text-white transition-opacity duration-300">
                        NextApp Inc.
                      </h2>
                      <p className="text-xs text-blue-200 mt-1">
                        {getDashboardTitle()}
                      </p>
                    </div>
                  ) : currentCompany ? (
                    <div>
                      <h2 className="text-sm font-semibold text-white transition-opacity duration-300 truncate">
                        {currentCompany.name}
                      </h2>
                      <p className="text-xs text-blue-200 mt-1">
                        {getDashboardTitle()}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-lg font-semibold text-white transition-opacity duration-300">
                        NextApp Inc.
                      </h2>
                      <p className="text-xs text-blue-200 mt-1">
                        {getDashboardTitle()}
                      </p>
                    </div>
                  )}
                  
                  {/* Additional Role Context */}
                  {user?.role !== 'super_admin' && !isCollapsed && (
                    <div className="mt-1">
                      {user?.role === 'admin' && user?.company_id && (
                        <p className="text-xs text-blue-300">Company: {user.company_id}</p>
                      )}
                      {['manager', 'storeman', 'salesman'].includes(user?.role || '') && user?.store_id && (
                        <p className="text-xs text-blue-300">Store: {user.store_id}</p>
                      )}
                      {user?.role === 'retailer' && user?.retailer_id && (
                        <p className="text-xs text-blue-300">Retailer ID: {user.retailer_id}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Collapsed State - Show only logo */}
            {isCollapsed && (
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden mx-auto">
                {currentCompany?.logo_url ? (
                  <img 
                    src={currentCompany.logo_url} 
                    alt={currentCompany.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[#003366] font-bold text-sm">N</span>
                )}
              </div>
            )}
            
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-blue-700 transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation (scrollable middle) */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto min-h-0">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`
                  transition-all duration-300 whitespace-nowrap
                  ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
                `}>
                  {item.label}
                </span>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="
                    absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    pointer-events-none whitespace-nowrap z-50
                  ">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Role Badge (fixed bottom) */}
        {!isCollapsed && (
          <div className="p-4 border-t border-blue-700 flex-shrink-0 sticky bottom-0 bg-inherit z-10">
            <div className="bg-blue-800 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-200">Logged in as</p>
              <p className="text-sm font-semibold text-white capitalize">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}

        {/* Toggle Button (Desktop, fixed bottom) */}
        <div className="hidden lg:block p-4 border-t border-blue-700 flex-shrink-0 sticky bottom-0 bg-inherit z-10">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-blue-700 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};