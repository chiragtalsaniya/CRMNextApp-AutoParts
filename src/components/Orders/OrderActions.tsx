import React from 'react';

export const OrderActions = ({ order, onStatus, onEdit, onCancel }: { order: any; onStatus: () => void; onEdit: () => void; onCancel: () => void }) => {
  // TODO: Add role-based logic for button visibility
  return (
    <div className="flex space-x-2 mt-2">
      <button className="text-blue-600 dark:text-blue-400 text-xs" onClick={onEdit}>Edit</button>
      <button className="text-yellow-600 dark:text-yellow-400 text-xs" onClick={onStatus}>Status</button>
      <button className="text-red-600 dark:text-red-400 text-xs" onClick={onCancel}>Cancel</button>
    </div>
  );
};
