-- Companies table
CREATE TABLE companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    logo_url TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores/Branches table
CREATE TABLE stores (
    Branch_Code VARCHAR(15) PRIMARY KEY,
    Branch_Name VARCHAR(255),
    Company_Name VARCHAR(255),
    Branch_Address TEXT,
    Branch_Phone VARCHAR(50),
    Branch_Email VARCHAR(255),
    Branch_Manager VARCHAR(255),
    Branch_URL VARCHAR(255),
    Branch_Manager_Mobile VARCHAR(50),
    store_image TEXT,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'storeman' CHECK (role IN ('super_admin','admin','manager','storeman','salesman','retailer')),
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE SET NULL,
    store_id VARCHAR(15) REFERENCES stores(Branch_Code) ON DELETE SET NULL,
    region_id VARCHAR(50),
    retailer_id INT,
    profile_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retailers table
CREATE TABLE retailers (
    Retailer_Id SERIAL PRIMARY KEY,
    RetailerCRMId VARCHAR(25),
    Retailer_Name VARCHAR(255),
    RetailerImage TEXT,
    Retailer_Address TEXT,
    Retailer_Mobile VARCHAR(50),
    Retailer_TFAT_Id VARCHAR(50),
    Retailer_Status SMALLINT DEFAULT 1,
    Area_Name VARCHAR(255),
    Contact_Person VARCHAR(255),
    Pincode VARCHAR(20),
    Mobile_Order VARCHAR(50),
    Mobile_Account VARCHAR(50),
    Owner_Mobile VARCHAR(50),
    Area_Id INT,
    GST_No VARCHAR(50),
    Credit_Limit DECIMAL(15,2) DEFAULT 0,
    Type_Id INT,
    Confirm SMALLINT DEFAULT 0,
    Retailer_Tour_Id INT,
    Retailer_Email VARCHAR(255),
    latitude DOUBLE PRECISION,
    logitude DOUBLE PRECISION,
    Last_Sync BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts table
CREATE TABLE parts (
    Part_Number VARCHAR(100) PRIMARY KEY,
    Part_Name VARCHAR(255),
    Part_Price INT,
    Part_Discount VARCHAR(20),
    Part_Image TEXT,
    Part_MinQty INT DEFAULT 0,
    Part_BasicDisc INT DEFAULT 0,
    Part_SchemeDisc INT DEFAULT 0,
    Part_AdditionalDisc INT DEFAULT 0,
    Part_Application TEXT,
    GuruPoint INT DEFAULT 0,
    ChampionPoint INT DEFAULT 0,
    Alternate_PartNumber TEXT,
    T1 INT DEFAULT 0,
    T2 INT DEFAULT 0,
    T3 INT DEFAULT 0,
    T4 INT DEFAULT 0,
    T5 INT DEFAULT 0,
    Is_Order_Pad SMALLINT DEFAULT 1,
    Item_Status VARCHAR(50) DEFAULT 'Active',
    Order_Pad_Category INT DEFAULT 1,
    Previous_PartNumber VARCHAR(100),
    Focus_Group VARCHAR(100),
    Part_Catagory VARCHAR(100),
    Last_Sync BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Master table
CREATE TABLE order_master (
    Order_Id SERIAL PRIMARY KEY,
    CRMOrderId VARCHAR(25),
    Retailer_Id INT REFERENCES retailers(Retailer_Id) ON DELETE SET NULL,
    Transport_Id INT,
    TransportBy VARCHAR(50),
    Place_By VARCHAR(50),
    Place_Date BIGINT,
    Confirm_By VARCHAR(50),
    Confirm_Date BIGINT,
    Pick_By VARCHAR(50),
    Pick_Date BIGINT,
    Pack_By VARCHAR(50),
    Checked_By VARCHAR(50),
    Pack_Date BIGINT,
    Delivered_By VARCHAR(50),
    Delivered_Date BIGINT,
    Order_Status VARCHAR(50) DEFAULT 'New',
    Branch VARCHAR(15) REFERENCES stores(Branch_Code) ON DELETE SET NULL,
    DispatchId INT,
    Remark TEXT,
    PO_Number VARCHAR(50),
    PO_Date BIGINT,
    Urgent_Status BOOLEAN DEFAULT FALSE,
    Longitude DOUBLE PRECISION,
    IsSync BOOLEAN DEFAULT FALSE,
    Latitude DOUBLE PRECISION,
    Last_Sync BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items table
CREATE TABLE order_items (
    Order_Item_Id SERIAL PRIMARY KEY,
    Order_Id INT REFERENCES order_master(Order_Id) ON DELETE CASCADE,
    Order_Srl INT,
    Part_Admin VARCHAR(100) REFERENCES parts(Part_Number) ON DELETE SET NULL,
    Part_Salesman VARCHAR(100),
    Order_Qty INT DEFAULT 0,
    Dispatch_Qty INT DEFAULT 0,
    Pick_Date BIGINT,
    Pick_By VARCHAR(100),
    OrderItemStatus VARCHAR(25),
    PlaceDate BIGINT,
    RetailerId INT REFERENCES retailers(Retailer_Id) ON DELETE SET NULL,
    ItemAmount INT,
    SchemeDisc INT DEFAULT 0,
    AdditionalDisc INT DEFAULT 0,
    Discount INT DEFAULT 0,
    MRP INT,
    FirstOrderDate BIGINT,
    Urgent_Status BOOLEAN DEFAULT FALSE,
    Last_Sync BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regions table
CREATE TABLE regions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    store_id VARCHAR(15) REFERENCES stores(Branch_Code) ON DELETE SET NULL,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item Status table
CREATE TABLE item_status (
    Branch_Code VARCHAR(10) NOT NULL REFERENCES stores(Branch_Code) ON DELETE CASCADE,
    Part_No VARCHAR(50) NOT NULL REFERENCES parts(Part_Number) ON DELETE CASCADE,
    Part_Branch VARCHAR(50) NOT NULL PRIMARY KEY,
    Part_A VARCHAR(10),
    Part_B VARCHAR(10),
    Part_C VARCHAR(10),
    Part_Max VARCHAR(10),
    Part_Rack VARCHAR(20),
    LastSale BIGINT,
    LastPurchase BIGINT,
    Narr VARCHAR(50),
    Last_Sync BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_store ON users(store_id);
CREATE INDEX idx_retailers_status ON retailers(Retailer_Status);
CREATE INDEX idx_retailers_area ON retailers(Area_Id);
CREATE INDEX idx_parts_status ON parts(Item_Status);
CREATE INDEX idx_parts_category ON parts(Part_Catagory);
CREATE INDEX idx_orders_status ON order_master(Order_Status);
CREATE INDEX idx_orders_retailer ON order_master(Retailer_Id);
CREATE INDEX idx_orders_branch ON order_master(Branch);
CREATE INDEX idx_orders_date ON order_master(Place_Date);
CREATE INDEX idx_order_items_order ON order_items(Order_Id);
CREATE INDEX idx_order_items_part ON order_items(Part_Admin);
CREATE INDEX idx_item_status_branch ON item_status(Branch_Code);
CREATE INDEX idx_item_status_part ON item_status(Part_No);
CREATE INDEX idx_item_status_rack ON item_status(Part_Rack);

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_status ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow anon+authenticated full access (edge function uses service role key)
CREATE POLICY "companies_all" ON companies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "stores_all" ON stores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "users_all" ON users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "retailers_all" ON retailers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "parts_all" ON parts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "orders_all" ON order_master FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "order_items_all" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "regions_all" ON regions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "item_status_all" ON item_status FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);