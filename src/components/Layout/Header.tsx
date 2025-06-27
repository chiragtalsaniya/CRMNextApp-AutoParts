import React, { useState, useEffect } from 'react';
import { User, LogOut, Settings, Menu, ChevronDown, Building2, Store, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout, getCurrentUserScope, getAccessibleCompanies, getAccessibleStores } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const [accessibleCompanies, setAccessibleCompanies] = useState<string[]>([]);
  const [accessibleStores, setAccessibleStores] = useState<string[]>([]);

  useEffect(() => {
    setAccessibleCompanies(getAccessibleCompanies());
    setAccessibleStores(getAccessibleStores());
  }, [getAccessibleCompanies, getAccessibleStores]);

  return (
    <header className="sticky top-0 z-30 w-full bg-gradient-to-r from-[#003366] to-blue-800 dark:from-gray-900 dark:to-gray-800 shadow-lg border-b border-blue-900 dark:border-gray-800">
      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-blue-900/20 transition-colors lg:hidden"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-[#003366] font-extrabold text-2xl tracking-tight">N</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight drop-shadow">NextApp Inc.</h1>
              <div className="relative">
                <button
                  onClick={() => setShowScopeDropdown(!showScopeDropdown)}
                  className="flex items-center space-x-1 text-xs text-blue-100 hover:text-white transition-colors"
                >
                  <span>{getCurrentUserScope()}</span>
                  {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
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
        {/* Right Side Controls */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'bg-blue-200 text-blue-900' : 'text-blue-100 hover:text-yellow-300'}`}
              aria-label="Light mode"
            >
              <Sun className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-200 text-blue-900' : 'text-blue-100 hover:text-blue-300'}`}
              aria-label="Dark mode"
            >
              <Moon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTheme('auto')}
              className={`p-2 rounded-lg transition-colors ${theme === 'auto' ? 'bg-blue-200 text-blue-900' : 'text-blue-100 hover:text-white'}`}
              aria-label="System mode"
            >
              <Monitor className="w-5 h-5" />
            </button>
          </div>
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-900 rounded-full flex items-center justify-center overflow-hidden border-2 border-white">
              {user?.profile_image ? (
                <img 
                  src={user.profile_image} 
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white leading-tight">{user?.name}</p>
              <p className="text-xs text-blue-100 capitalize">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          {/* Settings & Logout */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-blue-100 hover:text-white transition-colors rounded-lg hover:bg-blue-900/30" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={logout}
              className="p-2 text-blue-100 hover:text-red-400 transition-colors rounded-lg hover:bg-blue-900/30"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};