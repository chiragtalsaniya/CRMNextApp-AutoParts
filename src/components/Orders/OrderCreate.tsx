import React, { useState, useEffect } from 'react';
import { OrderCart } from './OrderCart';
import { createOrder } from '../../services/orders';
import { RetailerSelect } from './RetailerSelect';
import { PartsCatalog } from './PartsCatalog';
import { useAuth } from '../../context/AuthContext';
import { companiesAPI } from '../../services/api';
import { storesAPI } from '../../services/api';

export const OrderCreate: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  // Step state: 'retailer' | 'parts' | 'review'
  const [step, setStep] = useState<'retailer' | 'parts' | 'review'>('retailer');
  // Form state for each step
  const [retailer, setRetailer] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [orderDetails, setOrderDetails] = useState<any>({ po_number: '', urgent: false, remark: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');
  const [company, setCompany] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);

  // Fetch companies for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      companiesAPI.getCompanies().then(res => {
        // Normalize company data for select
        const data = (res.data || []).map((c: any) => ({
          id: c.id || c.Company_Id,
          name: c.name || c.Company_Name
        }));
        setCompanies(data);
      });
    }
  }, [isSuperAdmin]);
  // Fetch stores when company is selected
  useEffect(() => {
    if (isSuperAdmin && company) {
      storesAPI.getStores({ company_id: company.id }).then(res => {
        setStores(res.data || []);
      });
    } else {
      setStores([]);
      setStore(null);
    }
  }, [isSuperAdmin, company]);

  // Fetch retailers when store is selected
  useEffect(() => {
    if (isSuperAdmin && store) {
      // You may need to adjust the API param name for store
      // Assuming store.Branch_Code or store.id
      // If your API expects branch_code or store_id, adjust accordingly
      // Here, we use Branch_Code if present, else id
      const branchCode = store.Branch_Code || store.id;
      import('../../services/api').then(({ retailersAPI }) => {
        retailersAPI.getRetailers({ branch_code: branchCode }).then(res => {
          setRetailers(res.data?.retailers || []);
        });
      });
    } else {
      setRetailers([]);
      setRetailer(null);
    }
  }, [isSuperAdmin, store]);

  // Handler for order submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitMsg('');
    try {
      // Demo: use dummy retailer and branch, replace with real selection
      const payload = {
        retailer_id: retailer?.Retailer_Id || 1,
        branch: retailer?.Branch || '2081381',
        po_number: orderDetails.po_number,
        urgent: orderDetails.urgent,
        remark: orderDetails.remark,
        items: cart.map(item => ({
          part_number: item.part_number,
          part_name: item.part_name,
          quantity: item.quantity,
          mrp: item.unitPrice,
          basic_discount: item.basic_discount || 0,
          scheme_discount: item.scheme_discount || 0,
          additional_discount: item.additional_discount || 0,
          urgent: orderDetails.urgent,
        })),
      };
      await createOrder(payload);
      setSubmitMsg('Order created successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitMsg('');
        if (onClose) onClose();
      }, 1200);
    } catch (e: any) {
      setSubmitMsg(e?.message || 'Failed to create order');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 transition-colors duration-200" style={{ fontSize: 'var(--app-font-size)' }}>
      {/* Step Indicator */}
      <div className="flex justify-between mb-6">
        {['retailer', 'parts', 'review'].map((s, i) => (
          <div key={s} className={`flex-1 flex flex-col items-center ${step === s ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step === s ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-200 dark:bg-gray-700'}`}>{i+1}</div>
            <span className="text-xs capitalize">{s}</span>
          </div>
        ))}
      </div>
      {/* Step Content */}
      {step === 'retailer' && (
        <div>
          {isSuperAdmin && (
            <>
              <label className="block text-xs mb-1">Select Company</label>
              <select
                className="w-full mb-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                value={company?.id || ''}
                onChange={e => {
                  const selected = companies.find(c => c.id == e.target.value);
                  setCompany(selected);
                  setStore(null);
                }}
              >
                <option value="">-- Select Company --</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <label className="block text-xs mb-1">Select Store</label>
              <select
                className="w-full mb-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                value={store?.Branch_Code || store?.id || ''}
                onChange={e => {
                  const selected = stores.find(s => (s.Branch_Code || s.id) == e.target.value);
                  setStore(selected);
                }}
                disabled={!company}
              >
                <option value="">-- Select Store --</option>
                {stores.map(s => (
                  <option key={s.Branch_Code || s.id} value={s.Branch_Code || s.id}>{s.Branch_Name || s.name}</option>
                ))}
              </select>
            </>
          )}
          <RetailerSelect value={retailer} onChange={setRetailer} retailers={isSuperAdmin ? retailers : undefined} />
          {retailer && (
            <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900">
              <div className="font-medium">{retailer.Retailer_Name}</div>
              <div className="text-xs text-gray-500">{retailer.Contact_Person}</div>
            </div>
          )}
          <button
            className="mt-4 btn btn-primary w-full bg-[#003366] text-white dark:bg-blue-800 dark:text-white hover:bg-blue-800 dark:hover:bg-blue-900 focus:ring-2 focus:ring-[#003366] dark:focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setStep('parts')}
            disabled={isSuperAdmin ? !(company && store && retailer) : !retailer}
          >
            Next: Parts
          </button>
        </div>
      )}
      {step === 'parts' && (
        <div>
          <PartsCatalog onAdd={item => setCart([...cart, item])} />
          <OrderCart cart={cart} setCart={setCart} />
          <button
            className="mt-4 btn btn-secondary w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700"
            onClick={() => setStep('review')}
            disabled={cart.length === 0}
          >
            Next: Review
          </button>
        </div>
      )}
      {step === 'review' && (
        <div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Order Summary</h4>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {cart.map((item) => (
                <li key={item.part_number} className="flex justify-between py-2">
                  <span>{item.part_name} (x{item.quantity})</span>
                  <span>₹{item.unitPrice * item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end font-bold mt-2">Total: ₹{cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)}</div>
          </div>
          <div className="mb-2 flex gap-2">
            <input
              type="text"
              className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex-1"
              placeholder="PO Number"
              value={orderDetails.po_number}
              onChange={e => setOrderDetails((prev: any) => ({ ...prev, po_number: e.target.value }))}
            />
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={orderDetails.urgent}
                onChange={e => setOrderDetails((prev: any) => ({ ...prev, urgent: e.target.checked }))}
              />
              Urgent
            </label>
          </div>
          <textarea
            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-2"
            placeholder="Order notes (optional)"
            value={orderDetails.remark}
            onChange={e => setOrderDetails((prev: any) => ({ ...prev, remark: e.target.value }))}
          />
          <button className="mt-4 btn btn-success w-full bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Order'}
          </button>
          {submitMsg && <div className="mt-2 text-center text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-lg p-2 border border-green-200 dark:border-green-700 transition-colors duration-200">{submitMsg}</div>}
        </div>
      )}
      <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white" onClick={onClose}>×</button>
    </div>
  );
};
