import React, { useEffect, useState, ChangeEvent } from 'react';
import { transportAPI, storesAPI } from '../services/api';
import { Transport, Store } from '../types';
import { Plus, Edit, Trash2, Eye, X, Filter } from 'lucide-react';

export const TransportPage: React.FC = () => {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeMap, setStoreMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ store_id: '', type: '', provider: '' });
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Transport | null>(null);
  const [form, setForm] = useState<Partial<Transport>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Transport | null>(null);

  // Predefined transport types
  const TRANSPORT_TYPES = ['Truck', 'Van', 'Bike', 'Courier', 'Other'];

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    fetchTransports();
  }, [filter]);

  const fetchStores = async () => {
    try {
      const res = await storesAPI.getStores();
      // Support both .stores and direct array
      const storeList: Store[] = res.data.stores || res.data || [];
      setStores(storeList);
      const map: Record<string, string> = {};
      storeList.forEach(s => {
        if (s.Branch_Code && s.Branch_Name) map[s.Branch_Code] = s.Branch_Name;
      });
      setStoreMap(map);
    } catch (err) {
      setError('Failed to load stores');
    }
  };

  const fetchTransports = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filter).filter(([_, v]) => v));
      const res = await transportAPI.getTransports(params);
      setTransports(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transport data');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm({ store_id: '', type: '', provider: '', contact_number: '' });
    setModalMode('add');
    setShowModal(true);
  };
  const openEdit = (t: Transport) => {
    setForm(t);
    setSelected(t);
    setModalMode('edit');
    setShowModal(true);
  };
  const openView = (t: Transport) => {
    setSelected(t);
    setModalMode('view');
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setModalMode(null);
    setSelected(null);
    setForm({});
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilter(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Validation for required fields
  const validateForm = () => {
    if (!form.store_id || !form.type || !form.provider || !form.contact_number) {
      setError('All fields are required.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await transportAPI.createTransport(form);
      } else if (modalMode === 'edit' && selected) {
        await transportAPI.updateTransport(selected.id, form);
      }
      await fetchTransports();
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save transport');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await transportAPI.deleteTransport(confirmDelete.id);
      await fetchTransports();
      setConfirmDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete transport');
    } finally {
      setDeleting(false);
    }
  };

  const filteredTransports = transports.filter(t =>
    (!filter.store_id || t.store_id === filter.store_id) &&
    (!filter.type || t.type === filter.type) &&
    (!filter.provider || t.provider?.toLowerCase().includes(filter.provider.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transport Management</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={openAdd}
        >
          <Plus className="w-5 h-5 mr-2" /> Add Transport
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-center">
        <Filter className="w-5 h-5 text-blue-600" />
        <select
          name="store_id"
          value={filter.store_id}
          onChange={handleFilterChange}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="">All Stores</option>
          {stores.map(s => (
            <option key={s.Branch_Code} value={s.Branch_Code}>{s.Branch_Name}</option>
          ))}
        </select>
        <select
          name="type"
          value={filter.type}
          onChange={handleFilterChange}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="">All Types</option>
          {TRANSPORT_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <input
          name="provider"
          value={filter.provider}
          onChange={handleFilterChange}
          placeholder="Provider"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <button
          className="ml-auto px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 font-medium"
          onClick={() => setFilter({ store_id: '', type: '', provider: '' })}
        >Clear</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : filteredTransports.length === 0 ? (
        <div className="text-gray-500 text-center py-12">No transport records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransports.map((t) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{storeMap[t.store_id] || t.store_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.provider}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.contact_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.created_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.updated_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      className="inline-flex items-center p-2 rounded-lg hover:bg-gray-100 text-blue-600 mr-1"
                      title="View"
                      onClick={() => openView(t)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="inline-flex items-center p-2 rounded-lg hover:bg-yellow-100 text-yellow-600 mr-1"
                      title="Edit"
                      onClick={() => openEdit(t)}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="inline-flex items-center p-2 rounded-lg hover:bg-red-100 text-red-600"
                      title="Delete"
                      onClick={() => setConfirmDelete(t)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit/View */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
              onClick={closeModal}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">
              {modalMode === 'add' && 'Add Transport'}
              {modalMode === 'edit' && 'Edit Transport'}
              {modalMode === 'view' && 'View Transport'}
            </h2>
            <form
              className="space-y-4"
              onSubmit={e => { e.preventDefault(); if (modalMode !== 'view') handleSave(); }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                <select
                  name="store_id"
                  value={form.store_id || ''}
                  onChange={handleChange}
                  disabled={modalMode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                >
                  <option value="">Select Store</option>
                  {stores.map(s => (
                    <option key={s.Branch_Code} value={s.Branch_Code}>{s.Branch_Name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={form.type || ''}
                  onChange={handleChange}
                  disabled={modalMode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                >
                  <option value="">Select Type</option>
                  {TRANSPORT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <input
                  name="provider"
                  value={form.provider || ''}
                  onChange={handleChange}
                  disabled={modalMode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  name="contact_number"
                  value={form.contact_number || ''}
                  onChange={handleChange}
                  disabled={modalMode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
              </div>
              {modalMode !== 'view' && (
                <button
                  type="submit"
                  className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (modalMode === 'add' ? 'Add' : 'Update')}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative">
            <h3 className="text-lg font-bold mb-4">Delete Transport</h3>
            <p className="mb-6">Are you sure you want to delete <span className="font-semibold">{confirmDelete.provider}</span> ({confirmDelete.type})?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={handleDelete}
                disabled={deleting}
              >{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransportPage;
