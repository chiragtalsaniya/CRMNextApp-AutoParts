export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: string;
  store_id?: string;
  region_id?: string;
  retailer_id?: number; // Added for retailer users
  profile_image?: string; // Added for user profile image
  created_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'storeman' | 'salesman' | 'retailer';

export interface Company {
  id: string;
  name: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  logo_url?: string; // Added for company logo
  created_by: string;
  created_at: string;
}

export interface Store {
  Branch_Code: string;
  Branch_Name?: string;
  Company_Name?: string;
  Branch_Address?: string;
  Branch_Phone?: string;
  Branch_Email?: string;
  Branch_Manager?: string;
  Branch_URL?: string;
  Branch_Manager_Mobile?: string;
  store_image?: string; // Replaced Item_Photo_Path with store_image
  company_id?: string;
}

export interface Retailer {
  Retailer_Id: number;
  RetailerCRMId?: string;
  Retailer_Name?: string;
  RetailerImage?: string; // This is the retailer image URL
  Retailer_Address?: string;
  Retailer_Mobile?: string;
  Retailer_TFAT_Id?: string;
  Retailer_Status?: number;
  Area_Name?: string;
  Contact_Person?: string;
  Pincode?: string;
  Mobile_Order?: string;
  Mobile_Account?: string;
  Owner_Mobile?: string;
  Area_Id?: number;
  GST_No?: string;
  Credit_Limit?: number;
  Type_Id?: number;
  Confirm?: number;
  Retailer_Tour_Id?: number;
  Retailer_Email?: string;
  latitude?: number;
  logitude?: number;
  Last_Sync?: number;
}

export interface Part {
  Part_Number: string;
  Part_Name?: string;
  Part_Price?: number;
  Part_Discount?: string;
  Part_Image?: string;
  Part_MinQty?: number;
  Part_BasicDisc?: number;
  Part_SchemeDisc?: number;
  Part_AdditionalDisc?: number;
  Part_Application?: string;
  GuruPoint?: number;
  ChampionPoint?: number;
  Alternate_PartNumber?: string;
  T1?: number;
  T2?: number;
  T3?: number;
  T4?: number;
  T5?: number;
  Is_Order_Pad?: number;
  Item_Status?: string;
  Order_Pad_Category?: number;
  Previous_PartNumber?: string;
  Focus_Group?: string;
  Part_Catagory?: string;
  Last_Sync?: number;
}

export interface Order {
  id: string;
  retailer_id: string;
  salesman_id: string;
  store_id: string;
  status: OrderStatus;
  total_price: number;
  created_at: string;
  items: OrderItem[];
}

export type OrderStatus = 'pending' | 'processing' | 'picked' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  part_id: string;
  quantity: number;
  price_per_unit: number;
  part_name?: string;
}

export interface Transport {
  id: string;
  store_id: string;
  type: string;
  provider: string;
  contact_number: string;
}

export interface Region {
  id: string;
  name: string;
  store_id: string;
  created_by: string;
}

export interface PartCategory {
  id: number;
  name: string;
  description?: string;
}

export interface FocusGroup {
  id: string;
  name: string;
  description?: string;
}