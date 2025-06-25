import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Eye,
  Filter,
  Download,
  Upload,
  BarChart3,
  Warehouse,
  TrendingDown,
  TrendingUp,
  Clock,
  ShoppingCart,
  X,
  Save,
  Plus,
  Minus
} from 'lucide-react';
import { ItemStatus, getStockLevelColor, calculateStockLevel, formatStockDisplay, timestampToDate } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const mockItemStatus: ItemStatus[] = [
  {
    Branch_Code: 'NYC001',
    Part_No: 'SP-001-NGK',
    Part_Branch: 'NYC001-SP-001-NGK',
    Part_A: '50',
    Part_B: '30',
    Part_C: '20',
    Part_Max: '100',
    Part_Rack: 'A-01-001',
    LastSale: 1704067200000,
    LastPurchase: 1703980800000,
    Narr: 'Fast moving item',
    Last_Sync: 1704067200000,
    Branch_Name: 'Manhattan Central Store',
    Company_Name: 'AutoParts Plus',
    Part_Name: 'NGK Spark Plug - Standard',
    Part_Price: 1299,
    Part_Catagory: 'Ignition System',
    Focus_Group: 'Engine Components',
    total_stock: 100,
    max_stock: 100,
    stock_percentage: 100,
    stock_level: 'good'
  },
  {
    Branch_Code: 'NYC001',
    Part_No: 'BP-002-BREMBO',
    Part_Branch: 'NYC001-BP-002-BREMBO',
    Part_A: '25',
    Part_B: '15',
    Part_C: '10',
    Part_Max: '50',
    Part_Rack: 'B-02-003',
    LastSale: 1704153600000,
    LastPurchase: 1704067200000,
    Narr: 'Premium brake pads',
    Last_Sync: 1704153600000,
    Branch_Name: 'Manhattan Central Store',
    Company_Name: 'AutoParts Plus',
    Part_Name: 'Brembo Brake Pads - Front Set',
    Part_Price: 4599,
    Part_Catagory: 'Brake Pads',
    Focus_Group: 'Brake System',
    total_stock: 50,
    max_stock: 50,
    stock_percentage: 100,
    stock_level: 'good'
  },
  {
    Branch_Code: 'NYC002',
    Part_No: 'BP-002-BREMBO',
    Part_Branch: 'NYC002-BP-002-BREMBO',
    Part_A: '5',
    Part_B: '3',
    Part_C: '2',
    Part_Max: '40',
    Part_Rack: 'B-01-001',
    LastSale: 1704412800000,
    LastPurchase: 1704326400000,
    Narr: 'Low stock alert',
    Last_Sync: 1704412800000,
    Branch_Name: 'Brooklyn East Store',
    Company_Name: 'AutoParts Plus',
    Part_Name: 'Brembo Brake Pads - Front Set',
    Part_Price: 4599,
    Part_Catagory: 'Brake Pads',
    Focus_Group: 'Brake System',
    total_stock: 10,
    max_stock: 40,
    stock_percentage: 25,
    stock_level: 'low'
  }
];

