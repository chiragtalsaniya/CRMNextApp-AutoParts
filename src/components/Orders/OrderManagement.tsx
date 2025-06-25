import React, { useState, useEffect } from 'react';
import { Search, Eye, Truck, CheckCircle, Clock, AlertCircle, Shield } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const mockOrders: Order[] = [
  {
    id: '1',
    retailer_id: '1',
    salesman_id: '1',
    store_id: 'NYC001',
    status: 'pending',
    total_price: 156.97,
    created_at: '2024-01-15T10:30:00Z',
    items: [
      { id: '1', order_id: '1', part_id: '1', quantity: 4, price_per_unit: 12.99, part_name: 'NGK Spark Plug' },
      { id: '2', order_id: '1', part_id: '2', quantity: 2, price_per_unit: 45.99, part_name: 'Brake Pads - Front' }
    ]
  },
  {
    id: '2',
    retailer_id: '2',
    salesman_id: '1',
    store_id: 'NYC001',
    status: 'processing',
    total_price: 89.97,
    created_at: '2024-01-14T14:15:00Z',
    items: [
      { id: '3', order_id: '2', part_id: '3', quantity: 10, price_per_unit: 8.99, part_name: 'Oil Filter' }
    ]
  },
  {
    id: '3',
    retailer_id: '3',
    salesman_id: '2',
    store_id: 'LA001',
    status: 'shipped',
    total_price: 234.50,
    created_at: '2024-01-13T09:20:00Z',
    items: [
      { id: '4', order_id: '3', part_id: '1', quantity: 8, price_per_unit: 12.99, part_name: 'NGK Spark Plug' },
      { id: '5', order_id: '3', part_id: '4', quantity: 6, price_per_unit: 15.99, part_name: 'Air Filter' }
    ]
  },
  {
    id: '4',
    retailer_id: '1',
    salesman_id: '1',
    store_id: 'NYC001',
    status: 'delivered',
    total_price: 445.20,
    created_at: '2024-01-11T11:30:00Z',
    items: [
      { id: '6', order_id: '4', part_id: '1', quantity: 12, price_per_unit: 12.99, part_name: 'NGK Spark Plug' },
      { id: '7', order_id: '4', part_id: '4', quantity: 18, price_per_unit: 15.99, part_name: 'Air Filter' }
    ]
  }
];

export const OrderManagement: React.FC = () => {
  const { user, canAccessStore, getAccessibleStores, getAccessibleRetailers } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // Filter orders based on user access rights
  useEffect(() => {
    const accessibleStoreIds = getAccessibleStores();
    const accessibleRetailerIds = getAccessibleRetailers();
    
    let filteredOrders = mockOrders;

    // Apply role-based filtering
    switch (user?.role) {
      case 'super_admin':
        // Can see all orders
        break;
      case 'admin':
        // Can see orders from stores in their company
        filteredOrders = mockOrders.filter(order => 
          accessibleStoreIds.includes(order.store_id)
        );
        break;
      case 'manager':
      case 'storeman':
      case 'salesman':
        // Can see orders from their specific store
        filteredOrders = mockOrders.filter(order => 
          accessibleStoreIds.includes(order.store_id)
        );
        break;
      case 'retailer':
        // Can only see their own orders
        filteredOrders = mockOrders.filter(order => 
          accessibleRetailerIds.includes(parseInt(order.retailer_id))
        );
        break;
      default:
        filteredOrders = [];
    }

    setOrders(filteredOrders);
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <AlertCircle className="w-4 h-4" />;
      case 'picked': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'picked': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPageTitle = () => {
    switch (user?.role) {
      case 'super_admin': return 'System Order Management';
      case 'admin': return 'Company Order Management';
      case 'manager': return 'Store Order Management';
      case 'storeman': return 'Store Order Processing';
      case 'salesman': return 'Sales Order Management';
      case 'retailer': return 'My Orders';
      default: return 'Order Management';
    }
  };

  const getPageDescription = () => {
    switch (user?.role) {
      case 'super_admin': return 'Monitor and manage orders across all companies and stores';
      case 'admin': return `Manage orders for all stores in Company ${user?.company_id}`;
      case 'manager': return `Oversee all orders for Store ${user?.store_id}`;
      case 'storeman': return `Process and fulfill orders for Store ${user?.store_id}`;
      case 'salesman': return `Track orders you've created for Store ${user?.store_id}`;
      case 'retailer': return `View and track your order history and current orders`;
      default: return 'Track and manage orders';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">{getPageDescription()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredOrders.length} orders accessible to your role
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="picked">Picked</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {user?.role !== 'retailer' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </span>
                  </td>
                  {user?.role !== 'retailer' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.store_id}</div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items.slice(0, 2).map(item => item.part_name).join(', ')}
                      {order.items.length > 2 && '...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${order.total_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {user?.role === 'retailer' 
                ? "You haven't placed any orders yet." 
                : "No orders match your search criteria or access level."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};