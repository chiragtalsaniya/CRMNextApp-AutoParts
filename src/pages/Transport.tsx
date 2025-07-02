import React, { useEffect, useState, ChangeEvent } from 'react';
import { transportAPI, storesAPI } from '../services/api';
import { Transport, Store } from '../types';
import { Plus, Edit, Trash2, Eye, X, Filter, Truck, Bike, Car, Package, Send, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

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

  // Helper for type icon and color
  const typeIconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    Truck: { icon: <Truck className="w-5 h-5" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    Van: { icon: <Car className="w-5 h-5" />, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    Bike: { icon: <Bike className="w-5 h-5" />, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    Courier: { icon: <Send className="w-5 h-5" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
    Other: { icon: <Package className="w-5 h-5" />, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  };

  function formatContactNumbers(contact: string | undefined) {
    if (!contact) return '';
    return contact.split(/[,;\s]+/).filter(Boolean).join(', ');
  }

  function readableDate(date: string | undefined) {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd MMM yyyy, hh:mm a');
    } catch {
      return date;
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-1">Transport Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage all transport providers and vehicles for your stores.</p>
        </div>
        <button
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
          onClick={openAdd}
        >
          <Plus className="w-5 h-5 mr-2" /> Add Transport
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 p-4 flex flex-wrap gap-4 items-center mb-6">
        <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <select
          name="store_id"
          value={filter.store_id}
          onChange={handleFilterChange}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none min-w-[160px]"
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
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none min-w-[120px]"
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
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none min-w-[160px]"
        />
        <button
          className="ml-auto px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium"
          onClick={() => setFilter({ store_id: '', type: '', provider: '' })}
        >Clear</button>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex flex-col items-center py-16">
          <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          <span className="text-gray-500 dark:text-gray-300">Loading transport records...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16">
          <svg className="h-8 w-8 text-red-500 dark:text-red-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" /></svg>
          <span className="text-red-600 dark:text-red-400">{error}</span>
        </div>
      ) : filteredTransports.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <svg className="h-10 w-10 text-gray-300 dark:text-gray-700 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 018 0v2M9 17H7a2 2 0 01-2-2v-5a2 2 0 012-2h10a2 2 0 012 2v5a2 2 0 01-2 2h-2m-6 0v2a2 2 0 002 2h0a2 2 0 002-2v-2" /></svg>
          <span className="text-gray-500 dark:text-gray-400 text-center">No transport records found.<br />Try adjusting your filters or add a new transport.</span>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Store</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact Number</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTransports.map((t) => {
                const typeMeta = typeIconMap[t.type] || { icon: <HelpCircle className="w-5 h-5" />, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
                return (
                  <tr key={t.id} className="hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{t.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">{t.provider}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${typeMeta.color}`}>
                        {typeMeta.icon} {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{storeMap[t.store_id] || t.store_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{formatContactNumbers(t.contact_number)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        className="inline-flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 mr-1"
                        title="View"
                        onClick={() => openView(t)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="inline-flex items-center p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900 text-yellow-600 dark:text-yellow-400 mr-1"
                        title="Edit"
                        onClick={() => openEdit(t)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="inline-flex items-center p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                        title="Delete"
                        onClick={() => setConfirmDelete(t)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Add/Edit/View */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200 dark:border-gray-700">
            <button
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              onClick={closeModal}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
              {modalMode === 'add' && 'Add Transport'}
              {modalMode === 'edit' && 'Edit Transport'}
              {modalMode === 'view' && 'View Transport'}
            </h2>
            {error && modalMode !== 'view' && <div className="text-red-600 dark:text-red-400 text-sm mb-2 text-center">{error}</div>}
            {modalMode === 'view' ? (
              <div className="space-y-4 text-gray-900 dark:text-gray-100">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{selected?.id}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Provider</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{selected?.provider}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Type</span>
                  <span className={`inline-flex items-center gap-2 font-semibold px-2 py-1 rounded-lg text-sm ${typeIconMap[selected?.type || 'Other']?.color}`}>{typeIconMap[selected?.type || 'Other']?.icon} {selected?.type}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Store</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{storeMap[selected?.store_id || ''] || selected?.store_id}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Contact Number</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 whitespace-pre-line">{formatContactNumbers(selected?.contact_number)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Created At</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{readableDate(selected?.created_at)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Updated At</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{readableDate(selected?.updated_at)}</span>
                </div>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={e => { e.preventDefault(); if (modalMode === 'add' || modalMode === 'edit') handleSave(); }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Store <span className="text-red-500">*</span></label>
                  <select
                    name="store_id"
                    value={form.store_id || ''}
                    onChange={handleChange}
                    disabled={modalMode === 'view' as typeof modalMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                  >
                    <option value="">Select Store</option>
                    {stores.map(s => (
                      <option key={s.Branch_Code} value={s.Branch_Code}>{s.Branch_Name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Type <span className="text-red-500">*</span></label>
                  <select
                    name="type"
                    value={form.type || ''}
                    onChange={handleChange}
                    disabled={modalMode === 'view' as typeof modalMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                  >
                    <option value="">Select Type</option>
                    {TRANSPORT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Provider <span className="text-red-500">*</span></label>
                  <input
                    name="provider"
                    value={form.provider || ''}
                    onChange={handleChange}
                    disabled={modalMode === 'view' as typeof modalMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                    placeholder="Provider name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Contact Number <span className="text-red-500">*</span></label>
                  <input
                    name="contact_number"
                    value={form.contact_number || ''}
                    onChange={handleChange}
                    disabled={modalMode === 'view' as typeof modalMode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                    placeholder="Contact number"
                  />
                </div>
                {(modalMode === 'add' || modalMode === 'edit') && (
                  <button
                    type="submit"
                    className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (modalMode === 'add' ? 'Add' : 'Update')}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm p-6 relative border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Delete Transport</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">Are you sure you want to delete <span className="font-semibold">{confirmDelete.provider}</span> ({confirmDelete.type})?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-800 font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
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
