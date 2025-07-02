import api from './api';
import { OrdersApiResponse } from './orders.d';

export async function fetchOrders(filters: any = {}): Promise<OrdersApiResponse> {
  // Map filters to API params as needed
  const response = await api.get('/orders', { params: filters });
  return response.data;
}

export async function createOrder(orderData: any) {
  const response = await api.post('/orders', orderData);
  return response.data;
}

export async function updateOrderStatus(id: number, status: string, notes?: string) {
  const response = await api.patch(`/orders/${id}/status`, { status, notes });
  return response.data;
}
