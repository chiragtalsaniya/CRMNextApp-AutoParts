import React, { useState, useEffect } from 'react';
import { fetchParts } from '../../services/parts';

export const PartsCatalog = ({ onAdd }: { onAdd: (item: any) => void }) => {
  const [parts, setParts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  useEffect(() => {
    fetchParts(search).then(setParts);
  }, [search]);
  return (
    <div>
      <input
        type="text"
        className="w-full px-2 py-1 mb-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        placeholder="Search part..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="max-h-40 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {parts.map(p => (
          <div
            key={p.Part_Number}
            className="p-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
            onClick={() => onAdd({ part_number: p.Part_Number, part_name: p.Part_Name, quantity: 1, unitPrice: p.MRP })}
          >
            <div className="font-medium">{p.Part_Name}</div>
            <div className="text-xs text-gray-500">{p.Part_Number} • ₹{p.MRP}</div>
          </div>
        ))}
        {parts.length === 0 && <div className="text-xs text-gray-400 p-2">No parts found.</div>}
      </div>
    </div>
  );
};
