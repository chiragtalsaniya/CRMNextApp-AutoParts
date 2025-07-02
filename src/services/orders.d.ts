import { Order } from '../types/order';

export interface OrdersApiResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
