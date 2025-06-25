import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  Phone, 
  Mail, 
  MapPin,
  Store,
  Eye,
  X,
  Upload,
  Download,
  Filter,
  Building2,
  CreditCard,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  User,
  Hash,
  DollarSign
} from 'lucide-react';
import { Retailer } from '../../types';

const mockRetailers: Retailer[] = [
  {
    Retailer_Id: 1,
    RetailerCRMId: 'CRM001',
    Retailer_Name: 'Downtown Auto Parts',
    RetailerImage: 'https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=400',
    Retailer_Address: '123 Main St, New York, NY 10001',
    Retailer_Mobile: '+1 (555) 123-4567',
    Retailer_TFAT_Id: 'TFAT001',
    Retailer_Status: 1,
    Area_Name: 'Manhattan Downtown',
    Contact_Person: 'Michael Johnson',
    Pincode: '10001',
    Mobile_Order: '+1 (555) 123-4568',
    Mobile_Account: '+1 (555) 123-4569',
    Owner_Mobile: '+1 (555) 123-4570',
    Area_Id: 1,
    GST_No: 'GST123456789',
    Credit_Limit: 50000,
    Type_Id: 1,
    Confirm: 1,
    Retailer_Tour_Id: 1,
    Retailer_Email: 'michael@downtownauto.com',
    latitude: 40.7128,
    logitude: -74.0060,
    Last_Sync: 1704067200000
  },
  {
    Retailer_Id: 2,
    RetailerCRMId: 'CRM002',
    Retailer_Name: 'Quick Fix Auto',
    RetailerImage: 'https://images.pexels.com/photos/190574/pexels-photo-190574.jpeg?auto=compress&cs=tinysrgb&w=400',
    Retailer_Address: '456 Broadway, New York, NY 10013',
    Retailer_Mobile: '+1 (555) 234-5678',
    Retailer_TFAT_Id: 'TFAT002',
    Retailer_Status: 1,
    Area_Name: 'SoHo District',
    Contact_Person: 'Sarah Williams',
    Pincode: '10013',
    Mobile_Order: '+1 (555) 234-5679',
    Mobile_Account: '+1 (555) 234-5680',
    Owner_Mobile: '+1 (555) 234-5681',
    Area_Id: 2,
    GST_No: 'GST987654321',
    Credit_Limit: 75000,
    Type_Id: 2,
    Confirm: 1,
    Retailer_Tour_Id: 1,
    Retailer_Email: 'sarah@quickfixauto.com',
    latitude: 40.7209,
    logitude: -74.0007,
    Last_Sync: 1704067200000
  },
  {
    Retailer_Id: 3,
    RetailerCRMId: 'CRM003',
    Retailer_Name: 'Sunset Auto Supply',
    RetailerImage: 'https://images.pexels.com/photos/3807277/pexels-photo-3807277.jpeg?auto=compress&cs=tinysrgb&w=400',
    Retailer_Address: '789 Sunset Blvd, Los Angeles, CA 90028',
    Retailer_Mobile: '+1 (555) 345-6789',
    Retailer_TFAT_Id: 'TFAT003',
    Retailer_Status: 1,
    Area_Name: 'Hollywood',
    Contact_Person: 'David Chen',
    Pincode: '90028',
    Mobile_Order: '+1 (555) 345-6790',
    Mobile_Account: '+1 (555) 345-6791',
    Owner_Mobile: '+1 (555) 345-6792',
    Area_Id: 3,
    GST_No: 'GST456789123',
    Credit_Limit: 100000,
    Type_Id: 1,
    Confirm: 1,
    Retailer_Tour_Id: 2,
    Retailer_Email: 'david@sunsetauto.com',
    latitude: 34.0928,
    logitude: -118.3287,
    Last_Sync: 1704067200000
  },
  {
    Retailer_Id: 4,
    RetailerCRMId: 'CRM004',
    Retailer_Name: 'Brooklyn Parts Hub',
    RetailerImage: '',
    Retailer_Address: '321 Atlantic Ave, Brooklyn, NY 11217',
    Retailer_Mobile: '+1 (555) 456-7890',
    Retailer_TFAT_Id: 'TFAT004',
    Retailer_Status: 0,
    Area_Name: 'Brooklyn Heights',
    Contact_Person: 'Lisa Rodriguez',
    Pincode: '11217',
    Mobile_Order: '+1 (555) 456-7891',
    Mobile_Account: '+1 (555) 456-7892',
    Owner_Mobile: '+1 (555) 456-7893',
    Area_Id: 4,
    GST_No: 'GST789123456',
    Credit_Limit: 25000,
    Type_Id: 3,
    Confirm: 0,
    Retailer_Tour_Id: 1,
    Retailer_Email: 'lisa@brooklynparts.com',
    latitude: 40.6892,
    logitude: -73.9442,
    Last_Sync: 1704067200000
  }
];

