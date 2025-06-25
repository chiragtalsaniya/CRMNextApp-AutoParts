import { supabase, handleSupabaseError } from '../lib/supabase';
import { User, UserRole, Company, Store, Retailer, Part, ItemStatus, OrderMaster, OrderItem, Region } from '../types';

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (userError) throw userError;
      
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);
      
      return {
        data: {
          token: data.session?.access_token,
          user: userData
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  getProfile: async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) throw new Error('User not found');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      // First verify current password by trying to sign in
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: currentPassword
      });
      
      if (signInError) throw new Error('Current password is incorrect');
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { data: { message: 'Password updated successfully' } };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
  
  refreshToken: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      return {
        data: {
          token: data.session?.access_token
        }
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { data: { message: 'Logged out successfully' } };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
};

// Users API
export const usersAPI = {
  getUsers: async (params?: any) => {
    try {
      let query = supabase.from('users').select('*');
      
      // Apply filters
      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }
      
      if (params?.role && params.role !== 'all') {
        query = query.eq('role', params.role);
      }
      
      if (params?.company_id && params.company_id !== 'all') {
        query = query.eq('company_id', params.company_id);
      }
      
      if (params?.store_id && params.store_id !== 'all') {
        query = query.eq('store_id', params.store_id);
      }
      
      if (params?.is_active !== undefined) {
        query = query.eq('is_active', params.is_active === 'true');
      }
      
      // Pagination
      const page = params?.page ? parseInt(params.page) : 1;
      const limit = params?.limit ? parseInt(params.limit) : 50;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        data: {
          users: data,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },
  
  getUser: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },
  
  createUser: async (userData: any) => {
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      // Then create user profile
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          company_id: userData.company_id || null,
          store_id: userData.store_id || null,
          region_id: userData.region_id || null,
          retailer_id: userData.retailer_id || null,
          profile_image: userData.profile_image || null,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        // Rollback auth user creation if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw error;
      }
      
      return {
        data: {
          message: 'User created successfully',
          user: data
        }
      };
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  },
  
  updateUser: async (id: string, userData: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          role: userData.role,
          company_id: userData.company_id,
          store_id: userData.store_id,
          region_id: userData.region_id,
          retailer_id: userData.retailer_id,
          profile_image: userData.profile_image,
          is_active: userData.is_active
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'User updated successfully',
          user: data
        }
      };
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },
  
  deleteUser: async (id: string) => {
    try {
      // Delete user profile
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (profileError) throw profileError;
      
      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) throw authError;
      
      return {
        data: {
          message: 'User deleted successfully'
        }
      };
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }
};

