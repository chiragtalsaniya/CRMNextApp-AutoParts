export const orderColors = {
  new: { color: '#3b82f6', bgColor: '#dbeafe' },
  pending: { color: '#f59e0b', bgColor: '#fef3c7' },
  processing: { color: '#8b5cf6', bgColor: '#ede9fe' },
  completed: { color: '#10b981', bgColor: '#dcfce7' },
  hold: { color: '#f59e0b', bgColor: '#fef3c7' },
  picked: { color: '#059669', bgColor: '#dcfce7' },
  dispatched: { color: '#8b5cf6', bgColor: '#ede9fe' },
  cancelled: { color: '#ef4444', bgColor: '#fee2e2' },
};

export function getOrderStatusColor(status: string): { color: string; bgColor: string } {
  const key = status?.toLowerCase() as keyof typeof orderColors;
  return orderColors[key] || { color: '#6b7280', bgColor: '#f3f4f6' };
}
