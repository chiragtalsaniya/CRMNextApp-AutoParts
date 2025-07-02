import React, { useState } from 'react';
import { updateOrderStatus } from '../../services/orders';

export const OrderStatusModal = ({ orderId, currentStatus, onClose, onStatusUpdated }: { orderId: number; currentStatus: string; onClose: () => void; onStatusUpdated: (status: string) => void }) => {
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const validStatuses = ['New', 'Pending', 'Processing', 'Hold', 'Picked', 'Dispatched', 'Completed', 'Cancelled'];

  const handleUpdate = async () => {
    setLoading(true);
    await updateOrderStatus(orderId, newStatus, notes);
    setLoading(false);
    onStatusUpdated(newStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>
        <select className="w-full mb-3 p-2 border rounded" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
          <option value="">Select status</option>
          {validStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <textarea className="w-full mb-3 p-2 border rounded" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
        <div className="flex justify-end space-x-2">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={loading || !newStatus}>{loading ? 'Updating...' : 'Update'}</button>
        </div>
      </div>
    </div>
  );
};