const mockAreas = [
  { id: 1, name: 'Manhattan Downtown' },
  { id: 2, name: 'SoHo District' },
  { id: 3, name: 'Hollywood' },
  { id: 4, name: 'Brooklyn Heights' }
];

const mockRetailerTypes = [
  { id: 1, name: 'Premium Dealer' },
  { id: 2, name: 'Standard Dealer' },
  { id: 3, name: 'Basic Dealer' }
];

export const RetailerManagement: React.FC = () => {
  const [retailers, setRetailers] = useState<Retailer[]>(mockRetailers);
  const [areas] = useState(mockAreas);
  const [retailerTypes] = useState(mockRetailerTypes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [formData, setFormData] = useState<Partial<Retailer>>({});
  const [retailerImagePreview, setRetailerImagePreview] = useState<string>('');

  const filteredRetailers = retailers.filter(retailer => {
    const matchesSearch = 
      (retailer.Retailer_Name && retailer.Retailer_Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (retailer.Contact_Person && retailer.Contact_Person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (retailer.Retailer_Email && retailer.Retailer_Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (retailer.RetailerCRMId && retailer.RetailerCRMId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesArea = selectedArea === 'all' || retailer.Area_Id?.toString() === selectedArea;
    const matchesStatus = selectedStatus === 'all' || retailer.Retailer_Status?.toString() === selectedStatus;
    
    return matchesSearch && matchesArea && matchesStatus;
  });

  const handleAddRetailer = () => {
    setFormData({
      Retailer_Name: '',
      RetailerCRMId: '',
      Retailer_Address: '',
      Retailer_Mobile: '',
      Retailer_TFAT_Id: '',
      Retailer_Status: 1,
      Area_Name: '',
      Contact_Person: '',
      Pincode: '',
      Mobile_Order: '',
      Mobile_Account: '',
      Owner_Mobile: '',
      Area_Id: undefined,
      GST_No: '',
      Credit_Limit: 45,
      Type_Id: 0,
      Confirm: 0,
      Retailer_Tour_Id: undefined,
      Retailer_Email: '',
      latitude: undefined,
      logitude: undefined,
      RetailerImage: ''
    });
    setRetailerImagePreview('');
    setShowAddModal(true);
  };

  const handleEditRetailer = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setFormData(retailer);
    setRetailerImagePreview(retailer.RetailerImage || '');
    setShowEditModal(true);
  };

  const handleViewRetailer = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setShowViewModal(true);
  };

  const handleSaveRetailer = () => {
    if (showEditModal && selectedRetailer) {
      setRetailers(prev => prev.map(r => 
        r.Retailer_Id === selectedRetailer.Retailer_Id ? { ...formData as Retailer } : r
      ));
      setShowEditModal(false);
    } else if (showAddModal) {
      const newRetailer: Retailer = {
        ...formData as Retailer,
        Retailer_Id: Math.max(...retailers.map(r => r.Retailer_Id)) + 1,
        Last_Sync: Date.now()
      };
      setRetailers(prev => [...prev, newRetailer]);
      setShowAddModal(false);
    }
    setFormData({});
    setSelectedRetailer(null);
    setRetailerImagePreview('');
  };

  const handleDeleteRetailer = (retailerId: number) => {
    if (confirm('Are you sure you want to delete this retailer?')) {
      setRetailers(prev => prev.filter(r => r.Retailer_Id !== retailerId));
    }
  };

  const handleRetailerImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setRetailerImagePreview(result);
        setFormData(prev => ({ ...prev, RetailerImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getAreaName = (areaId?: number) => {
    return areas.find(a => a.id === areaId)?.name || 'Unknown Area';
  };

  const getRetailerTypeName = (typeId?: number) => {
    return retailerTypes.find(t => t.id === typeId)?.name || 'Unknown Type';
  };

  const getStatusColor = (status?: number) => {
    return status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status?: number) => {
    return status === 1 ? 'Active' : 'Inactive';
  };

  const getConfirmColor = (confirm?: number) => {
    return confirm === 1 ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getConfirmText = (confirm?: number) => {
    return confirm === 1 ? 'Confirmed' : 'Pending';
  };

  const RetailerFormModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Retailer Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Retailer Image</label>
              <div className="flex items-center space-x-6">
                <div className="w-32 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  {retailerImagePreview ? (
                    <img 
                      src={retailerImagePreview} 
                      alt="Retailer preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRetailerImageUpload}
                    className="hidden"
                    id="retailer-image-upload"
                  />
                  <label
                    htmlFor="retailer-image-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Retailer Image
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: 800x600px, PNG or JPG format. Store front or business logo.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retailer Name *</label>
                  <input
                    type="text"
                    value={formData.Retailer_Name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter retailer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CRM ID</label>
                  <input
                    type="text"
                    value={formData.RetailerCRMId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, RetailerCRMId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter CRM ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TFAT ID</label>
                  <input
                    type="text"
                    value={formData.Retailer_TFAT_Id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_TFAT_Id: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter TFAT ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                  <input
                    type="text"
                    value={formData.Contact_Person || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Contact_Person: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter contact person name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.Retailer_Email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Email: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="retailer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Retailer Type</label>
                  <select
                    value={formData.Type_Id || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, Type_Id: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value={0}>Select Type</option>
                    {retailerTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Mobile</label>
                  <input
                    type="tel"
                    value={formData.Retailer_Mobile || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Mobile: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Mobile</label>
                  <input
                    type="tel"
                    value={formData.Mobile_Order || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Mobile_Order: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Mobile</label>
                  <input
                    type="tel"
                    value={formData.Mobile_Account || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Mobile_Account: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner Mobile</label>
                  <input
                    type="tel"
                    value={formData.Owner_Mobile || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Owner_Mobile: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.Retailer_Address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Address: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none resize-none"
                    placeholder="Enter complete address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area Name</label>
                  <input
                    type="text"
                    value={formData.Area_Name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Area_Name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter area name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input
                    type="text"
                    value={formData.Pincode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Pincode: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter pincode"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area ID</label>
                  <select
                    value={formData.Area_Id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Area_Id: parseInt(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value="">Select Area</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="40.7128"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.logitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, logitude: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="-74.0060"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                  <input
                    type="text"
                    value={formData.GST_No || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, GST_No: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="GST123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credit Limit</label>
                  <input
                    type="number"
                    value={formData.Credit_Limit || 45}
                    onChange={(e) => setFormData(prev => ({ ...prev, Credit_Limit: parseInt(e.target.value) || 45 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="45"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tour ID</label>
                  <input
                    type="number"
                    value={formData.Retailer_Tour_Id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Tour_Id: parseInt(e.target.value) || undefined }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                    placeholder="Enter tour ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.Retailer_Status || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, Retailer_Status: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation</label>
                  <select
                    value={formData.Confirm || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, Confirm: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
                  >
                    <option value={0}>Pending</option>
                    <option value={1}>Confirmed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRetailer}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors"
            >
              Save Retailer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RetailerViewModal = ({ isOpen, onClose, retailer }: { isOpen: boolean; onClose: () => void; retailer: Retailer | null }) => {
    if (!isOpen || !retailer) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#003366] rounded-lg flex items-center justify-center">
                  {retailer.RetailerImage ? (
                    <img 
                      src={retailer.RetailerImage} 
                      alt={retailer.Retailer_Name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <UserCheck className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{retailer.Retailer_Name}</h2>
                  <p className="text-gray-600">{retailer.Contact_Person}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(retailer.Retailer_Status)}`}>
                      {getStatusText(retailer.Retailer_Status)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfirmColor(retailer.Confirm)}`}>
                      {getConfirmText(retailer.Confirm)}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Retailer Image */}
            {retailer.RetailerImage && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Retailer Image</h3>
                <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={retailer.RetailerImage} 
                    alt={retailer.Retailer_Name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Retailer ID</p>
                    <p className="text-gray-900 font-mono">{retailer.Retailer_Id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">CRM ID</p>
                    <p className="text-gray-900">{retailer.RetailerCRMId || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">TFAT ID</p>
                    <p className="text-gray-900">{retailer.Retailer_TFAT_Id || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Retailer Type</p>
                    <p className="text-gray-900">{getRetailerTypeName(retailer.Type_Id)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
                
                <div className="space-y-3">
                  {retailer.Retailer_Email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900">{retailer.Retailer_Email}</p>
                      </div>
                    </div>
                  )}
                  
                  {retailer.Retailer_Mobile && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Primary Mobile</p>
                        <p className="text-gray-900">{retailer.Retailer_Mobile}</p>
                      </div>
                    </div>
                  )}
                  
                  {retailer.Mobile_Order && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Order Mobile</p>
                        <p className="text-gray-900">{retailer.Mobile_Order}</p>
                      </div>
                    </div>
                  )}
                  
                  {retailer.Owner_Mobile && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Owner Mobile</p>
                        <p className="text-gray-900">{retailer.Owner_Mobile}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
                
                <div className="space-y-3">
                  {retailer.GST_No && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">GST Number</p>
                      <p className="text-gray-900 font-mono">{retailer.GST_No}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-600">Credit Limit</p>
                    <p className="text-gray-900 font-semibold">${(retailer.Credit_Limit || 0).toLocaleString()}</p>
                  </div>
                  {retailer.Retailer_Tour_Id && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tour ID</p>
                      <p className="text-gray-900">{retailer.Retailer_Tour_Id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {retailer.Retailer_Address && (
                    <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Address</p>
                        <p className="text-gray-700">{retailer.Retailer_Address}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {retailer.Area_Name && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Area</p>
                      <p className="text-gray-900">{retailer.Area_Name}</p>
                    </div>
                  )}
                  {retailer.Pincode && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pincode</p>
                      <p className="text-gray-900">{retailer.Pincode}</p>
                    </div>
                  )}
                  {(retailer.latitude && retailer.logitude) && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Coordinates</p>
                      <p className="text-gray-900 font-mono">{retailer.latitude}, {retailer.logitude}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">System Information</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Area ID</p>
                  <p className="text-gray-900">{retailer.Area_Id || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Type ID</p>
                  <p className="text-gray-900">{retailer.Type_Id || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Last Sync</p>
                  <p className="text-gray-900">
                    {retailer.Last_Sync ? new Date(retailer.Last_Sync).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <div className="flex items-center space-x-2">
                    {retailer.Retailer_Status === 1 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>{getStatusText(retailer.Retailer_Status)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => {
                onClose();
                handleEditRetailer(retailer);
              }}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Retailer</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Retailer Management</h1>
          <p className="text-gray-600">Comprehensive retailer database with image management</p>
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
          <button 
            onClick={handleAddRetailer}
            className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Retailer</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-[#003366]" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search retailers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            />
          </div>
          
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Areas</option>
            {areas.map(area => (
              <option key={area.id} value={area.id.toString()}>{area.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
          >
            <option value="all">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <span className="font-medium">{filteredRetailers.length}</span> retailers found
          </div>

          <div className="text-sm text-gray-600 flex items-center justify-end">
            <span className="font-medium">
              {filteredRetailers.filter(r => r.Retailer_Status === 1).length} active
            </span>
          </div>
        </div>
      </div>

      {/* Retailers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRetailers.map((retailer) => (
          <div key={retailer.Retailer_Id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Retailer Image */}
            <div className="relative h-48 bg-gray-100">
              {retailer.RetailerImage ? (
                <img 
                  src={retailer.RetailerImage} 
                  alt={retailer.Retailer_Name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserCheck className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex flex-col space-y-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(retailer.Retailer_Status)}`}>
                  {getStatusText(retailer.Retailer_Status)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfirmColor(retailer.Confirm)}`}>
                  {getConfirmText(retailer.Confirm)}
                </span>
              </div>

              {/* Credit Limit */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {(retailer.Credit_Limit || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Retailer Details */}
            <div className="p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{retailer.Retailer_Name}</h3>
                <p className="text-gray-600 text-sm">{retailer.Contact_Person}</p>
                <p className="text-gray-500 text-xs">ID: {retailer.Retailer_Id}</p>
              </div>

              <div className="space-y-2 mb-4">
                {retailer.Retailer_Email && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{retailer.Retailer_Email}</span>
                  </div>
                )}
                
                {retailer.Retailer_Mobile && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span>{retailer.Retailer_Mobile}</span>
                  </div>
                )}
                
                {retailer.Area_Name && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span>{retailer.Area_Name}</span>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="flex items-center justify-between mb-4 text-xs">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium text-gray-900">{getRetailerTypeName(retailer.Type_Id)}</p>
                </div>
                {retailer.GST_No && (
                  <div className="text-right">
                    <p className="text-gray-500">GST</p>
                    <p className="font-medium text-gray-900 font-mono">{retailer.GST_No.slice(-6)}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewRetailer(retailer)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => handleEditRetailer(retailer)}
                  className="flex-1 bg-[#003366] text-white px-3 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteRetailer(retailer.Retailer_Id)}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRetailers.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No retailers found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or add a new retailer.</p>
        </div>
      )}

      {/* Modals */}
      <RetailerFormModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        title="Add New Retailer" 
      />
      <RetailerFormModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Edit Retailer" 
      />
      <RetailerViewModal 
        isOpen={showViewModal} 
        onClose={() => setShowViewModal(false)} 
        retailer={selectedRetailer} 
      />
    </div>
  );
};