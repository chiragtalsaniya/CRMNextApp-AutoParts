import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  Search, 
  Eye, 
  Truck, 
  CheckCircle, 
  Clock, 
  Shield, 
  Plus,
  Edit,
  Package,
  PauseCircle,
  XCircle,
  PlusCircle,
  Filter,
  Download,
  Upload,
  Zap,
  MapPin,
  Circle
} from 'lucide-react';
import { OrderMaster, OrderItem, OrderStatus, NewOrderForm, getOrderStatusColor, timestampToDate, formatCurrency } from '../../types';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { NewOrderFormModal } from './NewOrderForm';
import { ordersAPI } from '../../services/api';
import { Dialog, DialogBackdrop, DialogTitle } from '@headlessui/react';
import { ItemStatusModal } from '../ItemStatus/ItemStatusModal';



// Patch OrderMaster type for UI fields (temporary, until backend returns these fields always)
type OrderMasterWithUI = OrderMaster & {
  Branch_Name?: string;
  Retailer_Name?: string;
  items?: OrderItem[];
};

export const OrderManagement: React.FC = () => {
  const { user, canAccessStore, getAccessibleStores, getAccessibleRetailers } = useAuth();
  const [orders, setOrders] = useState<OrderMaster[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderMaster | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [nextStatuses, setNextStatuses] = useState<OrderStatus[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>(''); // Fix selectedStatus useState type
  const [statusNotes, setStatusNotes] = useState('');

  // Valid transitions map (should match backend)add as 
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    New: ['Pending', 'Hold', 'Cancelled'],
    Pending: ['Processing', 'Hold', 'Cancelled'],
    Processing: ['Picked', 'Hold', 'Cancelled'],
    Hold: ['New', 'Pending', 'Processing', 'Cancelled'],
    Picked: ['Dispatched', 'Hold'],
    Dispatched: ['Completed'],
    Completed: [],
    Cancelled: []
  };

  // Load orders from API
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {};
        
        // Add role-based filtering
        if (user?.role === 'retailer') {
          params.retailer_id = user.retailer_id;
        } else if (user?.role !== 'super_admin') {
          if (user?.store_id) {
            params.branch = user.store_id;
          } else if (user?.company_id) {
            // Company-level filtering will be handled by backend
          }
        }

        const response = await ordersAPI.getOrders(params);
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadOrders();
    }
  }, [user]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.Order_Id.toString().includes(searchTerm.toLowerCase()) ||
      (order.CRMOrderId && order.CRMOrderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.PO_Number && order.PO_Number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.Order_Status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || 
      (urgencyFilter === 'urgent' && order.Urgent_Status === true) ||
      (urgencyFilter === 'normal' && order.Urgent_Status === false);
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getStatusIcon = (status?: OrderStatus) => {
    switch (status) {
      case 'New': return <PlusCircle className="w-4 h-4" />;
      case 'Processing': return <Clock className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Hold': return <PauseCircle className="w-4 h-4" />;
      case 'Picked': return <Package className="w-4 h-4" />;
      case 'Dispatched': return <Truck className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleViewOrder = async (order: OrderMaster) => {
    try {
      setLoading(true);
      const response = await ordersAPI.getOrder(order.Order_Id);
      const orderWithItems = response.data;
      
      setSelectedOrder(orderWithItems);
      setOrderItems(orderWithItems.items || []);
      setShowOrderDetails(true);
    } catch (err) {
      console.error('Failed to load order details:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = async (orderData: NewOrderForm) => {
    try {
      setLoading(true);
      const response = await ordersAPI.createOrder(orderData);
      
      // Refresh orders list
      const ordersResponse = await ordersAPI.getOrders();
      setOrders(ordersResponse.data.orders || []);
      
      setShowNewOrderForm(false);
      alert('Order created successfully!');
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getOrderItems = (orderId: number) => {
    return orderItems.filter(item => item.Order_Id === orderId);
  };

  const calculateOrderTotal = (orderId: number) => {
    const items = getOrderItems(orderId);
    return items.reduce((total, item) => total + (item.ItemAmount || 0), 0);
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

  // Helper to get UI fields for an order (Branch_Name, Retailer_Name, items)
  function getOrderUI(order: OrderMaster): OrderMasterWithUI {
    return {
      ...order,
      Branch_Name: (order as any).Branch_Name,
      Retailer_Name: (order as any).Retailer_Name,
      items: (order as any).items || orderItems.filter(i => i.Order_Id === order.Order_Id),
    };
  }

  const OrderDetailsModal = () => {
    if (!showOrderDetails || !selectedOrder) return null;

    // Cast selectedOrder as OrderMasterWithUI
    const orderUI = getOrderUI(selectedOrder);
    const items = orderUI.items || [];
    const orderTotal = items.reduce((total, item) => total + (item.ItemAmount || 0), 0);
    const inventorySummary = (selectedOrder as any).inventory_summary || {
      total_items: items.length,
      available_items: 0,
      out_of_stock_items: 0,
      insufficient_stock_items: 0,
      not_available_items: 0,
      can_fulfill: false
    };
    const statusHistory = (selectedOrder as any).status_history || [];

    // Build timeline steps from statusHistory
    const timelineSteps = statusHistory.map((entry: any, idx: number) => {
      return {
        key: entry.status + '-' + entry.timestamp,
        label: entry.status,
        icon: getStatusIcon(entry.status),
        color: getOrderStatusColor(entry.status),
        date: entry.timestamp,
        by: entry.updated_by_role,
        notes: entry.notes,
        idx
      };
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 text-white">
                {getStatusIcon(selectedOrder.Order_Status)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order #{selectedOrder.Order_Id}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getOrderStatusColor(selectedOrder.Order_Status)}`}>{selectedOrder.Order_Status}</span>
                  {selectedOrder.Urgent_Status && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 ml-2">
                      <Zap className="w-3 h-3 mr-1" />Urgent
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{selectedOrder.CRMOrderId}</div>
              </div>
            </div>
            <button onClick={() => setShowOrderDetails(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
              <XCircle className="w-7 h-7" />
            </button>
          </div>

          {/* Main Content */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Order & Retailer Info */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <div className="mb-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">PO:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{orderUI.PO_Number}</span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-4">Branch:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{orderUI.Branch_Name || orderUI.Branch}</span>
                </div>
                <div className="mb-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Company:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{(orderUI as any).Company_Name || (selectedOrder as any).Company_Name || '-'}</span>
                </div>
                <div className="mt-6">
                  <div className="w-full overflow-x-auto pb-2">
                    <ol className="flex items-center min-w-[600px] w-full justify-between relative">
                      {timelineSteps.length > 0 ? timelineSteps.map((step, idx) => (
                        <li key={step.key} className="flex-1 flex flex-col items-center group relative">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step.color} bg-white dark:bg-gray-900 z-10 transition-colors`} title={step.label}>
                              {step.icon}
                            </div>
                            {idx < timelineSteps.length - 1 && (
                              <div className="flex-1 h-1 mx-1 bg-gray-300 dark:bg-gray-700" />
                            )}
                          </div>
                          <div className="mt-2 text-xs text-center">
                            <span className="block font-semibold text-gray-900 dark:text-gray-100">{step.label}</span>
                            {step.date && (
                              <span className="block text-gray-500 dark:text-gray-400">{format(timestampToDate(step.date)!, 'MMM dd, yyyy HH:mm')}</span>
                            )}
                            {step.by && (
                              <span className="block text-gray-400 dark:text-gray-500">by {step.by}</span>
                            )}
                            {step.notes && (
                              <span className="block text-gray-400 dark:text-gray-500 italic">{step.notes}</span>
                            )}
                          </div>
                        </li>
                      )) : (
                        <li className="flex-1 flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-gray-200 dark:bg-gray-700 text-gray-400">?</div>
                          <span className="mt-2 text-xs text-gray-400">No status history</span>
                        </li>
                      )}
                    </ol>
                  </div>
                </div>
                <div className="mb-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Retailer:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{orderUI.Retailer_Name}</span>
                </div>
                <div className="mb-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Transport:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{orderUI.TransportBy || 'Not assigned'}</span>
                </div>
                <div className="mb-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status Remark:</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{selectedOrder.Remark || '-'}</span>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">PO Date</span>
                    <span className="block text-sm text-gray-900 dark:text-gray-100">{orderUI.PO_Date ? format(timestampToDate(orderUI.PO_Date)!, 'MMM dd, yyyy') : '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Order Placed By</span>
                    <span className="block text-sm text-gray-900 dark:text-gray-100">{orderUI.Place_By}</span>
                  </div>
                </div>
              </div>
                <div className="mb-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Retailer:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{orderUI.Retailer_Name}</span>
                </div>
                <div className="mb-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Transport:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{orderUI.TransportBy || 'Not assigned'}</span>
                </div>
                <div className="mb-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status Remark:</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{selectedOrder.Remark || '-'}</span>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">PO Date</span>
                    <span className="block text-sm text-gray-900 dark:text-gray-100">{orderUI.PO_Date ? format(timestampToDate(orderUI.PO_Date)!, 'MMM dd, yyyy') : '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">Order Placed By</span>
                    <span className="block text-sm text-gray-900 dark:text-gray-100">{orderUI.Place_By}</span>
                  </div>
                </div>
              </div>

              {/* Horizontal Timeline */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Order Status Timeline</h3>
                {/* Modern Horizontal Stepper Timeline */}
                <div className="w-full overflow-x-auto pb-2">
                  <ol className="flex items-center min-w-[600px] w-full justify-between relative">
                    {(() => {
                      // Define steps with color and icon logic
                      const steps = [
                        { key: 'New', label: 'New', icon: getStatusIcon('New'), color: getOrderStatusColor('New'), date: selectedOrder.Place_Date, by: selectedOrder.Place_By },
                        { key: 'Pending', label: 'Pending', icon: getStatusIcon('Pending'), color: getOrderStatusColor('Pending') },
                        { key: 'Processing', label: 'Processing', icon: getStatusIcon('Processing'), color: getOrderStatusColor('Processing'), date: selectedOrder.Confirm_Date, by: selectedOrder.Confirm_By },
                        { key: 'Picked', label: 'Picked', icon: getStatusIcon('Picked'), color: getOrderStatusColor('Picked'), date: selectedOrder.Pick_Date, by: selectedOrder.Pick_By },
                        { key: 'Dispatched', label: 'Dispatched', icon: getStatusIcon('Dispatched'), color: getOrderStatusColor('Dispatched') },
                        { key: 'Completed', label: 'Completed', icon: getStatusIcon('Completed'), color: getOrderStatusColor('Completed') },
                        { key: 'Cancelled', label: 'Cancelled', icon: getStatusIcon('Cancelled'), color: getOrderStatusColor('Cancelled') }
                      ];
                      const currentIdx = steps.findIndex(s => s.key === selectedOrder.Order_Status);
                      // If cancelled, highlight only up to cancelled
                      const isCancelled = selectedOrder.Order_Status === 'Cancelled';
                      return steps.map((step, idx) => {
                        // Step state
                        const isActive = idx === currentIdx && !isCancelled;
                        const isCompleted = idx < currentIdx && !isCancelled;
                        const isCancelledStep = isCancelled && step.key === 'Cancelled';
                        // Color classes
                        const colorClass = isActive || isCancelledStep ? step.color + ' text-white' : isCompleted ? step.color.replace('bg-', 'bg-opacity-30 text-') + ' text-gray-900 dark:text-gray-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-400';
                        const borderClass = isActive || isCancelledStep ? 'border-2 border-[#003366] shadow-lg' : isCompleted ? 'border border-gray-300 dark:border-gray-600' : 'border border-gray-200 dark:border-gray-700';
                        // Connector
                        const showConnector = idx < steps.length - 1;
                        return (
                          <React.Fragment key={step.key}>
                            <li className="flex-1 flex flex-col items-center relative min-w-[80px]">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${colorClass} ${borderClass} transition-all duration-200 mb-1`}
                                aria-current={isActive || isCancelledStep ? 'step' : undefined}
                                >
                                {step.icon && React.cloneElement(step.icon, { className: 'w-5 h-5' })}
                              </div>
                              <span className={`text-xs font-semibold ${isActive || isCancelledStep ? 'text-[#003366] dark:text-blue-200' : isCompleted ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>{step.label}</span>
                              {/* Date/by info if available */}
                              {step.date && (
                                <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{format(timestampToDate(step.date)!, 'MMM dd, HH:mm')}</span>
                              )}
                              {step.by && (
                                <span className="block text-[10px] text-gray-400 dark:text-gray-500">by {step.by}</span>
                              )}
                            </li>
                            {showConnector && (
                              <div className="absolute top-5 left-full w-8 h-1 flex items-center" aria-hidden="true">
                                <div className={`w-full h-1 rounded-full ${idx < currentIdx && !isCancelled ? steps[idx].color : 'bg-gray-200 dark:bg-gray-700'} transition-all`}></div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </ol>
                </div>
              </div>

              {/* Inventory Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Inventory Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col"><span className="text-gray-500">Total Items</span><span className="font-bold text-gray-900 dark:text-gray-100">{inventorySummary.total_items}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500">Available</span><span className="font-bold text-green-700 dark:text-green-300">{inventorySummary.available_items}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500">Out of Stock</span><span className="font-bold text-red-700 dark:text-red-300">{inventorySummary.out_of_stock_items}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500">Insufficient</span><span className="font-bold text-yellow-700 dark:text-yellow-300">{inventorySummary.insufficient_stock_items}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500">Not Available</span><span className="font-bold text-gray-700 dark:text-gray-300">{inventorySummary.not_available_items}</span></div>
                  <div className="flex flex-col"><span className="text-gray-500">Can Fulfill</span><span className={`font-bold ${inventorySummary.can_fulfill ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{inventorySummary.can_fulfill ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            </div>

            {/* Right: Order Items */}
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Order Items</h3>
                  <span className="text-xs text-gray-500">Total: {formatCurrency(orderTotal)}</span>
                </div>
                <div className="space-y-4">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.inventory_status === 'Available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : item.inventory_status === 'Insufficient Stock' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : item.inventory_status === 'Out of Stock' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>{item.inventory_status || 'Unknown'}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.OrderItemStatus === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : item.OrderItemStatus === 'Dispatched' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : item.OrderItemStatus === 'Processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>{item.OrderItemStatus}</span>
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">{item.Part_Salesman}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.Part_Admin}</div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Qty: <span className="font-semibold text-gray-900 dark:text-gray-100">{item.Order_Qty}</span></span>
                          <span>MRP: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.MRP)}</span></span>
                          <span>Amount: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.ItemAmount)}</span></span>
                          <span>Stock: <span className="font-semibold text-gray-900 dark:text-gray-100">{item.total_stock}</span></span>
                          <span>Rack: <span className="font-semibold text-gray-900 dark:text-gray-100">{item.rack_location || '-'}</span></span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>Discount: {item.Discount || 0}%</span>
                          <span>Scheme: {item.SchemeDisc || 0}%</span>
                          <span>Additional: {item.AdditionalDisc || 0}%</span>
                          <span>Stock A: {item.stock_level_a || 0}</span>
                          <span>Stock B: {item.stock_level_b || 0}</span>
                          <span>Stock C: {item.stock_level_c || 0}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-1">
                          {item.last_sale_date && <span>Last Sale: {item.last_sale_date}</span>}
                          {item.last_purchase_date && <span>Last Purchase: {item.last_purchase_date}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-end gap-4">
            <button
              onClick={() => setShowOrderDetails(false)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
            {user?.role !== 'retailer' && (
              <button className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2">
                <Edit className="w-4 h-4" />
                <span>Edit Order</span>
              </button>
            )}
            {user && ['admin', 'manager', 'storeman'].includes(user.role) &&
              validTransitions[selectedOrder.Order_Status as OrderStatus]?.length > 0 && (
                <button
                  onClick={handleOpenStatusModal}
                  className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Change Status</span>
                </button>
            )}
          </div>
        </div>
    );
  };

  const handleOpenStatusModal = () => {
    if (!selectedOrder) return;
    const valid = validTransitions[selectedOrder.Order_Status as OrderStatus] || [];
    setNextStatuses(valid);
    setSelectedStatus(valid[0] || '');
    setStatusNotes('');
    setStatusError(null);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !selectedStatus) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      // Validate status transition on frontend (defensive, backend also validates)
      const prevStatus = selectedOrder.Order_Status;
      // Updated status transition rules per documentation
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        New: ['Pending', 'Hold', 'Cancelled'],
        Pending: ['Processing', 'Hold', 'Cancelled'],
        Processing: ['Picked', 'Hold', 'Cancelled'],
        Hold: ['New', 'Pending', 'Processing', 'Picked', 'Dispatched', 'Cancelled'], // Can return to previous or be cancelled
        Picked: ['Dispatched', 'Hold'],
        Dispatched: ['Completed'],
        Completed: [],
        Cancelled: []
      };
      if (!prevStatus || !(prevStatus in validTransitions) || !validTransitions[prevStatus as OrderStatus].includes(selectedStatus as OrderStatus)) {
        setStatusError(`Invalid status transition from ${prevStatus} to ${selectedStatus}`);
        setStatusLoading(false);
        return;
      }

      // Special validation for Processing to Picked transition
      if ((prevStatus || '').toLowerCase() === 'processing' && (selectedStatus || '').toLowerCase() === 'picked') {
        // Check if all items are picked
        // Use getOrderUI to get items array with correct typing
        const orderUI = getOrderUI(selectedOrder);
        const allItemsPicked = (orderUI.items || []).every((item: any) => item.picked);
        if (!allItemsPicked) {
          setShowStatusModal(false);
          setStatusLoading(false);
          toast.error('All items must be picked before changing status to Picked');
          return;
        }
      }

      // Call API (ordersAPI.updateOrderStatus expects (id, status, notes?))
      await ordersAPI.updateOrderStatus(selectedOrder.Order_Id, selectedStatus, statusNotes);
      // Optimistically update UI
      setSelectedOrder({ ...selectedOrder, Order_Status: selectedStatus, Remark: statusNotes || selectedOrder.Remark });
      setOrders(orders => orders.map(o => o.Order_Id === selectedOrder.Order_Id ? { ...o, Order_Status: selectedStatus } : o));
      setShowStatusModal(false);
    } catch (err: any) {
      setStatusError(err?.response?.data?.error || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Add state for item status modal
  const [showItemStatusModal, setShowItemStatusModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderItem | null>(null);

  const handleOpenItemStatusModal = (item: OrderItem) => {
    setSelectedOrderItem(item);
    setShowItemStatusModal(true);
  };
  const handleCloseItemStatusModal = () => {
    setShowItemStatusModal(false);
    setSelectedOrderItem(null);
  };

return (
    <>
      <Toaster richColors position="top-center" theme="system" />
      <div className="space-y-6 bg-white dark:bg-gray-900 min-h-screen transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-600">{getPageDescription()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredOrders.length} orders accessible to your role
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            className="flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors mr-2"
            aria-label="Import Orders"
            title="Import Orders"
          >
            <Upload className="w-5 h-5 mr-2" />
            Import
          </button>
          <button
            type="button"
            className="flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors mr-2"
            aria-label="Export Orders"
            title="Export Orders"
          >
            <Download className="w-5 h-5 mr-2" />
            Export
          </button>
          {user?.role !== 'retailer' && (
            <button
              type="button"
              onClick={() => setShowNewOrderForm(true)}
              className="flex items-center px-4 py-2 rounded-lg bg-[#003366] text-white font-semibold hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] transition-colors"
              aria-label="Create new order"
              title="Create new order"
            >
              <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
              <span>New Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Order Details Modal (dark mode improvements) */}
      {showOrderDetails && selectedOrder && (() => {
        const orderUI = getOrderUI(selectedOrder);
        const items = orderUI.items || [];
        const orderTotal = items.reduce((total, item) => total + (item.ItemAmount || 0), 0);
        // Build timeline steps from statusHistory
        const statusHistory = (selectedOrder as any).status_history || [];
        const timelineSteps = statusHistory.map((entry: any, idx: number) => {
          return {
            key: entry.status + '-' + entry.timestamp,
            label: entry.status,
            icon: getStatusIcon(entry.status),
            color: getOrderStatusColor(entry.status),
            date: entry.timestamp,
            by: entry.updated_by_role,
            notes: entry.notes,
            idx
          };
        });
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
                      {getStatusIcon(selectedOrder.Order_Status)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Order #{selectedOrder.Order_Id}</h2>
                      <p className="text-gray-600 dark:text-gray-400">{selectedOrder.CRMOrderId}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(selectedOrder.Order_Status)}`}>
                          {selectedOrder.Order_Status}
                        </span>
                        {selectedOrder.Urgent_Status && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            <Zap className="w-3 h-3 mr-1" />
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Status Timeline (from statusHistory) */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-800 mb-6">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Order Status Timeline</h3>
                  <div className="w-full overflow-x-auto pb-2">
                    <ol className="flex items-center min-w-[600px] w-full justify-between relative">
                      {timelineSteps.length > 0 ? timelineSteps.map((step: any, idx: number) => (
                        <li key={step.key} className="flex-1 flex flex-col items-center group relative">
                          <div className="flex items-center">
                            {/* Animated glowing border for active step */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${step.color} bg-gradient-to-br from-white/80 to-blue-50 dark:from-gray-900 dark:to-blue-950 shadow-lg transition-all duration-300 ${idx === timelineSteps.length - 1 ? 'ring-4 ring-blue-300/30 dark:ring-blue-900/40' : ''}`} title={step.label}>
                              <span className="relative flex items-center justify-center w-8 h-8">
                                {step.icon}
                                {/* Animated pulse for current step */}
                                {idx === timelineSteps.length - 1 && (
                                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30 animate-ping"></span>
                                )}
                              </span>
                            </div>
                            {idx < timelineSteps.length - 1 && (
                              <div className="flex-1 h-1 mx-1 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600 dark:from-blue-900 dark:via-blue-700 dark:to-blue-500 opacity-60 rounded-full transition-all duration-300" />
                            )}
                          </div>
                          <div className="mt-3 text-xs text-center min-w-[90px]">
                            <span className="block font-bold text-gray-900 dark:text-gray-100 tracking-wide uppercase">{step.label}</span>
                            {step.date && (
                              <span className="block text-[11px] text-blue-700 dark:text-blue-300 font-mono mt-0.5">{format(timestampToDate(step.date)!, 'MMM dd, yyyy HH:mm')}</span>
                            )}
                            {step.by && (
                              <span className="block text-[11px] text-gray-400 dark:text-gray-500">by {step.by}</span>
                            )}
                            {step.notes && (
                              <span className="block text-[11px] text-blue-500 dark:text-blue-300 italic mt-0.5">{step.notes}</span>
                            )}
                          </div>
                        </li>
                      )) : (
                        <li className="flex-1 flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center border-4 bg-gray-200 dark:bg-gray-700 text-gray-400">?</div>
                          <span className="mt-2 text-xs text-gray-400">No status history</span>
                        </li>
                      )}
                    </ol>
                  </div>
                </div>
                {/* Order Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Order Details</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PO Number</p>
                        <p className="text-gray-900 dark:text-gray-100">{orderUI.PO_Number || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Branch</p>
                        <p className="text-gray-900 dark:text-gray-100">{orderUI.Branch_Name || orderUI.Branch || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgency</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${orderUI.Urgent_Status ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                          {orderUI.Urgent_Status ? (
                            <>
                              <Zap className="w-3 h-3 mr-1" />
                              Urgent
                            </>
                          ) : (
                            'Normal'
                          )}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transport</p>
                        <p className="text-gray-900 dark:text-gray-100">{orderUI.TransportBy || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Timeline</h3>
                    <div className="space-y-3">
                      {selectedOrder.Place_Date && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Placed</p>
                          <p className="text-gray-900 dark:text-gray-100">{format(timestampToDate(selectedOrder.Place_Date)!, 'MMM dd, yyyy HH:mm')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">by {selectedOrder.Place_By}</p>
                        </div>
                      )}
                      {selectedOrder.Confirm_Date && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirmed</p>
                          <p className="text-gray-900 dark:text-gray-100">{format(timestampToDate(selectedOrder.Confirm_Date)!, 'MMM dd, yyyy HH:mm')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">by {selectedOrder.Confirm_By}</p>
                        </div>
                      )}
                      {selectedOrder.Pick_Date && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Picked</p>
                          <p className="text-gray-900 dark:text-gray-100">{format(timestampToDate(selectedOrder.Pick_Date)!, 'MMM dd, yyyy HH:mm')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">by {selectedOrder.Pick_By}</p>
                        </div>
                      )}
                      {selectedOrder.Delivered_Date && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delivered</p>
                          <p className="text-gray-900 dark:text-gray-100">{format(timestampToDate(selectedOrder.Delivered_Date)!, 'MMM dd, yyyy HH:mm')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">by {selectedOrder.Delivered_By}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Summary</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                        <p className="text-gray-900 dark:text-gray-100">{items.length}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p className="text-2xl font-bold text-[#003366] dark:text-blue-300">{formatCurrency(orderTotal)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Retailer</p>
                        <p className="text-gray-900 dark:text-gray-100">{orderUI.Retailer_Name || `ID: ${orderUI.Retailer_Id}` || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dispatch ID</p>
                        <p className="text-gray-900 dark:text-gray-100">{orderUI.DispatchId || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                {selectedOrder.Remark && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Remarks</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300">{selectedOrder.Remark}</p>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">MRP</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Discounts</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rack Location</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {Array.isArray(items) ? items.map((item: OrderItem) => (
                          <tr key={item.Order_Item_Id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-semibold">{item.Part_Salesman || item.Part_Admin || '-'}</td>
                            <td className="px-4 py-3">{item.Order_Qty}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{formatCurrency(item.MRP)}</td>
                            <td className="px-4 py-3">
                              <span className="block">Basic: {item.Discount || 0}%</span>
                              <span className="block">Scheme: {item.SchemeDisc || 0}%</span>
                              <span className="block">Addl: {item.AdditionalDisc || 0}%</span>
                            </td>
                            <td className="px-4 py-3">{formatCurrency(item.ItemAmount)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.OrderItemStatus === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : item.OrderItemStatus === 'Dispatched' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : item.OrderItemStatus === 'Processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>{item.OrderItemStatus}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                {(item as any).rack_location || '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                className="inline-flex items-center px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 text-xs font-medium transition-colors"
                                onClick={() => handleOpenItemStatusModal(item)}
                                title="View Item Status"
                              >
                                <span className="sr-only">View Status</span>
                                <Edit className="w-4 h-4 mr-1" />
                                Status
                              </button>
                            </td>
                          </tr>
                        )) : null}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Location Information */}
                {(selectedOrder.Latitude && selectedOrder.Longitude) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delivery Location</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-300" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          Coordinates: {selectedOrder.Latitude}, {selectedOrder.Longitude}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
                {user?.role !== 'retailer' && (
                  <button className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    <span>Edit Order</span>
                  </button>
                )}
                {user && ['admin', 'manager', 'storeman'].includes(user.role) && nextStatuses.length > 0 && (
                  <button
                    onClick={handleOpenStatusModal}
                    className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Change Status</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter className="w-5 h-5 text-[#003366] dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Status</option>
            <option value="New">New</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Hold">Hold</option>
            <option value="Picked">Picked</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Urgency</option>
            <option value="urgent">Urgent Only</option>
            <option value="normal">Normal Only</option>
          </select>
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <span className="font-medium">{filteredOrders.length}</span> orders found
          </div>
        </div>
      </div>

      {/* Loader for each API call */}
      {loading && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
          <div className="w-12 h-12 border-4 border-t-[#003366] border-gray-200 dark:border-gray-700 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading orders...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center flex flex-col items-center justify-center">
            <img
              src="/error-state.svg"
              alt="Error illustration"
              className="w-32 h-32 mx-auto mb-4 opacity-90"
              loading="lazy"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.10))' }}
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {!loading && !error && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  {user?.role !== 'retailer' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {Array.isArray(filteredOrders) ? filteredOrders.map((order) => (
                  <tr key={order.Order_Id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {/* Urgency icon in front of order number */}
                        {order.Urgent_Status ? (
                          <span className="inline-flex items-center" title="Urgent">
                            <Zap className="w-4 h-4 text-orange-500 mr-1" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center" title="Normal">
                            <Circle className="w-3 h-3 text-green-400 mr-1" />
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">#{order.Order_Id}</span>
                        {order.PO_Number && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">PO: {order.PO_Number}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.Order_Status)}`}>
                        {getStatusIcon(order.Order_Status)}
                        <span className="ml-1">{order.Order_Status}</span>
                      </span>
                    </td>
                    {user?.role !== 'retailer' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Cast order as OrderMasterWithUI for Branch_Name/Retailer_Name */}
                        <div className="text-sm text-gray-900 dark:text-gray-100">{(order as OrderMasterWithUI).Branch_Name || order.Branch || 'Not assigned'}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{(order as OrderMasterWithUI).Retailer_Name || `ID: ${order.Retailer_Id}` || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {order.Place_Date ? format(timestampToDate(order.Place_Date)!, 'MMM dd, yyyy') : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleViewOrder(order)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Order"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user && ['admin', 'manager', 'storeman'].includes(user.role) && (validTransitions[order.Order_Status as OrderStatus] || []).length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setNextStatuses(validTransitions[order.Order_Status as OrderStatus] || []);
                            setSelectedStatus((validTransitions[order.Order_Status as OrderStatus] || [])[0] || '');
                            setStatusNotes('');
                            setStatusError(null);
                            setShowStatusModal(true);
                          }}
                          className="ml-2 p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-[#003366] dark:text-blue-400"
                          title="Quick Change Status"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )) : null}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-12 flex flex-col items-center justify-center">
              <img
                src="/empty-state.svg"
                alt="No orders illustration"
                className="w-40 h-40 mx-auto mb-4 opacity-80"
                loading="lazy"
                style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
              />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No orders found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </div>
      )}

      {/* New Order Form Modal */}
      <NewOrderFormModal 
        isOpen={showNewOrderForm}
        onClose={() => setShowNewOrderForm(false)}
        onSubmit={handleNewOrder}
      />

      {/* Status Update Modal */}
      <Dialog open={showStatusModal} onClose={() => setShowStatusModal(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <DialogBackdrop className="fixed inset-0 bg-black opacity-30" />
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 max-w-md w-full z-10 border border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-lg font-bold mb-4">Update Order Status</DialogTitle>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Next Status</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nextStatuses.map(status => {
                  const colorClass = getOrderStatusColor(status);
                  // Use getStatusIcon (returns JSX icon)
                  const IconComponent = getStatusIcon(status);
                  const isSelected = selectedStatus === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      className={`relative group flex flex-col items-center w-full px-5 py-5 rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md ${isSelected ? colorClass + ' border-2 ring-2 ring-offset-2 ring-[#003366] bg-opacity-90' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'} `}
                      onClick={() => setSelectedStatus(status)}
                      style={{ fontWeight: isSelected ? 600 : 400, boxShadow: isSelected ? '0 4px 16px rgba(0,51,102,0.10)' : '0 1px 4px rgba(0,0,0,0.04)' }}
                      aria-pressed={isSelected}
                      tabIndex={0}
                    >
                      <span className={`flex items-center justify-center w-12 h-12 rounded-full mb-2 transition-all ${isSelected ? colorClass + ' shadow-lg scale-105' : 'bg-gray-100 dark:bg-gray-700 text-[#003366] dark:text-blue-300'}`}>
                        {IconComponent && React.cloneElement(IconComponent, { className: 'w-7 h-7' })}
                      </span>
                      <span className={`capitalize text-base font-semibold mb-1 ${isSelected ? 'text-[#003366] dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'}`}>{status}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 text-center min-h-[32px]">
                        {(() => {
                          switch (status) {
                            case 'New': return 'Order created, awaiting processing';
                            case 'Pending': return 'Waiting for confirmation';
                            case 'Processing': return 'Being processed and prepared';
                            case 'Completed': return 'Order completed successfully';
                            case 'Hold': return 'On hold, pending review';
                            case 'Picked': return 'Items picked from inventory';
                            case 'Dispatched': return 'Dispatched for delivery';
                            case 'Cancelled': return 'Order has been cancelled';
                            default: return 'Status unknown';
                          }
                        })()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                value={statusNotes}
                onChange={e => setStatusNotes(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2"
                rows={2}
              />
            </div>
            {statusError && <div className="text-red-600 text-sm mb-2">{statusError}</div>}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={statusLoading}
              >Cancel</button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-blue-800"
                disabled={statusLoading || !selectedStatus}
              >{statusLoading ? 'Updating...' : 'Update Status'}</button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Item Status Modal */}
      <ItemStatusModal
        item={selectedOrderItem as any}
        open={showItemStatusModal}
        onClose={handleCloseItemStatusModal}
      />
    </div>
    </>
  );
};