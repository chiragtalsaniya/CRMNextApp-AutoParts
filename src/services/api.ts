import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
};

// Users API
export const usersAPI = {
  getUsers: (params?: any) =>
    api.get('/users', { params }),
  
  getUser: (id: string) =>
    api.get(`/users/${id}`),
  
  createUser: (userData: any) =>
    api.post('/users', userData),
  
  updateUser: (id: string, userData: any) =>
    api.put(`/users/${id}`, userData),
  
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
};

// Companies API
export const companiesAPI = {
  getCompanies: (params?: any) =>
    api.get('/companies', { params }),
  
  getCompany: (id: string) =>
    api.get(`/companies/${id}`),
  
  createCompany: (companyData: any) =>
    api.post('/companies', companyData),
  
  updateCompany: (id: string, companyData: any) =>
    api.put(`/companies/${id}`, companyData),
  
  deleteCompany: (id: string) =>
    api.delete(`/companies/${id}`),
};

// Stores API
export const storesAPI = {
  getStores: (params?: any) =>
    api.get('/stores', { params }),
  
  getStore: (branchCode: string) =>
    api.get(`/stores/${branchCode}`),
  
  createStore: (storeData: any) =>
    api.post('/stores', storeData),
  
  updateStore: (branchCode: string, storeData: any) =>
    api.put(`/stores/${branchCode}`, storeData),
  
  deleteStore: (branchCode: string) =>
    api.delete(`/stores/${branchCode}`),
};

// Retailers API
export const retailersAPI = {
  getRetailers: (params?: any) =>
    api.get('/retailers', { params }),
  
  getRetailer: (id: number) =>
    api.get(`/retailers/${id}`),
  
  createRetailer: (retailerData: any) =>
    api.post('/retailers', retailerData),
  
  updateRetailer: (id: number, retailerData: any) =>
    api.put(`/retailers/${id}`, retailerData),
  
  confirmRetailer: (id: number) =>
    api.patch(`/retailers/${id}/confirm`),
  
  updateRetailerStatus: (id: number, status: number) =>
    api.patch(`/retailers/${id}/status`, { status }),
  
  getRetailerStats: () =>
    api.get('/retailers/stats/summary'),
};

// Parts API
export const partsAPI = {
  getParts: (params?: any) =>
    api.get('/parts', { params }),
  
  getPart: (partNumber: string) =>
    api.get(`/parts/${partNumber}`),
  
  createPart: (partData: any) =>
    api.post('/parts', partData),
  
  updatePart: (partNumber: string, partData: any) =>
    api.put(`/parts/${partNumber}`, partData),
  
  updateStock: (partNumber: string, stockData: any) =>
    api.patch(`/parts/${partNumber}/stock`, stockData),
  
  getCategories: () =>
    api.get('/parts/meta/categories'),
  
  getFocusGroups: () =>
    api.get('/parts/meta/focus-groups'),
  
  getLowStock: () =>
    api.get('/parts/alerts/low-stock'),
};

// Orders API
export const ordersAPI = {
  getOrders: (params?: any) =>
    api.get('/orders', { params }),
  
  getOrder: (id: number) =>
    api.get(`/orders/${id}`),
  
  createOrder: (orderData: any) =>
    api.post('/orders', orderData),
  
  updateOrderStatus: (id: number, status: string, notes?: string) =>
    api.patch(`/orders/${id}/status`, { status, notes }),
  
  getOrderStats: () =>
    api.get('/orders/stats/summary'),
};

// Regions API
export const regionsAPI = {
  getRegions: (params?: any) =>
    api.get('/regions', { params }),
  
  getRegion: (id: string) =>
    api.get(`/regions/${id}`),
  
  createRegion: (regionData: any) =>
    api.post('/regions', regionData),
  
  updateRegion: (id: string, regionData: any) =>
    api.put(`/regions/${id}`, regionData),
  
  deleteRegion: (id: string) =>
    api.delete(`/regions/${id}`),
};

// Reports API
export const reportsAPI = {
  getOrderReport: (params: any) =>
    api.get('/reports/orders', { params }),
  
  getInventoryReport: (params: any) =>
    api.get('/reports/inventory', { params }),
  
  getSalesReport: (params: any) =>
    api.get('/reports/sales', { params }),
};

// File upload helper
export const uploadFile = (file: File, endpoint: string) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;