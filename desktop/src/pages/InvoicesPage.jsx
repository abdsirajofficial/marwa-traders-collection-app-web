import React, { useEffect, useState, useMemo } from 'react';
import { Plus, FileText, Search, RefreshCw, X, Building2, ChevronDown, Check } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Create Invoice Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    invoiceAmount: '',
    initialPayment: 0,
  });
  const [shopSearch, setShopSearch] = useState('');
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const canCreate = ['OWNER', 'ADMIN', 'STAFF'].includes(user?.role) || user?.permissions?.includes('CREATE_INVOICE');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices', { params: { status: statusFilter || undefined, limit: 100 } });
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers', { params: { limit: 200 } });
      setCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c._id === formData.customerId);
  }, [customers, formData.customerId]);

  const filteredCustomers = useMemo(() => {
    if (!shopSearch.trim()) return customers;
    const q = shopSearch.toLowerCase();
    return customers.filter(c => 
      c.shopName?.toLowerCase().includes(q) ||
      c.customerCode?.toLowerCase().includes(q) ||
      c.ownerName?.toLowerCase().includes(q) ||
      c.mobile?.includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  }, [customers, shopSearch]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      setFormError('Please select a customer shop');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await api.post('/invoices', {
        ...formData,
        invoiceAmount: Number(formData.invoiceAmount),
        initialPayment: Number(formData.initialPayment || 0),
      });
      setShowAddModal(false);
      setFormData({
        customerId: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
        invoiceAmount: '',
        initialPayment: 0,
      });
      setShopSearch('');
      setIsShopDropdownOpen(false);
      fetchInvoices();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const calcNetOutstanding = () => {
    const amt = Number(formData.invoiceAmount || 0);
    const init = Number(formData.initialPayment || 0);
    return Math.max(0, amt - init);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manual Invoices</h1>
          <p className="text-sm text-slate-500 font-medium">Record new credit invoices, optional initial payments, and track balances</p>
        </div>

        <div className="flex items-center gap-3">
          {canCreate && (
            <button
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold text-slate-500 px-2 uppercase">Status:</span>
        {['', 'UNPAID', 'PARTIALLY_PAID', 'PAID'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition ${
              statusFilter === st 
                ? 'bg-sky-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Invoices'}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No invoices found for this selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Invoice #</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Customer Shop</th>
                  <th className="py-3 px-4 font-bold">Created By</th>
                  <th className="py-3 px-4 font-bold text-right">Invoice Amount</th>
                  <th className="py-3 px-4 font-bold text-right">Initial Paid</th>
                  <th className="py-3 px-4 font-bold text-right">Outstanding</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{inv.customerId?.shopName || 'Unknown'}</p>
                      <p className="text-[11px] text-slate-400">{inv.customerId?.ownerName}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{inv.createdBy?.name || 'Office'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 text-right">
                      ₹{Number(inv.invoiceAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold text-right">
                      ₹{Number(inv.initialPayment || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-rose-600 text-sm">
                        ₹{Number(inv.outstandingAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">New Credit Invoice</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                  <span>Select Customer Shop <span className="text-rose-500">*</span></span>
                  {selectedCustomer && (
                    <span className="text-[11px] text-sky-600 font-semibold lowercase">
                      code: {selectedCustomer.customerCode}
                    </span>
                  )}
                </label>

                {/* Searchable Shop Selector */}
                <div className="relative">
                  {selectedCustomer && !isShopDropdownOpen ? (
                    <div className="flex items-center justify-between p-3 bg-sky-50/80 border-2 border-sky-400 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{selectedCustomer.shopName}</h4>
                            <span className="text-[10px] font-mono font-bold bg-white text-sky-700 px-1.5 py-0.5 rounded border border-sky-200 shrink-0">
                              {selectedCustomer.customerCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            {selectedCustomer.ownerName && <span>Owner: {selectedCustomer.ownerName}</span>}
                            {selectedCustomer.mobile && <span>• {selectedCustomer.mobile}</span>}
                            <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[10px]">
                              Due: ₹{Number(selectedCustomer.currentOutstanding || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsShopDropdownOpen(true);
                          setShopSearch('');
                        }}
                        className="ml-2 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 bg-white hover:bg-sky-100 rounded-xl border border-sky-200 transition shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={shopSearch}
                          onChange={(e) => setShopSearch(e.target.value)}
                          placeholder="Search shop name, owner, mobile, or code..."
                          className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border-2 border-slate-300 focus:border-sky-500 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 focus:outline-none transition shadow-inner"
                          autoFocus={isShopDropdownOpen}
                          onFocus={() => setIsShopDropdownOpen(true)}
                        />
                        {shopSearch && (
                          <button
                            type="button"
                            onClick={() => setShopSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="border border-slate-200 rounded-2xl bg-white shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                        {filteredCustomers.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400 font-medium">
                            No shops matching "{shopSearch}".
                          </div>
                        ) : (
                          filteredCustomers.map((c) => {
                            const isSelected = formData.customerId === c._id;
                            return (
                              <button
                                key={c._id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, customerId: c._id });
                                  setIsShopDropdownOpen(false);
                                  setShopSearch('');
                                  setFormError(null);
                                }}
                                className={`w-full p-2.5 text-left text-xs transition flex items-center justify-between hover:bg-sky-50/70 cursor-pointer ${
                                  isSelected ? 'bg-sky-50/90 font-bold border-l-4 border-sky-500' : ''
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 truncate">{c.shopName}</span>
                                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                                      {c.customerCode}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {c.ownerName ? `${c.ownerName} • ` : ''}{c.mobile || c.address || 'No phone'}
                                  </p>
                                </div>
                                <div className="text-right shrink-0 flex items-center gap-2">
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    Number(c.currentOutstanding || 0) > 0
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    ₹{Number(c.currentOutstanding || 0).toLocaleString('en-IN')}
                                  </span>
                                  {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Invoice # <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-005"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-sky-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Invoice Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Invoice Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="50000"
                    value={formData.invoiceAmount}
                    onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-sky-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Initial Paid (₹) <span className="text-slate-400">(Default: 0)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.initialPayment}
                    onChange={(e) => setFormData({ ...formData, initialPayment: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <span className="font-semibold text-slate-600">Calculated Net Outstanding:</span>
                <span className="font-black text-rose-600 text-sm">
                  ₹{calcNetOutstanding().toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition disabled:opacity-50"
                >
                  {formLoading ? 'Recording...' : 'Record Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
