import React from 'react';
import { Package, MapPin, BarChart3, TrendingUp, ShoppingCart, TrendingDown, AlertTriangle, Clock, X, Edit } from 'lucide-react';
import { ItemStatus, getStockLevelColor, formatStockDisplay, timestampToDate } from '../../types';
import { format } from 'date-fns';

interface ItemStatusModalProps {
  item: Partial<ItemStatus> | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  editable?: boolean;
}

export const ItemStatusModal: React.FC<ItemStatusModalProps> = ({ item, open, onClose, onEdit, editable }) => {
  if (!open || !item) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transition-colors">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#003366] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{item.Part_Name || item.Part_Salesman || 'Item'}</h2>
              <p className="text-gray-600 dark:text-gray-400">{item.Part_No || item.Part_Admin}</p>
              {item.stock_level && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStockLevelColor(item.stock_level)}`}>
                  {item.stock_level?.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Total Stock</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{item.total_stock}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-300">Stock %</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{item.stock_percentage}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600 dark:text-green-300" />
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Max Stock</p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{item.max_stock}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 dark:text-orange-300">Rack</p>
                  <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{item.Part_Rack || item.rack_location || 'N/A'}</p>
                </div>
                <MapPin className="w-8 h-8 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Stock Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Level A</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.Part_A || item.stock_level_a || '0'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Level B</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.Part_B || item.stock_level_b || '0'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Level C</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.Part_C || item.stock_level_c || '0'}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Part Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</p>
                  <p className="text-gray-900 dark:text-gray-100">{item.Part_Catagory || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Focus Group</p>
                  <p className="text-gray-900 dark:text-gray-100">{item.Focus_Group || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price</p>
                  <p className="text-gray-900 dark:text-gray-100">${((item.Part_Price || 0) / 100).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h3>
              <div className="space-y-3">
                {item.LastSale && (
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Sale</p>
                      <p className="text-gray-900 dark:text-gray-100">{format(timestampToDate(item.LastSale)!, 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  </div>
                )}
                {item.LastPurchase && (
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Purchase</p>
                      <p className="text-gray-900 dark:text-gray-100">{format(timestampToDate(item.LastPurchase)!, 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {item.Narr && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-700 dark:text-gray-200">{item.Narr}</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
          {editable && (
            <button
              onClick={onEdit}
              className="px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Item</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
