import React from 'react';
import { getOrderStatusColor } from '../../utils/orderUtils';
export const OrderStatusBadge = ({ status }: { status: string }) => {
  const { color, bgColor } = getOrderStatusColor(status);
  return <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: bgColor, color }}>{status}</span>;
};
