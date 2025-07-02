import React from 'react';
import { OrderTimeline } from './OrderTimeline';
import { OrderStatusModal } from './OrderStatusModal';
// TODO: Import services and types as needed

export const OrderDetails = ({ order, onClose }: { order: any; onClose?: () => void }) => {
  // Example statusHistory, replace with real data
  const statusHistory = order.statusHistory || [];

  const [showStatusModal, setShowStatusModal] = React.useState(false);

  const handleStatusUpdated = (newStatus: string) => {
    // Update local order status and statusHistory
    // TODO: Fetch or update order in parent state if needed
  };

  // TODO: Implement status timeline, details, actions
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 relative">
      <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white" onClick={onClose}>×</button>
      <h2 className="text-xl font-bold mb-2">Order {order.CRMOrderId}</h2>
      <div className="mb-4 text-gray-700 dark:text-gray-200">Status: {order.Order_Status}</div>
      <OrderTimeline statusHistory={statusHistory} />
      <button className="btn btn-primary" onClick={() => setShowStatusModal(true)}>Update Status</button>
      {showStatusModal && <OrderStatusModal orderId={order.Order_Id} currentStatus={order.Order_Status} onClose={() => setShowStatusModal(false)} onStatusUpdated={handleStatusUpdated} />}
      {/* TODO: customer info, items, actions */}
    </div>
  );
};