// Companies API
export const companiesAPI = {
  getCompanies: async (params?: any) => {
    try {
      let query = supabase.from('companies').select('*');
      
      // Apply filters
      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,contact_email.ilike.%${params.search}%`);
      }
      
      // Pagination
      const page = params?.page ? parseInt(params.page) : 1;
      const limit = params?.limit ? parseInt(params.limit) : 50;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        data: {
          companies: data,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get companies error:', error);
      throw error;
    }
  },
  
  getCompany: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Get company error:', error);
      throw error;
    }
  },
  
  createCompany: async (companyData: any) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          id: companyData.id || Date.now().toString(),
          name: companyData.name,
          address: companyData.address,
          contact_email: companyData.contact_email,
          contact_phone: companyData.contact_phone,
          logo_url: companyData.logo_url,
          created_by: companyData.created_by
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Company created successfully',
          company: data
        }
      };
    } catch (error) {
      console.error('Create company error:', error);
      throw error;
    }
  },
  
  updateCompany: async (id: string, companyData: any) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          address: companyData.address,
          contact_email: companyData.contact_email,
          contact_phone: companyData.contact_phone,
          logo_url: companyData.logo_url
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Company updated successfully',
          company: data
        }
      };
    } catch (error) {
      console.error('Update company error:', error);
      throw error;
    }
  },
  
  deleteCompany: async (id: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Company deleted successfully'
        }
      };
    } catch (error) {
      console.error('Delete company error:', error);
      throw error;
    }
  }
};

// Stores API
export const storesAPI = {
  getStores: async (params?: any) => {
    try {
      let query = supabase.from('stores').select('*');
      
      // Apply filters
      if (params?.search) {
        query = query.or(`branch_code.ilike.%${params.search}%,branch_name.ilike.%${params.search}%,company_name.ilike.%${params.search}%`);
      }
      
      if (params?.company_id && params.company_id !== 'all') {
        query = query.eq('company_id', params.company_id);
      }
      
      // Pagination
      const page = params?.page ? parseInt(params.page) : 1;
      const limit = params?.limit ? parseInt(params.limit) : 50;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        data: {
          stores: data,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get stores error:', error);
      throw error;
    }
  },
  
  getStore: async (branchCode: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('branch_code', branchCode)
        .single();
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Get store error:', error);
      throw error;
    }
  },
  
  createStore: async (storeData: any) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          branch_code: storeData.Branch_Code,
          branch_name: storeData.Branch_Name,
          company_name: storeData.Company_Name,
          branch_address: storeData.Branch_Address,
          branch_phone: storeData.Branch_Phone,
          branch_email: storeData.Branch_Email,
          branch_manager: storeData.Branch_Manager,
          branch_url: storeData.Branch_URL,
          branch_manager_mobile: storeData.Branch_Manager_Mobile,
          store_image: storeData.store_image,
          company_id: storeData.company_id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Store created successfully',
          store: data
        }
      };
    } catch (error) {
      console.error('Create store error:', error);
      throw error;
    }
  },
  
  updateStore: async (branchCode: string, storeData: any) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .update({
          branch_name: storeData.Branch_Name,
          company_name: storeData.Company_Name,
          branch_address: storeData.Branch_Address,
          branch_phone: storeData.Branch_Phone,
          branch_email: storeData.Branch_Email,
          branch_manager: storeData.Branch_Manager,
          branch_url: storeData.Branch_URL,
          branch_manager_mobile: storeData.Branch_Manager_Mobile,
          store_image: storeData.store_image,
          company_id: storeData.company_id
        })
        .eq('branch_code', branchCode)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Store updated successfully',
          store: data
        }
      };
    } catch (error) {
      console.error('Update store error:', error);
      throw error;
    }
  },
  
  deleteStore: async (branchCode: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('branch_code', branchCode);
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Store deleted successfully'
        }
      };
    } catch (error) {
      console.error('Delete store error:', error);
      throw error;
    }
  }
};

// Retailers API
export const retailersAPI = {
  getRetailers: async (params?: any) => {
    try {
      let query = supabase.from('retailers').select('*');
      
      // Apply filters
      if (params?.search) {
        query = query.or(`retailer_name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%,retailer_email.ilike.%${params.search}%`);
      }
      
      if (params?.status !== undefined) {
        query = query.eq('retailer_status', params.status);
      }
      
      if (params?.area_id) {
        query = query.eq('area_id', params.area_id);
      }
      
      if (params?.confirmed_only === 'true') {
        query = query.eq('confirm', 1);
      }
      
      // Pagination
      const page = params?.page ? parseInt(params.page) : 1;
      const limit = params?.limit ? parseInt(params.limit) : 50;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('retailers')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        data: {
          retailers: data,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get retailers error:', error);
      throw error;
    }
  },
  
  getRetailer: async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .select('*')
        .eq('retailer_id', id)
        .single();
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Get retailer error:', error);
      throw error;
    }
  },
  
  createRetailer: async (retailerData: any) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .insert({
          retailer_name: retailerData.Retailer_Name,
          retailer_address: retailerData.Retailer_Address,
          retailer_mobile: retailerData.Retailer_Mobile,
          contact_person: retailerData.Contact_Person,
          retailer_email: retailerData.Retailer_Email,
          gst_no: retailerData.GST_No,
          credit_limit: retailerData.Credit_Limit,
          area_name: retailerData.Area_Name,
          pincode: retailerData.Pincode,
          retailer_status: 1,
          confirm: 0,
          last_sync: Date.now()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Retailer created successfully',
          retailer_id: data.retailer_id
        }
      };
    } catch (error) {
      console.error('Create retailer error:', error);
      throw error;
    }
  },
  
  updateRetailer: async (id: number, retailerData: any) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .update({
          retailer_name: retailerData.Retailer_Name,
          retailer_address: retailerData.Retailer_Address,
          retailer_mobile: retailerData.Retailer_Mobile,
          contact_person: retailerData.Contact_Person,
          retailer_email: retailerData.Retailer_Email,
          gst_no: retailerData.GST_No,
          credit_limit: retailerData.Credit_Limit,
          area_name: retailerData.Area_Name,
          pincode: retailerData.Pincode,
          last_sync: Date.now()
        })
        .eq('retailer_id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Retailer updated successfully'
        }
      };
    } catch (error) {
      console.error('Update retailer error:', error);
      throw error;
    }
  },
  
  confirmRetailer: async (id: number) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .update({
          confirm: 1,
          last_sync: Date.now()
        })
        .eq('retailer_id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Retailer confirmed successfully'
        }
      };
    } catch (error) {
      console.error('Confirm retailer error:', error);
      throw error;
    }
  },
  
  updateRetailerStatus: async (id: number, status: number) => {
    try {
      const { data, error } = await supabase
        .from('retailers')
        .update({
          retailer_status: status,
          last_sync: Date.now()
        })
        .eq('retailer_id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Retailer status updated successfully'
        }
      };
    } catch (error) {
      console.error('Update retailer status error:', error);
      throw error;
    }
  },
  
  getRetailerStats: async () => {
    try {
      const { data: retailers, error } = await supabase
        .from('retailers')
        .select('*');
      
      if (error) throw error;
      
      const stats = {
        total_retailers: retailers.length,
        active_retailers: retailers.filter(r => r.retailer_status === 1).length,
        confirmed_retailers: retailers.filter(r => r.confirm === 1).length,
        unique_areas: new Set(retailers.map(r => r.area_id).filter(Boolean)).size,
        avg_credit_limit: retailers.reduce((sum, r) => sum + (r.credit_limit || 0), 0) / retailers.length
      };
      
      return { data: stats };
    } catch (error) {
      console.error('Get retailer stats error:', error);
      throw error;
    }
  }
};

// Parts API
export const partsAPI = {
  getParts: async (params?: any) => {
    try {
      let query = supabase.from('parts').select('*');
      
      // Apply filters
      if (params?.search) {
        query = query.or(`part_number.ilike.%${params.search}%,part_name.ilike.%${params.search}%,part_application.ilike.%${params.search}%`);
      }
      
      if (params?.category) {
        query = query.eq('part_category', params.category);
      }
      
      if (params?.focus_group) {
        query = query.eq('focus_group', params.focus_group);
      }
      
      if (params?.status) {
        query = query.eq('item_status', params.status);
      }
      
      if (params?.order_pad_only === 'true') {
        query = query.eq('is_order_pad', 1);
      }
      
      // Pagination
      const page = params?.page ? parseInt(params.page) : 1;
      const limit = params?.limit ? parseInt(params.limit) : 50;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('parts')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        data: {
          parts: data,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get parts error:', error);
      throw error;
    }
  },
  
  getPart: async (partNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('part_number', partNumber)
        .single();
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Get part error:', error);
      throw error;
    }
  },
  
  createPart: async (partData: any) => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .insert({
          part_number: partData.Part_Number,
          part_name: partData.Part_Name,
          part_price: partData.Part_Price,
          part_min_qty: partData.Part_MinQty,
          part_basic_disc: partData.Part_BasicDisc,
          part_scheme_disc: partData.Part_SchemeDisc,
          part_additional_disc: partData.Part_AdditionalDisc,
          part_application: partData.Part_Application,
          focus_group: partData.Focus_Group,
          part_category: partData.Part_Catagory,
          item_status: partData.Item_Status || 'Active',
          last_sync: Date.now()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Part created successfully',
          part_number: data.part_number
        }
      };
    } catch (error) {
      console.error('Create part error:', error);
      throw error;
    }
  },
  
  updatePart: async (partNumber: string, partData: any) => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .update({
          part_name: partData.Part_Name,
          part_price: partData.Part_Price,
          part_min_qty: partData.Part_MinQty,
          part_basic_disc: partData.Part_BasicDisc,
          part_scheme_disc: partData.Part_SchemeDisc,
          part_additional_disc: partData.Part_AdditionalDisc,
          part_application: partData.Part_Application,
          focus_group: partData.Focus_Group,
          part_category: partData.Part_Catagory,
          item_status: partData.Item_Status,
          last_sync: Date.now()
        })
        .eq('part_number', partNumber)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Part updated successfully'
        }
      };
    } catch (error) {
      console.error('Update part error:', error);
      throw error;
    }
  },
  
  updateStock: async (partNumber: string, stockData: any) => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .update({
          t1: stockData.T1 || 0,
          t2: stockData.T2 || 0,
          t3: stockData.T3 || 0,
          t4: stockData.T4 || 0,
          t5: stockData.T5 || 0,
          last_sync: Date.now()
        })
        .eq('part_number', partNumber)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Stock levels updated successfully'
        }
      };
    } catch (error) {
      console.error('Update stock error:', error);
      throw error;
    }
  },
  
  getCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('part_category')
        .not('part_category', 'is', null)
        .order('part_category');
      
      if (error) throw error;
      
      // Count parts in each category
      const categories = [];
      const uniqueCategories = [...new Set(data.map(item => item.part_category))];
      
      for (const category of uniqueCategories) {
        const { count, error: countError } = await supabase
          .from('parts')
          .select('*', { count: 'exact', head: true })
          .eq('part_category', category);
        
        if (countError) throw countError;
        
        categories.push({
          category,
          count
        });
      }
      
      return { data: categories };
    } catch (error) {
      console.error('Get categories error:', error);
      throw error;
    }
  },
  
  getFocusGroups: async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('focus_group')
        .not('focus_group', 'is', null)
        .order('focus_group');
      
      if (error) throw error;
      
      // Count parts in each focus group
      const focusGroups = [];
      const uniqueFocusGroups = [...new Set(data.map(item => item.focus_group))];
      
      for (const focusGroup of uniqueFocusGroups) {
        const { count, error: countError } = await supabase
          .from('parts')
          .select('*', { count: 'exact', head: true })
          .eq('focus_group', focusGroup);
        
        if (countError) throw countError;
        
        focusGroups.push({
          focus_group: focusGroup,
          count
        });
      }
      
      return { data: focusGroups };
    } catch (error) {
      console.error('Get focus groups error:', error);
      throw error;
    }
  },
  
  getLowStock: async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('item_status', 'Active')
        .lt('t1 + t2 + t3 + t4 + t5', 'part_min_qty')
        .order('part_min_qty', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match expected format
      const lowStockParts = data.map(part => ({
        Part_Number: part.part_number,
        Part_Name: part.part_name,
        Part_MinQty: part.part_min_qty,
        total_stock: (part.t1 || 0) + (part.t2 || 0) + (part.t3 || 0) + (part.t4 || 0) + (part.t5 || 0),
        Part_Catagory: part.part_category,
        Focus_Group: part.focus_group
      }));
      
      return { data: lowStockParts };
    } catch (error) {
      console.error('Get low stock error:', error);
      throw error;
    }
  }
};

// Item Status API
export const itemStatusAPI = {
  getItemStatus: async (params?: any) => {
    try {
      let query = supabase
        .from('item_status')
        .select(`
          *,
          stores!inner(branch_name, company_name),
          parts!inner(part_name, part_price, part_min_qty, part_category, focus_group)
        `);
      
      // Apply filters
      if (params?.branch_code) {
        query = query.eq('branch_code', params.branch_code);
      }
      
      if (params?.part_no) {
        query = query.eq('part_no', params.part_no);
      }
      
      if (params?.rack) {
        query = query.ilike('part_rack', `%${params.rack}%`);
      }
      
      if (params?.search) {
        query = query.or(`part_no.ilike.%${params.search}%,parts.part_name.ilike.%${params.search}%,part_rack.ilike.%${params.search}%`);
      }
      
      if (params?.low_stock_only === 'true') {
        // This is a complex condition that might need to be handled in code
        // For now, we'll fetch all and filter in code
      }
      
      // Pagination
      const page = params?.page ? parseInt(params.page) : 1;
      const limit = params?.limit ? parseInt(params.limit) : 50;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process data to add calculated fields
      const processedData = data.map(item => {
        const partA = parseInt(item.part_a || '0');
        const partB = parseInt(item.part_b || '0');
        const partC = parseInt(item.part_c || '0');
        const maxStock = parseInt(item.part_max || '1');
        const totalStock = partA + partB + partC;
        const stockPercentage = Math.round((totalStock / maxStock) * 100);
        
        let stockLevel = 'good';
        if (stockPercentage < 20) stockLevel = 'critical';
        else if (stockPercentage < 40) stockLevel = 'low';
        else if (stockPercentage < 70) stockLevel = 'medium';
        
        return {
          ...item,
          Branch_Code: item.branch_code,
          Part_No: item.part_no,
          Part_Branch: item.part_branch,
          Part_A: item.part_a,
          Part_B: item.part_b,
          Part_C: item.part_c,
          Part_Max: item.part_max,
          Part_Rack: item.part_rack,
          LastSale: item.last_sale,
          LastPurchase: item.last_purchase,
          Narr: item.narr,
          Last_Sync: item.last_sync,
          Branch_Name: item.stores?.branch_name,
          Company_Name: item.stores?.company_name,
          Part_Name: item.parts?.part_name,
          Part_Price: item.parts?.part_price,
          Part_MinQty: item.parts?.part_min_qty,
          Part_Catagory: item.parts?.part_category,
          Focus_Group: item.parts?.focus_group,
          total_stock: totalStock,
          max_stock: maxStock,
          stock_percentage: stockPercentage,
          stock_level: stockLevel
        };
      });
      
      // Filter for low stock if needed
      let filteredData = processedData;
      if (params?.low_stock_only === 'true') {
        filteredData = processedData.filter(item => 
          (item.total_stock / item.max_stock) < 0.2
        );
      }
      
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('item_status')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        data: {
          data: filteredData,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get item status error:', error);
      throw error;
    }
  },
  
  getItemStatusByStoreAndPart: async (branchCode: string, partNo: string) => {
    try {
      const { data, error } = await supabase
        .from('item_status')
        .select(`
          *,
          stores!inner(branch_name, company_name),
          parts!inner(part_name, part_price, part_min_qty, part_category, focus_group, part_image)
        `)
        .eq('branch_code', branchCode)
        .eq('part_no', partNo)
        .single();
      
      if (error) throw error;
      
      // Process data to add calculated fields
      const partA = parseInt(data.part_a || '0');
      const partB = parseInt(data.part_b || '0');
      const partC = parseInt(data.part_c || '0');
      const maxStock = parseInt(data.part_max || '1');
      const totalStock = partA + partB + partC;
      const stockPercentage = Math.round((totalStock / maxStock) * 100);
      
      let stockLevel = 'good';
      if (stockPercentage < 20) stockLevel = 'critical';
      else if (stockPercentage < 40) stockLevel = 'low';
      else if (stockPercentage < 70) stockLevel = 'medium';
      
      const processedData = {
        ...data,
        Branch_Code: data.branch_code,
        Part_No: data.part_no,
        Part_Branch: data.part_branch,
        Part_A: data.part_a,
        Part_B: data.part_b,
        Part_C: data.part_c,
        Part_Max: data.part_max,
        Part_Rack: data.part_rack,
        LastSale: data.last_sale,
        LastPurchase: data.last_purchase,
        Narr: data.narr,
        Last_Sync: data.last_sync,
        Branch_Name: data.stores?.branch_name,
        Company_Name: data.stores?.company_name,
        Part_Name: data.parts?.part_name,
        Part_Price: data.parts?.part_price,
        Part_MinQty: data.parts?.part_min_qty,
        Part_Catagory: data.parts?.part_category,
        Focus_Group: data.parts?.focus_group,
        Part_Image: data.parts?.part_image,
        total_stock: totalStock,
        max_stock: maxStock,
        stock_percentage: stockPercentage,
        stock_level: stockLevel
      };
      
      return { data: processedData };
    } catch (error) {
      console.error('Get item status error:', error);
      throw error;
    }
  },
  
  createOrUpdateItemStatus: async (itemData: any) => {
    try {
      const { Branch_Code, Part_No, ...otherData } = itemData;
      
      // Generate Part_Branch key
      const Part_Branch = `${Branch_Code}-${Part_No}`;
      
      // Check if item status already exists
      const { data: existingItem, error: checkError } = await supabase
        .from('item_status')
        .select('part_branch')
        .eq('branch_code', Branch_Code)
        .eq('part_no', Part_No)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      const currentTime = Date.now();
      
      if (existingItem) {
        // Update existing item status
        const { data, error } = await supabase
          .from('item_status')
          .update({
            part_a: otherData.Part_A,
            part_b: otherData.Part_B,
            part_c: otherData.Part_C,
            part_max: otherData.Part_Max,
            part_rack: otherData.Part_Rack,
            narr: otherData.Narr,
            last_sync: currentTime
          })
          .eq('branch_code', Branch_Code)
          .eq('part_no', Part_No)
          .select()
          .single();
        
        if (error) throw error;
        
        return {
          data: {
            message: 'Item status updated successfully'
          }
        };
      } else {
        // Create new item status
        const { data, error } = await supabase
          .from('item_status')
          .insert({
            branch_code: Branch_Code,
            part_no: Part_No,
            part_branch: Part_Branch,
            part_a: otherData.Part_A,
            part_b: otherData.Part_B,
            part_c: otherData.Part_C,
            part_max: otherData.Part_Max,
            part_rack: otherData.Part_Rack,
            narr: otherData.Narr,
            last_sync: currentTime
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return {
          data: {
            message: 'Item status created successfully',
            part_branch: Part_Branch
          }
        };
      }
    } catch (error) {
      console.error('Create/Update item status error:', error);
      throw error;
    }
  },
  
  updateStockLevels: async (branchCode: string, partNo: string, stockData: any) => {
    try {
      const { data, error } = await supabase
        .from('item_status')
        .update({
          part_a: stockData.Part_A || '0',
          part_b: stockData.Part_B || '0',
          part_c: stockData.Part_C || '0',
          narr: stockData.Narr || '',
          last_sync: Date.now()
        })
        .eq('branch_code', branchCode)
        .eq('part_no', partNo)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Stock levels updated successfully'
        }
      };
    } catch (error) {
      console.error('Update stock levels error:', error);
      throw error;
    }
  },
  
  updateRackLocation: async (branchCode: string, partNo: string, rackData: any) => {
    try {
      const { data, error } = await supabase
        .from('item_status')
        .update({
          part_rack: rackData.Part_Rack || '',
          last_sync: Date.now()
        })
        .eq('branch_code', branchCode)
        .eq('part_no', partNo)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Rack location updated successfully'
        }
      };
    } catch (error) {
      console.error('Update rack location error:', error);
      throw error;
    }
  },
  
  recordSale: async (branchCode: string, partNo: string, saleData: any) => {
    try {
      const { data, error } = await supabase
        .from('item_status')
        .update({
          last_sale: Date.now(),
          narr: saleData.notes || 'Sale recorded',
          last_sync: Date.now()
        })
        .eq('branch_code', branchCode)
        .eq('part_no', partNo)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Sale transaction recorded successfully'
        }
      };
    } catch (error) {
      console.error('Record sale error:', error);
      throw error;
    }
  },
  
  recordPurchase: async (branchCode: string, partNo: string, purchaseData: any) => {
    try {
      const { data, error } = await supabase
        .from('item_status')
        .update({
          last_purchase: Date.now(),
          narr: purchaseData.notes || 'Purchase recorded',
          last_sync: Date.now()
        })
        .eq('branch_code', branchCode)
        .eq('part_no', partNo)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Purchase transaction recorded successfully'
        }
      };
    } catch (error) {
      console.error('Record purchase error:', error);
      throw error;
    }
  },
  
  getLowStockItems: async (params?: any) => {
    try {
      let query = supabase
        .from('item_status')
        .select(`
          *,
          stores!inner(branch_name, company_name),
          parts!inner(part_name, part_price)
        `);
      
      // Apply filters
      if (params?.branch_code) {
        query = query.eq('branch_code', params.branch_code);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process data to add calculated fields and filter for low stock
      const processedData = data
        .map(item => {
          const partA = parseInt(item.part_a || '0');
          const partB = parseInt(item.part_b || '0');
          const partC = parseInt(item.part_c || '0');
          const maxStock = parseInt(item.part_max || '1');
          const totalStock = partA + partB + partC;
          const stockPercentage = Math.round((totalStock / maxStock) * 100);
          
          return {
            ...item,
            Branch_Code: item.branch_code,
            Part_No: item.part_no,
            Part_Branch: item.part_branch,
            Part_Name: item.parts?.part_name,
            Part_Price: item.parts?.part_price,
            Branch_Name: item.stores?.branch_name,
            total_stock: totalStock,
            max_stock: maxStock,
            stock_percentage: stockPercentage,
            urgency: stockPercentage < 10 ? 'critical' : 'low'
          };
        })
        .filter(item => (item.total_stock / item.max_stock) < 0.2);
      
      return { data: processedData };
    } catch (error) {
      console.error('Get low stock error:', error);
      throw error;
    }
  },
  
  getItemStatusStats: async (branchCode: string) => {
    try {
      const { data, error } = await supabase
        .from('item_status')
        .select('*')
        .eq('branch_code', branchCode);
      
      if (error) throw error;
      
      // Calculate statistics
      const totalItems = data.length;
      let totalStock = 0;
      let lowStockItems = 0;
      let outOfStockItems = 0;
      const uniqueRacks = new Set();
      
      data.forEach(item => {
        const partA = parseInt(item.part_a || '0');
        const partB = parseInt(item.part_b || '0');
        const partC = parseInt(item.part_c || '0');
        const maxStock = parseInt(item.part_max || '1');
        const itemTotalStock = partA + partB + partC;
        
        totalStock += itemTotalStock;
        
        if (itemTotalStock < maxStock * 0.2) {
          lowStockItems++;
        }
        
        if (itemTotalStock === 0) {
          outOfStockItems++;
        }
        
        if (item.part_rack) {
          uniqueRacks.add(item.part_rack);
        }
      });
      
      const stats = {
        total_items: totalItems,
        total_stock: totalStock,
        avg_stock: totalItems > 0 ? Math.round(totalStock / totalItems) : 0,
        low_stock_items: lowStockItems,
        out_of_stock_items: outOfStockItems,
        unique_racks: uniqueRacks.size
      };
      
      return { data: stats };
    } catch (error) {
      console.error('Get item status stats error:', error);
      throw error;
    }
  }
};

// Orders API
export const ordersAPI = {
  getOrders: async (params?: any) => {
    try {
      let query = supabase
        .from('order_master')
        .select(`
          *,
          retailers!left(retailer_name, contact_person),
          stores!left(branch_name, company_name)
        `);
      
      // Apply filters
      if (params?.status) {
        query = query.eq('order_status', params.status);
      }
      
      if (params?.urgent !== undefined) {
        query = query.eq('urgent_status', params.urgent === 'true');
      }
      
      if (params?.retailer_id) {
        query = query.eq('retailer_id', params.retailer_id);
      }
      
      if (params?.branch) {
        query = query.eq('branch', params.branch);
      }
      
      if (params?.start_date) {
        query = query.gte('place_date', new Date(params.start_date).getTime());
      }
      
      if (params?.end_date) {
        query = query.lte('place_date', new Date(params.end_date).getTime());
      }
      
      // Pagination
      const page = params?.page ? parseInt(params.page) : 1;
      const limit = params?.limit ? parseInt(params.limit) : 50;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end).order('place_date', { ascending: false });
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('order_master')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Transform data to match expected format
      const transformedData = data.map(order => ({
        Order_Id: order.order_id,
        CRMOrderId: order.crm_order_id,
        Retailer_Id: order.retailer_id,
        Transport_Id: order.transport_id,
        TransportBy: order.transport_by,
        Place_By: order.place_by,
        Place_Date: order.place_date,
        Confirm_By: order.confirm_by,
        Confirm_Date: order.confirm_date,
        Pick_By: order.pick_by,
        Pick_Date: order.pick_date,
        Pack_By: order.pack_by,
        Checked_By: order.checked_by,
        Pack_Date: order.pack_date,
        Delivered_By: order.delivered_by,
        Delivered_Date: order.delivered_date,
        Order_Status: order.order_status,
        Branch: order.branch,
        DispatchId: order.dispatch_id,
        Remark: order.remark,
        PO_Number: order.po_number,
        PO_Date: order.po_date,
        Urgent_Status: order.urgent_status,
        Longitude: order.longitude,
        IsSync: order.is_sync,
        Latitude: order.latitude,
        Last_Sync: order.last_sync,
        Retailer_Name: order.retailers?.retailer_name,
        Contact_Person: order.retailers?.contact_person,
        Branch_Name: order.stores?.branch_name,
        Company_Name: order.stores?.company_name
      }));
      
      return {
        data: {
          orders: transformedData,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },
  
  getOrder: async (id: number) => {
    try {
      // Get order master
      const { data: orderData, error: orderError } = await supabase
        .from('order_master')
        .select(`
          *,
          retailers!left(retailer_name, contact_person, retailer_email),
          stores!left(branch_name, company_name)
        `)
        .eq('order_id', id)
        .single();
      
      if (orderError) throw orderError;
      
      // Get order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          parts!left(part_name, part_image)
        `)
        .eq('order_id', id);
      
      if (itemsError) throw itemsError;
      
      // Transform data to match expected format
      const transformedOrder = {
        Order_Id: orderData.order_id,
        CRMOrderId: orderData.crm_order_id,
        Retailer_Id: orderData.retailer_id,
        Transport_Id: orderData.transport_id,
        TransportBy: orderData.transport_by,
        Place_By: orderData.place_by,
        Place_Date: orderData.place_date,
        Confirm_By: orderData.confirm_by,
        Confirm_Date: orderData.confirm_date,
        Pick_By: orderData.pick_by,
        Pick_Date: orderData.pick_date,
        Pack_By: orderData.pack_by,
        Checked_By: orderData.checked_by,
        Pack_Date: orderData.pack_date,
        Delivered_By: orderData.delivered_by,
        Delivered_Date: orderData.delivered_date,
        Order_Status: orderData.order_status,
        Branch: orderData.branch,
        DispatchId: orderData.dispatch_id,
        Remark: orderData.remark,
        PO_Number: orderData.po_number,
        PO_Date: orderData.po_date,
        Urgent_Status: orderData.urgent_status,
        Longitude: orderData.longitude,
        IsSync: orderData.is_sync,
        Latitude: orderData.latitude,
        Last_Sync: orderData.last_sync,
        Retailer_Name: orderData.retailers?.retailer_name,
        Contact_Person: orderData.retailers?.contact_person,
        Retailer_Email: orderData.retailers?.retailer_email,
        Branch_Name: orderData.stores?.branch_name,
        Company_Name: orderData.stores?.company_name,
        items: itemsData.map(item => ({
          Order_Item_Id: item.order_item_id,
          Order_Id: item.order_id,
          Order_Srl: item.order_srl,
          Part_Admin: item.part_admin,
          Part_Salesman: item.part_salesman,
          Order_Qty: item.order_qty,
          Dispatch_Qty: item.dispatch_qty,
          Pick_Date: item.pick_date,
          Pick_By: item.pick_by,
          OrderItemStatus: item.order_item_status,
          PlaceDate: item.place_date,
          RetailerId: item.retailer_id,
          ItemAmount: item.item_amount,
          SchemeDisc: item.scheme_disc,
          AdditionalDisc: item.additional_disc,
          Discount: item.discount,
          MRP: item.mrp,
          FirstOrderDate: item.first_order_date,
          Urgent_Status: item.urgent_status,
          Last_Sync: item.last_sync,
          Part_Name: item.parts?.part_name,
          Part_Image: item.parts?.part_image
        }))
      };
      
      return { data: transformedOrder };
    } catch (error) {
      console.error('Get order error:', error);
      throw error;
    }
  },
  
  createOrder: async (orderData: any) => {
    try {
      // Generate CRM Order ID
      const year = new Date().getFullYear();
      const crmOrderId = `CRM-${year}-${Date.now().toString().slice(-6)}`;
      
      // Start a transaction
      const { data: orderResult, error: orderError } = await supabase
        .from('order_master')
        .insert({
          crm_order_id: crmOrderId,
          retailer_id: orderData.retailer_id,
          place_by: orderData.place_by || 'System',
          place_date: Date.now(),
          order_status: 'New',
          branch: orderData.branch || 'UNKNOWN',
          remark: orderData.remark || null,
          po_number: orderData.po_number || null,
          po_date: orderData.po_date ? new Date(orderData.po_date).getTime() : null,
          urgent_status: orderData.urgent || false,
          is_sync: false,
          last_sync: Date.now()
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Insert order items
      const orderItems = orderData.items.map((item: any, index: number) => {
        const itemAmount = Math.round(
          item.mrp * item.quantity * 
          (1 - (item.basic_discount + item.scheme_discount + item.additional_discount) / 100)
        );
        
        return {
          order_id: orderResult.order_id,
          order_srl: index + 1,
          part_admin: item.part_number,
          part_salesman: item.part_name || item.part_number,
          order_qty: item.quantity,
          dispatch_qty: 0,
          order_item_status: 'New',
          place_date: Date.now(),
          retailer_id: orderData.retailer_id,
          item_amount: itemAmount,
          scheme_disc: item.scheme_discount || 0,
          additional_disc: item.additional_discount || 0,
          discount: item.basic_discount || 0,
          mrp: item.mrp,
          first_order_date: Date.now(),
          urgent_status: item.urgent || false,
          last_sync: Date.now()
        };
      });
      
      const { data: itemsResult, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();
      
      if (itemsError) throw itemsError;
      
      // Get the created order with details
      const { data: createdOrder, error: getOrderError } = await supabase
        .from('order_master')
        .select(`
          *,
          retailers!left(retailer_name, contact_person)
        `)
        .eq('order_id', orderResult.order_id)
        .single();
      
      if (getOrderError) throw getOrderError;
      
      // Transform data to match expected format
      const transformedOrder = {
        Order_Id: createdOrder.order_id,
        CRMOrderId: createdOrder.crm_order_id,
        Retailer_Id: createdOrder.retailer_id,
        Place_By: createdOrder.place_by,
        Place_Date: createdOrder.place_date,
        Order_Status: createdOrder.order_status,
        Branch: createdOrder.branch,
        Remark: createdOrder.remark,
        PO_Number: createdOrder.po_number,
        PO_Date: createdOrder.po_date,
        Urgent_Status: createdOrder.urgent_status,
        Retailer_Name: createdOrder.retailers?.retailer_name,
        Contact_Person: createdOrder.retailers?.contact_person
      };
      
      return {
        data: {
          message: 'Order created successfully',
          order: transformedOrder
        }
      };
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },
  
  updateOrderStatus: async (id: number, status: string, notes?: string) => {
    try {
      const updateData: any = {
        order_status: status,
        last_sync: Date.now()
      };
      
      // Add status-specific fields
      const currentTime = Date.now();
      const userName = (await supabase.auth.getUser()).data.user?.email || 'System';
      
      switch (status) {
        case 'Processing':
          updateData.confirm_by = userName;
          updateData.confirm_date = currentTime;
          break;
        case 'Picked':
          updateData.pick_by = userName;
          updateData.pick_date = currentTime;
          break;
        case 'Dispatched':
          updateData.pack_by = userName;
          updateData.pack_date = currentTime;
          break;
        case 'Completed':
          updateData.delivered_by = userName;
          updateData.delivered_date = currentTime;
          break;
      }
      
      if (notes) {
        updateData.remark = notes;
      }
      
      const { data, error } = await supabase
        .from('order_master')
        .update(updateData)
        .eq('order_id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Order status updated successfully'
        }
      };
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  },
  
  getOrderStats: async () => {
    try {
      // Get all orders
      const { data: orders, error } = await supabase
        .from('order_master')
        .select('*');
      
      if (error) throw error;
      
      // Calculate statistics
      const totalOrders = orders.length;
      const newOrders = orders.filter(order => order.order_status === 'New').length;
      const processingOrders = orders.filter(order => order.order_status === 'Processing').length;
      const completedOrders = orders.filter(order => order.order_status === 'Completed').length;
      const urgentOrders = orders.filter(order => order.urgent_status === true).length;
      
      // Get unique retailers
      const uniqueRetailers = new Set(orders.map(order => order.retailer_id));
      
      const stats = {
        total_orders: totalOrders,
        new_orders: newOrders,
        processing_orders: processingOrders,
        completed_orders: completedOrders,
        urgent_orders: urgentOrders,
        unique_retailers: uniqueRetailers.size
      };
      
      return { data: stats };
    } catch (error) {
      console.error('Get order stats error:', error);
      throw error;
    }
  }
};

// Regions API
export const regionsAPI = {
  getRegions: async (params?: any) => {
    try {
      let query = supabase.from('regions').select('*');
      
      // Apply filters
      if (params?.search) {
        query = query.or(`id.ilike.%${params.search}%,name.ilike.%${params.search}%`);
      }
      
      if (params?.store_id && params.store_id !== 'all') {
        query = query.eq('store_id', params.store_id);
      }
      
      // Pagination
      const page = params?.page ? parseInt(params.page) : 1;
      const limit = params?.limit ? parseInt(params.limit) : 50;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      query = query.range(start, end);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Get total count
      const { count: total, error: countError } = await supabase
        .from('regions')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      return {
        data: {
          regions: data,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Get regions error:', error);
      throw error;
    }
  },
  
  getRegion: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { data };
    } catch (error) {
      console.error('Get region error:', error);
      throw error;
    }
  },
  
  createRegion: async (regionData: any) => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .insert({
          id: regionData.id,
          name: regionData.name,
          store_id: regionData.store_id,
          created_by: regionData.created_by
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Region created successfully',
          region: data
        }
      };
    } catch (error) {
      console.error('Create region error:', error);
      throw error;
    }
  },
  
  updateRegion: async (id: string, regionData: any) => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .update({
          name: regionData.name,
          store_id: regionData.store_id
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Region updated successfully',
          region: data
        }
      };
    } catch (error) {
      console.error('Update region error:', error);
      throw error;
    }
  },
  
  deleteRegion: async (id: string) => {
    try {
      const { error } = await supabase
        .from('regions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return {
        data: {
          message: 'Region deleted successfully'
        }
      };
    } catch (error) {
      console.error('Delete region error:', error);
      throw error;
    }
  }
};

