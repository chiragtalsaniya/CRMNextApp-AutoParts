import React from 'react';

export const OrderStats = ({ orders }: { orders: any[] }) => {
  const totalOrders = orders.length;
  const newOrders = orders.filter(o => o.Order_Status?.toLowerCase() === 'new').length;
  const processingOrders = orders.filter(o => ['processing', 'picked'].includes(o.Order_Status?.toLowerCase())).length;
  const completedOrders = orders.filter(o => ['completed', 'dispatched'].includes(o.Order_Status?.toLowerCase())).length;

  return (
    <div className="flex space-x-4">
      <StatCard title="Total" value={totalOrders} color="#667eea" />
      <StatCard title="New" value={newOrders} color="#3b82f6" />
      <StatCard title="Processing" value={processingOrders} color="#8b5cf6" />
      <StatCard title="Completed" value={completedOrders} color="#10b981" />
    </div>
  );
};

const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
  <div className="rounded-lg p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col items-center" style={{ borderColor: color }}>
    <span className="text-lg font-bold" style={{ color }}>{value}</span>
    <span className="text-xs text-gray-500 dark:text-gray-300">{title}</span>
  </div>
);
