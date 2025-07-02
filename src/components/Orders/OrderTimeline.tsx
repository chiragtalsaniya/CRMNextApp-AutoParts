import React from 'react';

export const OrderTimeline = ({ statusHistory }: { statusHistory: any[] }) => {
  return (
    <ol className="relative border-l border-gray-200 dark:border-gray-700">
      {statusHistory.map((item, idx) => (
        <li key={idx} className="mb-6 ml-6">
          <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full ring-8 ring-white dark:ring-gray-900">
            {idx + 1}
          </span>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-white">{item.status}</span>
            <span className="text-xs text-gray-500 dark:text-gray-300">{new Date(item.timestamp).toLocaleString()}</span>
            <span className="text-xs text-gray-400">{item.updatedBy}</span>
            <span className="text-xs text-gray-400 italic">{item.notes}</span>
          </div>
        </li>
      ))}
    </ol>
  );
};