export const ItemStatusManagement: React.FC = () => {
  const { user, getAccessibleStores } = useAuth();
  const [itemStatus, setItemStatus] = useState<ItemStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [stockLevelFilter, setStockLevelFilter] = useState('all');
  const [rackFilter, setRackFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemStatus | null>(null);
  const [formData, setFormData] = useState<Partial<ItemStatus>>({});

  const accessibleStores = getAccessibleStores();

  useEffect(() => {
    // Filter based on user access
    let filteredData = mockItemStatus;
    
    if (user?.role !== 'super_admin') {
      filteredData = mockItemStatus.filter(item => 
        accessibleStores.includes(item.Branch_Code)
      );
    }
    
    setItemStatus(filteredData);
  }, [user, accessibleStores]);

  const filteredItems = itemStatus.filter(item => {
    const matchesSearch = 
      item.Part_No.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.Part_Name && item.Part_Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.Part_Rack && item.Part_Rack.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStore = selectedStore === 'all' || item.Branch_Code === selectedStore;
    const matchesStockLevel = stockLevelFilter === 'all' || item.stock_level === stockLevelFilter;
    const matchesRack = !rackFilter || (item.Part_Rack && item.Part_Rack.toLowerCase().includes(rackFilter.toLowerCase()));
    
    return matchesSearch && matchesStore && matchesStockLevel && matchesRack;
  });

  const handleEditItem = (item: ItemStatus) => {
    setSelectedItem(item);
    setFormData({
      Part_A: item.Part_A,
      Part_B: item.Part_B,
      Part_C: item.Part_C,
      Part_Max: item.Part_Max,
      Part_Rack: item.Part_Rack,
      Narr: item.Narr
    });
    setShowEditModal(true);
  };

  const handleViewItem = (item: ItemStatus) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleSaveItem = () => {
    if (selectedItem) {
      setItemStatus(prev => prev.map(item => 
        item.Part_Branch === selectedItem.Part_Branch 
          ? { 
              ...item, 
              ...formData,
              total_stock: parseInt(formData.Part_A || '0') + parseInt(formData.Part_B || '0') + parseInt(formData.Part_C || '0'),
              stock_percentage: Math.round(((parseInt(formData.Part_A || '0') + parseInt(formData.Part_B || '0') + parseInt(formData.Part_C || '0')) / parseInt(formData.Part_Max || '1')) * 100),
              stock_level: calculateStockLevel(
                parseInt(formData.Part_A || '0') + parseInt(formData.Part_B || '0') + parseInt(formData.Part_C || '0'),
                parseInt(formData.Part_Max || '1')
              )
            }
          : item
      ));
      setShowEditModal(false);
      setSelectedItem(null);
      setFormData({});
    }
  };

  const getStockStats = () => {
    const total = filteredItems.length;
    const critical = filteredItems.filter(item => item.stock_level === 'critical').length;
    const low = filteredItems.filter(item => item.stock_level === 'low').length;
    const good = filteredItems.filter(item => item.stock_level === 'good').length;
    
    return { total, critical, low, good };
  };

  const stats = getStockStats();

  const ItemEditModal = () => {
    if (!showEditModal || !selectedItem) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Item Status</h2>
                  <p className="text-gray-600">{selectedItem.Part_No} - {selectedItem.Branch_Code}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Level A</label>
                <input
                  type="number"
                  min="0"
                  value={formData.Part_A || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, Part_A: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Level B</label>
                <input
                  type="number"
                  min="0"
                  value={formData.Part_B || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, Part_B: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Level C</label>
                <input
                  type="number"
                  min="0"
                  value={formData.Part_C || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, Part_C: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Stock</label>
                <input
                  type="number"
                  min="1"
                  value={formData.Part_Max || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, Part_Max: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rack Location</label>
                <input
                  type="text"
                  value={formData.Part_Rack || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, Part_Rack: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  placeholder="A-01-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.Narr || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, Narr: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none resize-none"
                placeholder="Add notes about this item..."
              />
            </div>

            {/* Stock Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Stock Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Total Stock</p>
                  <p className="text-blue-900 font-semibold">
                    {(parseInt(formData.Part_A || '0') + parseInt(formData.Part_B || '0') + parseInt(formData.Part_C || '0'))} units
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">Stock Percentage</p>
                  <p className="text-blue-900 font-semibold">
                    {Math.round(((parseInt(formData.Part_A || '0') + parseInt(formData.Part_B || '0') + parseInt(formData.Part_C || '0')) / parseInt(formData.Part_Max || '1')) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveItem}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ItemViewModal = () => {
    if (!showViewModal || !selectedItem) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedItem.Part_Name}</h2>
                  <p className="text-gray-600">{selectedItem.Part_No} - {selectedItem.Branch_Name}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStockLevelColor(selectedItem.stock_level)}`}>
                    {selectedItem.stock_level?.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Stock Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total Stock</p>
                    <p className="text-2xl font-bold text-blue-900">{selectedItem.total_stock}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Stock %</p>
                    <p className="text-2xl font-bold text-green-900">{selectedItem.stock_percentage}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Max Stock</p>
                    <p className="text-2xl font-bold text-purple-900">{selectedItem.max_stock}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">Rack</p>
                    <p className="text-lg font-bold text-orange-900">{selectedItem.Part_Rack || 'N/A'}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Stock Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-600">Level A</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedItem.Part_A || '0'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-600">Level B</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedItem.Part_B || '0'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-600">Level C</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedItem.Part_C || '0'}</p>
                </div>
              </div>
            </div>

            {/* Part Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Part Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Category</p>
                    <p className="text-gray-900">{selectedItem.Part_Catagory || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Focus Group</p>
                    <p className="text-gray-900">{selectedItem.Focus_Group || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Price</p>
                    <p className="text-gray-900">${((selectedItem.Part_Price || 0) / 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
                <div className="space-y-3">
                  {selectedItem.LastSale && (
                    <div className="flex items-center space-x-3">
                      <ShoppingCart className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Sale</p>
                        <p className="text-gray-900">{format(timestampToDate(selectedItem.LastSale)!, 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedItem.LastPurchase && (
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Purchase</p>
                        <p className="text-gray-900">{format(timestampToDate(selectedItem.LastPurchase)!, 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedItem.Last_Sync && (
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Sync</p>
                        <p className="text-gray-900">{format(timestampToDate(selectedItem.Last_Sync)!, 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedItem.Narr && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedItem.Narr}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowViewModal(false);
                handleEditItem(selectedItem);
              }}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Item</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Status Management</h1>
          <p className="text-gray-600">Track part status and stock levels across all store locations</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Import</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.low}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Good Stock</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.good}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-[#003366]" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search parts or racks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            />
          </div>
          
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Stores</option>
            {accessibleStores.map(storeId => (
              <option key={storeId} value={storeId}>{storeId}</option>
            ))}
          </select>

          <select
            value={stockLevelFilter}
            onChange={(e) => setStockLevelFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Stock Levels</option>
            <option value="critical">Critical</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="good">Good</option>
          </select>

          <input
            type="text"
            placeholder="Filter by rack..."
            value={rackFilter}
            onChange={(e) => setRackFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          />

          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredItems.length}</span> items found
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Levels</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rack</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.Part_Branch} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#003366] rounded-lg flex items-center justify-center mr-3">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.Part_Name}</div>
                        <div className="text-sm text-gray-500">{item.Part_No}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Warehouse className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">{item.Branch_Name}</div>
                        <div className="text-sm text-gray-500">{item.Branch_Code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">
                        Total: {item.total_stock} / {item.max_stock}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatStockDisplay(item.Part_A, item.Part_B, item.Part_C)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item.stock_level === 'critical' ? 'bg-red-500' :
                            item.stock_level === 'low' ? 'bg-orange-500' :
                            item.stock_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(item.stock_percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{item.Part_Rack || 'Not assigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockLevelColor(item.stock_level)}`}>
                      {item.stock_level === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {item.stock_level?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.LastSale ? format(timestampToDate(item.LastSale)!, 'MMM dd') : 'No sales'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewItem(item)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditItem(item)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ItemEditModal />
      <ItemViewModal />
    </div>
  );
};