import React, { useState, useEffect } from 'react';
import { fetchRetailers } from '../../services/retailers';

export const RetailerSelect = ({ value, onChange }: { value: any; onChange: (r: any) => void }) => {
  const [retailers, setRetailers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  useEffect(() => {
    fetchRetailers(search).then(setRetailers);
  }, [search]);
  return (
    <div>
      <input
        type="text"
        className="w-full px-2 py-1 mb-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        placeholder="Search retailer..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="max-h-40 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {retailers.map(r => (
          <div
            key={r.Retailer_Id}
            className={`p-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded ${value?.Retailer_Id === r.Retailer_Id ? 'bg-blue-50 dark:bg-blue-800' : ''}`}
            onClick={() => onChange(r)}
          >
            <div className="font-medium">{r.Retailer_Name}</div>
            <div className="text-xs text-gray-500">{r.Contact_Person}</div>
          </div>
        ))}
        {retailers.length === 0 && <div className="text-xs text-gray-400 p-2">No retailers found.</div>}
      </div>
    </div>
  );
};
