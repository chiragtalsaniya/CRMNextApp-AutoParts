import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Super',
    email: 'super@nextapp.com',
    role: 'super_admin',
    profile_image: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Admin',
    email: 'admin@company1.com',
    role: 'admin',
    company_id: '1',
    profile_image: 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Bob Manager',
    email: 'manager@store1.com',
    role: 'manager',
    company_id: '1',
    store_id: 'NYC001',
    profile_image: '',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Alice Storeman',
    email: 'alice@store1.com',
    role: 'storeman',
    company_id: '1',
    store_id: 'NYC001',
    profile_image: 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: '2024-01-02T00:00:00Z'
  },
  {
    id: '5',
    name: 'Charlie Sales',
    email: 'charlie@company1.com',
    role: 'salesman',
    company_id: '1',
    store_id: 'NYC001',
    profile_image: '',
    created_at: '2024-01-03T00:00:00Z'
  },
  {
    id: '6',
    name: 'Michael Johnson',
    email: 'retailer@downtownauto.com',
    role: 'retailer',
    retailer_id: 1,
    profile_image: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400',
    created_at: '2024-01-04T00:00:00Z'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - in production, this would call your API
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password') {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
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
        const storeCompanyMapping: Record<string, string> = {
          'NYC001': '1',
          'NYC002': '1',
          'LA001': '2',
          'CHI001': '3'
        };
        return user.company_id === storeCompanyMapping[storeId];
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
        return ['1', '2', '3']; // All companies
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
        return ['NYC001', 'NYC002', 'LA001', 'CHI001']; // All stores
      case 'admin':
        // Return all stores for their company
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
        return [1, 2, 3, 4]; // All retailers
      case 'admin':
        // Return retailers based on company scope
        if (user.company_id === '1') return [1, 2];
        if (user.company_id === '2') return [3];
        if (user.company_id === '3') return [4];
        return [];
      case 'manager':
      case 'storeman':
      case 'salesman':
        // Return retailers based on store scope
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
      canManageInventory
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