import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authAPI, companiesAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  canAccessCompany: (companyId: string) => boolean;
  canAccessStore: (storeId: string) => boolean;
  canAccessRetailer: (retailerId: number) => boolean;
  getAccessibleCompanies: () => string[];
  getAccessibleStores: () => string[];
  getAccessibleRetailers: () => number[];
  getCurrentUserScope: () => string;
  canManageUsers: () => boolean;
  canViewReports: () => boolean;
  canManageInventory: () => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCompanyIds, setAllCompanyIds] = useState<string[]>([]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          // Get user profile data
          try {
            const response = await authAPI.getProfile();
            setUser(response.data);
          } catch (error) {
            console.error('Failed to get user profile:', error);
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    // Fetch all companies if user is super_admin
    const fetchAllCompanies = async () => {
      if (user?.role === 'super_admin') {
        try {
          const response = await companiesAPI.getCompanies();
          // response.data is an array of companies
          setAllCompanyIds(Array.isArray(response.data) ? response.data.map((c: any) => c.id) : []);
        } catch (err) {
          setAllCompanyIds([]);
        }
      } else {
        setAllCompanyIds([]);
      }
    };
    fetchAllCompanies();
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password);
      
      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      setUser(response.data.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  // Enhanced access control functions with proper validation
  const canAccessCompany = (companyId: string): boolean => {
    if (!user || !companyId) return false;
    
    switch (user.role) {
      case 'super_admin':
        return true; // Can access all companies
      case 'admin':
      case 'manager':
      case 'storeman':
      case 'salesman':
        return user.company_id === companyId;
      case 'retailer':
        return false; // Retailers cannot access company data
      default:
        return false;
    }
  };

  const canAccessStore = (storeId: string): boolean => {
    if (!user || !storeId) return false;
    
    switch (user.role) {
      case 'super_admin':
        return true; // Can access all stores
      case 'admin':
        // Admin can access all stores in their company
        // This would need to be validated against the actual store-company mapping
        return true; // Simplified for now - should check via API
      case 'manager':
      case 'storeman':
      case 'salesman':
        return user.store_id === storeId;
      case 'retailer':
        return false; // Retailers cannot access store data
      default:
        return false;
    }
  };

  const canAccessRetailer = (retailerId: number): boolean => {
    if (!user || !retailerId) return false;
    
    switch (user.role) {
      case 'super_admin':
        return true; // Can access all retailers
      case 'admin':
      case 'manager':
        return true; // Can access retailers in their scope
      case 'storeman':
      case 'salesman':
        return true; // Can see retailers for order management
      case 'retailer':
        return user.retailer_id === retailerId; // Can only access their own data
      default:
        return false;
    }
  };

  const getAccessibleCompanies = (): string[] => {
    if (!user) return [];
    
    switch (user.role) {
      case 'super_admin':
        return allCompanyIds;
      case 'admin':
      case 'manager':
      case 'storeman':
      case 'salesman':
        return user.company_id ? [user.company_id] : [];
      case 'retailer':
        return []; // No company access
      default:
        return [];
    }
  };

  const getAccessibleStores = (): string[] => {
    if (!user) return [];
    
    switch (user.role) {
      case 'super_admin':
        return ['NYC001', 'NYC002', 'LA001', 'CHI001']; // All stores - this should come from API
      case 'admin':
        // Return all stores for their company - this should come from API
        if (user.company_id === '1') return ['NYC001', 'NYC002'];
        if (user.company_id === '2') return ['LA001'];
        if (user.company_id === '3') return ['CHI001'];
        return [];
      case 'manager':
      case 'storeman':
      case 'salesman':
        return user.store_id ? [user.store_id] : [];
      case 'retailer':
        return []; // No store access
      default:
        return [];
    }
  };

  const getAccessibleRetailers = (): number[] => {
    if (!user) return [];
    
    switch (user.role) {
      case 'super_admin':
        return [1, 2, 3, 4]; // All retailers - this should come from API
      case 'admin':
        // Return retailers based on company scope - this should come from API
        if (user.company_id === '1') return [1, 2];
        if (user.company_id === '2') return [3];
        if (user.company_id === '3') return [4];
        return [];
      case 'manager':
      case 'storeman':
      case 'salesman':
        // Return retailers based on store scope - this should come from API
        if (user.store_id === 'NYC001') return [1, 2];
        if (user.store_id === 'LA001') return [3];
        if (user.store_id === 'CHI001') return [4];
        return [];
      case 'retailer':
        return user.retailer_id ? [user.retailer_id] : [];
      default:
        return [];
    }
  };

  const getCurrentUserScope = (): string => {
    if (!user) return 'No Access';
    
    switch (user.role) {
      case 'super_admin':
        return 'System-wide Access';
      case 'admin':
        return `Company: ${user.company_id}`;
      case 'manager':
        return `Store: ${user.store_id} (Company: ${user.company_id})`;
      case 'storeman':
        return `Store Operations: ${user.store_id}`;
      case 'salesman':
        return `Sales Territory: ${user.store_id}`;
      case 'retailer':
        return `Retailer Account: ${user.retailer_id}`;
      default:
        return 'Limited Access';
    }
  };

  const canManageUsers = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'admin', 'manager'].includes(user.role);
  };

  const canViewReports = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'admin', 'manager'].includes(user.role);
  };

  const canManageInventory = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'admin', 'manager', 'storeman'].includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole,
      canAccessCompany,
      canAccessStore,
      canAccessRetailer,
      getAccessibleCompanies,
      getAccessibleStores,
      getAccessibleRetailers,
      getCurrentUserScope,
      canManageUsers,
      canViewReports,
      canManageInventory,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};