// Reports API
export const reportsAPI = {
  getOrderReport: async (params: any) => {
    try {
      let query = supabase
        .from('order_master')
        .select(`
          *,
          retailers!left(retailer_name, contact_person),
          stores!left(branch_name, company_name)
        `);
      
      // Apply filters
      if (params.status && params.status !== 'all') {
        query = query.eq('order_status', params.status);
      }
      
      if (params.start_date) {
        query = query.gte('place_date', new Date(params.start_date).getTime());
      }
      
      if (params.end_date) {
        query = query.lte('place_date', new Date(params.end_date).getTime());
      }
      
      // Execute query
      const { data: orders, error } = await query;
      
      if (error) throw error;
      
      // Get order items
      const orderIds = orders.map(order => order.order_id);
      
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (itemsError) throw itemsError;
      
      // Transform data to match expected format
      const transformedOrders = orders.map(order => ({
        id: order.order_id.toString(),
        retailer_id: order.retailer_id?.toString() || '',
        salesman_id: order.place_by || '',
        store_id: order.branch || '',
        status: order.order_status?.toLowerCase() || 'pending',
        total_price: orderItems
          .filter(item => item.order_id === order.order_id)
          .reduce((sum, item) => sum + (item.item_amount || 0), 0) / 100,
        created_at: order.place_date ? new Date(order.place_date).toISOString() : new Date().toISOString(),
        items: orderItems
          .filter(item => item.order_id === order.order_id)
          .map(item => ({
            id: item.order_item_id.toString(),
            order_id: item.order_id?.toString() || '',
            part_id: item.part_admin || '',
            quantity: item.order_qty || 0,
            price_per_unit: (item.mrp || 0) / 100,
            part_name: item.part_salesman || ''
          }))
      }));
      
      return { data: transformedOrders };
    } catch (error) {
      console.error('Get order report error:', error);
      throw error;
    }
  },
  
  getInventoryReport: async (params: any) => {
    try {
      let query = supabase
        .from('item_status')
        .select(`
          *,
          stores!inner(branch_name, company_name),
          parts!inner(part_name, part_price, part_min_qty, part_category, focus_group)
        `);
      
      // Apply filters
      if (params.branch_code) {
        query = query.eq('branch_code', params.branch_code);
      }
      
      if (params.category) {
        query = query.eq('parts.part_category', params.category);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process data to add calculated fields
      const processedData = data.map(item => {
        const partA = parseInt(item.part_a || '0');
        const partB = parseInt(item.part_b || '0');
        const partC = parseInt(item.part_c || '0');
        const maxStock = parseInt(item.part_max || '1');
        const totalStock = partA + partB + partC;
        const stockPercentage = Math.round((totalStock / maxStock) * 100);
        
        let stockLevel = 'good';
        if (stockPercentage < 20) stockLevel = 'critical';
        else if (stockPercentage < 40) stockLevel = 'low';
        else if (stockPercentage < 70) stockLevel = 'medium';
        
        return {
          branch_code: item.branch_code,
          part_no: item.part_no,
          part_name: item.parts?.part_name,
          part_price: item.parts?.part_price,
          branch_name: item.stores?.branch_name,
          company_name: item.stores?.company_name,
          part_rack: item.part_rack,
          total_stock: totalStock,
          max_stock: maxStock,
          stock_percentage: stockPercentage,
          stock_level: stockLevel,
          last_sale: item.last_sale,
          last_purchase: item.last_purchase,
          category: item.parts?.part_category,
          focus_group: item.parts?.focus_group
        };
      });
      
      return { data: processedData };
    } catch (error) {
      console.error('Get inventory report error:', error);
      throw error;
    }
  },
  
  getSalesReport: async (params: any) => {
    try {
      let query = supabase
        .from('order_master')
        .select(`
          *,
          retailers!left(retailer_name, contact_person),
          stores!left(branch_name, company_name)
        `);
      
      // Apply filters
      if (params.status && params.status !== 'all') {
        query = query.eq('order_status', params.status);
      }
      
      if (params.start_date) {
        query = query.gte('place_date', new Date(params.start_date).getTime());
      }
      
      if (params.end_date) {
        query = query.lte('place_date', new Date(params.end_date).getTime());
      }
      
      if (params.branch) {
        query = query.eq('branch', params.branch);
      }
      
      // Execute query
      const { data: orders, error } = await query;
      
      if (error) throw error;
      
      // Get order items
      const orderIds = orders.map(order => order.order_id);
      
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          parts!left(part_name, part_category)
        `)
        .in('order_id', orderIds);
      
      if (itemsError) throw itemsError;
      
      // Calculate sales by category
      const salesByCategory: Record<string, number> = {};
      const salesByRetailer: Record<string, number> = {};
      const salesByStore: Record<string, number> = {};
      
      orderItems.forEach(item => {
        const category = item.parts?.part_category || 'Uncategorized';
        const retailerId = item.retailer_id?.toString() || 'Unknown';
        const orderId = item.order_id;
        const order = orders.find(o => o.order_id === orderId);
        const storeId = order?.branch || 'Unknown';
        
        salesByCategory[category] = (salesByCategory[category] || 0) + (item.item_amount || 0);
        salesByRetailer[retailerId] = (salesByRetailer[retailerId] || 0) + (item.item_amount || 0);
        salesByStore[storeId] = (salesByStore[storeId] || 0) + (item.item_amount || 0);
      });
      
      // Calculate total sales
      const totalSales = Object.values(salesByCategory).reduce((sum, amount) => sum + amount, 0);
      
      // Format data for report
      const report = {
        totalSales,
        orderCount: orders.length,
        averageOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
        salesByCategory: Object.entries(salesByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSales > 0 ? (amount / totalSales) * 100 : 0
        })),
        salesByRetailer: Object.entries(salesByRetailer).map(([retailerId, amount]) => {
          const retailer = orders.find(o => o.retailer_id?.toString() === retailerId)?.retailers;
          return {
            retailerId,
            retailerName: retailer?.retailer_name || 'Unknown',
            amount,
            percentage: totalSales > 0 ? (amount / totalSales) * 100 : 0
          };
        }),
        salesByStore: Object.entries(salesByStore).map(([storeId, amount]) => {
          const store = orders.find(o => o.branch === storeId)?.stores;
          return {
            storeId,
            storeName: store?.branch_name || 'Unknown',
            amount,
            percentage: totalSales > 0 ? (amount / totalSales) * 100 : 0
          };
        }),
        timeRange: {
          start: params.start_date,
          end: params.end_date
        }
      };
      
      return { data: report };
    } catch (error) {
      console.error('Get sales report error:', error);
      throw error;
    }
  }
};

// File upload helper
export const uploadFile = async (file: File, bucket: string) => {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return { data: { url: urlData.publicUrl } };
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

export default {
  authAPI,
  usersAPI,
  companiesAPI,
  storesAPI,
  retailersAPI,
  partsAPI,
  itemStatusAPI,
  ordersAPI,
  regionsAPI,
  reportsAPI,
  uploadFile
};