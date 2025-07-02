import React from 'react';
import { getOrderStatusColor } from '../../utils/orderUtils';
import { OrderActions } from './OrderActions';

export const OrderCard = ({ order, onView }: { order: any; onView?: () => void }) => {
  const { color, bgColor } = getOrderStatusColor(order.Order_Status);
  return (
    <div className="rounded-lg shadow-md p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-lg" style={{ color }}>{order.CRMOrderId}</span>
        <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: bgColor, color }}>{order.Order_Status}</span>
      </div>
      <div className="text-gray-700 dark:text-gray-200 text-sm">{order.Retailer_Name}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{order.Branch_Name} • {order.Company_Name}</div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs">PO: {order.PO_Number}</span>
        <span className="text-xs">{new Date(order.PO_Date).toLocaleDateString()}</span>
      </div>
      <div className="flex space-x-2 mt-2">
        <button className="text-blue-600 dark:text-blue-400 text-xs" onClick={onView}>View</button>
        <OrderActions order={order} onStatus={() => {}} onEdit={() => {}} onCancel={() => {}} />
      </div>
    </div>
  );
};
