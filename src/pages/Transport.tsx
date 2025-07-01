import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Transport {
  id: number;
  store_id: string;
  type: string;
  provider: string;
  contact_number: string;
  created_at: string;
  updated_at: string;
}

export const TransportPage: React.FC = () => {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransports();
  }, []);

  const fetchTransports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/transport');
      setTransports(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transport data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transport Management</h1>
        {/* Add button for new transport (future) */}
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transports.map((t) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.store_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.provider}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.contact_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.created_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransportPage;
