import React, { useState } from 'react';
import { User, LogOut, Settings, Menu, ChevronDown, Building2, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout, getCurrentUserScope, getAccessibleCompanies, getAccessibleStores } = useAuth();
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);

  const accessibleCompanies = getAccessibleCompanies();
  const accessibleStores = getAccessibleStores();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden mr-3"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#003366] rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#003366]">NextApp Inc.</h1>
              <div className="relative">
                <button
                  onClick={() => setShowScopeDropdown(!showScopeDropdown)}
                  className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <span>{getCurrentUserScope()}</span>
                  {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {/* Scope Dropdown */}
                {showScopeDropdown && (user?.role === 'super_admin' || user?.role === 'admin') && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Access Scope</p>
                      
                      {user?.role === 'super_admin' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Building2 className="w-3 h-3" />
                            <span>Companies: {accessibleCompanies.length}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Store className="w-3 h-3" />
                            <span>Stores: {accessibleStores.length}</span>
                          </div>
                        </div>
                      )}

                      {user?.role === 'admin' && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Building2 className="w-3 h-3" />
                            <span>Company: {user.company_id}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <Store className="w-3 h-3" />
                            <span>Stores: {accessibleStores.length}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#003366] rounded-full flex items-center justify-center overflow-hidden">
              {user?.profile_image ? (
                <img 
                  src={user.profile_image} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};