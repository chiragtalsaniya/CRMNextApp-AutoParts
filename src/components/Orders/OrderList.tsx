import React, { useEffect, useState } from 'react';
import { fetchOrders } from '../../services/orders';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';
import { OrderStats } from './OrderStats';
import { OrderCreate } from './OrderCreate';
import { OrderDetails } from './OrderDetails';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetchOrders(filters).then((data: any) => {
      setOrders(data.orders || []);
      setLoading(false);
    });
  }, [filters]);

  return (
    <div className="space-y-6">
      <OrderStats orders={orders} />
      <OrderFilters filters={filters} setFilters={setFilters} />
      <div className="flex justify-end mb-4">
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Order</button>
      </div>
      {showCreate && <OrderCreate onClose={() => setShowCreate(false)} />}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div>Loading...</div>
        ) : (
          orders.map((order: any) => (
            <OrderCard key={order.Order_Id} order={order} onView={() => setSelectedOrder(order)} />
          ))
        )}
      </div>
      {selectedOrder && <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};
