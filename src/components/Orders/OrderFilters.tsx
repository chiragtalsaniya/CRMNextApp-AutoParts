import React, { useState } from 'react';

const statusOptions = [
  'All', 'New', 'Pending', 'Processing', 'Hold', 'Picked', 'Dispatched', 'Completed', 'Cancelled'
];

export const OrderFilters = ({ filters, setFilters }: { filters: any; setFilters: (f: any) => void }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        placeholder="Order #, Retailer, Contact..."
        className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        value={filters.search || ''}
        onChange={e => setFilters((prev: any) => ({ ...prev, search: e.target.value }))}
      />
      <select
        className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        value={filters.status || 'All'}
        onChange={e => setFilters((prev: any) => ({ ...prev, status: e.target.value }))}
      >
        {statusOptions.map(status => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
      <input
        type="date"
        className="px-2 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        value={filters.date || ''}
        onChange={e => setFilters((prev: any) => ({ ...prev, date: e.target.value }))}
      />
      <button
        className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
        onClick={() => setShowAdvanced(v => !v)}
        type="button"
      >
        Advanced
      </button>
      {showAdvanced && (
        <div className="absolute z-10 mt-2 p-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded shadow-lg flex flex-col gap-2">
          <label className="text-xs">Amount (min)</label>
          <input
            type="number"
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            value={filters.amountMin || ''}
            onChange={e => setFilters((prev: any) => ({ ...prev, amountMin: e.target.value }))}
          />
          <label className="text-xs">Amount (max)</label>
          <input
            type="number"
            className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            value={filters.amountMax || ''}
            onChange={e => setFilters((prev: any) => ({ ...prev, amountMax: e.target.value }))}
          />
          <button
            className="mt-2 px-3 py-1 rounded bg-blue-600 text-white text-xs"
            onClick={() => setShowAdvanced(false)}
            type="button"
          >
            Close
          </button>
        </div>
      )}
      {/* Active filter chips */}
      <div className="flex flex-wrap gap-1 ml-2">
        {Object.entries(filters).map(([key, value]) => (
          value && key !== 'search' && (
            <span key={key} className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-xs text-blue-800 dark:text-blue-200 flex items-center">
              {key}: {value}
              <button className="ml-1 text-xs" onClick={() => setFilters((prev: any) => ({ ...prev, [key]: '' }))}>×</button>
            </span>
          )
        ))}
      </div>
    </div>
  );
};
