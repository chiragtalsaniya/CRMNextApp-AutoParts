import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Filter,
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { OrderStatus } from '../../types';
import { exportToExcel, exportToPDF, exportToWord } from '../../utils/exportUtils';

import { OrderMaster, OrderItem } from '../../types';

const mockOrders: OrderMaster[] = [
  {
    Order_Id: 1,
    CRMOrderId: 'ORD-2024-001',
    Retailer_Id: 1,
    Place_By: 'Admin',
    Place_Date: Date.parse('2024-01-15T10:30:00Z'),
    Order_Status: 'Completed',
    Branch: 'Main',
    Remark: 'Delivered on time',
    PO_Number: 'PO-001',
    Urgent_Status: false,
  },
  {
    Order_Id: 2,
    CRMOrderId: 'ORD-2024-002',
    Retailer_Id: 2,
    Place_By: 'Admin',
    Place_Date: Date.parse('2024-01-14T14:15:00Z'),
    Order_Status: 'Dispatched',
    Branch: 'Main',
    Remark: '',
    PO_Number: 'PO-002',
    Urgent_Status: false,
  },
  {
    Order_Id: 3,
    CRMOrderId: 'ORD-2024-003',
    Retailer_Id: 3,
    Place_By: 'Manager',
    Place_Date: Date.parse('2024-01-13T09:20:00Z'),
    Order_Status: 'Processing',
    Branch: 'Main',
    Remark: '',
    PO_Number: 'PO-003',
    Urgent_Status: true,
  },
  {
    Order_Id: 4,
    CRMOrderId: 'ORD-2024-004',
    Retailer_Id: 1,
    Place_By: 'Admin',
    Place_Date: Date.parse('2024-01-12T16:45:00Z'),
    Order_Status: 'Pending',
    Branch: 'Main',
    Remark: '',
    PO_Number: 'PO-004',
    Urgent_Status: false,
  },
  {
    Order_Id: 5,
    CRMOrderId: 'ORD-2024-005',
    Retailer_Id: 4,
    Place_By: 'Manager',
    Place_Date: Date.parse('2024-01-11T11:30:00Z'),
    Order_Status: 'Completed',
    Branch: 'Main',
    Remark: '',
    PO_Number: 'PO-005',
    Urgent_Status: false,
  },
];

const mockOrderItems: OrderItem[] = [
  { Order_Item_Id: 1, Order_Id: 1, Part_Admin: 'NGK Spark Plug', Order_Qty: 4, ItemAmount: 51.96, MRP: 12.99 },
  { Order_Item_Id: 2, Order_Id: 1, Part_Admin: 'Brake Pads - Front', Order_Qty: 2, ItemAmount: 91.98, MRP: 45.99 },
  { Order_Item_Id: 3, Order_Id: 2, Part_Admin: 'Oil Filter', Order_Qty: 10, ItemAmount: 89.90, MRP: 8.99 },
  { Order_Item_Id: 4, Order_Id: 3, Part_Admin: 'NGK Spark Plug', Order_Qty: 8, ItemAmount: 103.92, MRP: 12.99 },
  { Order_Item_Id: 5, Order_Id: 3, Part_Admin: 'Air Filter', Order_Qty: 6, ItemAmount: 95.58, MRP: 15.99 },
  { Order_Item_Id: 6, Order_Id: 4, Part_Admin: 'Brake Pads - Front', Order_Qty: 1, ItemAmount: 45.99, MRP: 45.99 },
  { Order_Item_Id: 7, Order_Id: 4, Part_Admin: 'Oil Filter', Order_Qty: 2, ItemAmount: 17.98, MRP: 8.99 },
  { Order_Item_Id: 8, Order_Id: 5, Part_Admin: 'NGK Spark Plug', Order_Qty: 12, ItemAmount: 155.88, MRP: 12.99 },
  { Order_Item_Id: 9, Order_Id: 5, Part_Admin: 'Air Filter', Order_Qty: 18, ItemAmount: 287.82, MRP: 15.99 },
];

interface ReportFilters {
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate: string;
  endDate: string;
  status: OrderStatus | 'all';
  storeId: string;
  salesmanId: string;
  retailerId: string;
}

