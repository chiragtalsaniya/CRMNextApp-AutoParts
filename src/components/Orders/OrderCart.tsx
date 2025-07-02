import React from 'react';

interface CartItem {
  part_number: string;
  part_name: string;
  quantity: number;
  unitPrice: number;
}

export const OrderCart = ({ cart, setCart }: { cart: CartItem[]; setCart: (c: CartItem[]) => void }) => {
  // Handler to update quantity
  const updateQuantity = (idx: number, qty: number) => {
    setCart(cart.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
  };
  // Handler to remove item
  const removeItem = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };
  // Handler to add dummy item (for demo, replace with real catalog integration)
  const addItem = () => {
    setCart([
      ...cart,
      { part_number: 'BP-001', part_name: 'Brake Pad', quantity: 1, unitPrice: 100 }
    ]);
  };
  const total = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return (
    <div className="space-y-2">
      <button className="btn btn-sm btn-outline" onClick={addItem}>+ Add Part (Demo)</button>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {cart.length === 0 && <div className="text-gray-400 text-sm">No items in cart.</div>}
        {cart.map((item, idx) => (
          <div key={item.part_number} className="flex items-center py-2">
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">{item.part_name}</div>
              <div className="text-xs text-gray-500">{item.part_number}</div>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={e => updateQuantity(idx, Number(e.target.value))}
              className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white mx-2"
            />
            <div className="w-20 text-right text-gray-700 dark:text-gray-200">₹{item.unitPrice}</div>
            <button className="ml-2 text-red-500 text-xs" onClick={() => removeItem(idx)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="flex justify-end font-semibold text-gray-900 dark:text-white">Total: ₹{total}</div>
    </div>
  );
};