export const OrderReports: React.FC = () => {
  const [orders] = useState<OrderMaster[]>(mockOrders);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status: 'all',
    storeId: 'all',
    salesmanId: 'all',
    retailerId: 'all'
  });
  const [isExporting, setIsExporting] = useState(false);
  const { appearance } = useTheme();

  // ...existing code...

  // Example: Add dark: classes to main containers, tables, and filter controls
  // <div className="bg-white dark:bg-gray-900 ...">
  // <input className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white ..." />

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Auto-set date ranges for predefined periods
      if (key === 'dateRange') {
        const today = new Date();
        switch (value) {
          case 'today':
            newFilters.startDate = format(today, 'yyyy-MM-dd');
            newFilters.endDate = format(today, 'yyyy-MM-dd');
            break;
          case 'week':
            newFilters.startDate = format(subDays(today, 7), 'yyyy-MM-dd');
            newFilters.endDate = format(today, 'yyyy-MM-dd');
            break;
          case 'month':
            newFilters.startDate = format(startOfMonth(today), 'yyyy-MM-dd');
            newFilters.endDate = format(endOfMonth(today), 'yyyy-MM-dd');
            break;
          case 'quarter':
            const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
            newFilters.startDate = format(quarterStart, 'yyyy-MM-dd');
            newFilters.endDate = format(today, 'yyyy-MM-dd');
            break;
          case 'year':
            newFilters.startDate = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
            newFilters.endDate = format(today, 'yyyy-MM-dd');
            break;
        }
      }
      
      return newFilters;
    });
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = order.Place_Date ? new Date(order.Place_Date) : new Date();
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    const matchesDate = orderDate >= startDate && orderDate <= endDate;
    const matchesStatus = filters.status === 'all' || order.Order_Status === filters.status;
    return matchesDate && matchesStatus;
  });

  const getOrderStats = () => {
    const totalOrders = filteredOrders.length;
    // Calculate total revenue from mockOrderItems for filtered orders
    const filteredOrderIds = new Set(filteredOrders.map(o => o.Order_Id));
    const totalRevenue = mockOrderItems
      .filter(item => item.Order_Id && filteredOrderIds.has(item.Order_Id))
      .reduce((sum, item) => sum + (item.ItemAmount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const statusCounts = filteredOrders.reduce((acc, order) => {
      const status = order.Order_Status || 'Pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);
    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      statusCounts
    };
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'word') => {
    setIsExporting(true);
    try {
      // For export, we need to provide both orders and orderItems (flattened)
      // Use mockOrderItems for export (since mockOrders don't have .items)
      const filteredOrderIds = new Set(filteredOrders.map(o => o.Order_Id));
      const exportOrderItems = mockOrderItems.filter(item => item.Order_Id && filteredOrderIds.has(item.Order_Id));
      const reportData = {
        orders: filteredOrders,
        orderItems: exportOrderItems,
        filters,
        stats: getOrderStats(),
        generatedAt: new Date().toISOString()
      };

      switch (format) {
        case 'excel':
          await exportToExcel(reportData, 'order-report');
          break;
        case 'pdf':
          await exportToPDF(reportData, 'order-report');
          break;
        case 'word':
          await exportToWord(reportData, 'order-report');
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = getOrderStats();


  return (
    <div className={`space-y-6 bg-white dark:bg-gray-900 min-h-screen transition-colors duration-200${appearance && appearance.compactMode ? ' space-y-3' : ''}`} style={{ fontSize: 'var(--app-font-size)' }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and export comprehensive order reports</p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            className="flex items-center px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366]"
            style={{ marginRight: 8 }}
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Filter className="w-6 h-6 text-[#003366] dark:text-blue-200" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Report Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {filters.dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Order Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.statusCounts.Completed || 0}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-[#003366] dark:text-blue-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Report</h3>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-300">
            {filteredOrders.length} orders found
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            title="Export to Excel"
            className="flex w-full items-center px-4 py-3 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800 transition-colors font-medium space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-300 mr-2" />
            <div className="text-left">
              <p className="font-medium">Export to Excel</p>
              <p className="text-sm opacity-90 dark:text-gray-300">Detailed spreadsheet with charts</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            title="Export to PDF"
            className="flex w-full items-center px-4 py-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-800 transition-colors font-medium space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <div className="text-left">
              <p className="font-medium">Export to PDF</p>
              <p className="text-sm opacity-90 dark:text-gray-300">Professional report format</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleExport('word')}
            disabled={isExporting}
            title="Export to Word"
            className="flex w-full items-center px-4 py-3 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors font-medium space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-300 mr-2" />
            <div className="text-left">
              <p className="font-medium">Export to Word</p>
              <p className="text-sm opacity-90 dark:text-gray-300">Editable document format</p>
            </div>
          </button>
        </div>

        {isExporting && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-gray-600">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#003366] rounded-full animate-spin"></div>
            <span>Generating report...</span>
          </div>
        )}
      </div>

      {/* Order Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-[#003366]" />
            <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.slice(0, 10).map((order) => (
                <tr key={order.Order_Id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.CRMOrderId || order.Order_Id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.Place_Date ? format(new Date(order.Place_Date), 'MMM dd, yyyy') : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.Order_Status === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.Order_Status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                      order.Order_Status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.Order_Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mockOrderItems.filter(item => item.Order_Id === order.Order_Id).length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${mockOrderItems.filter(item => item.Order_Id === order.Order_Id).reduce((sum, item) => sum + (item.ItemAmount || 0), 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 10 && (
          <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
            Showing 10 of {filteredOrders.length} orders. Export for complete data.
          </div>
        )}
      </div>
    </div>
  );
};