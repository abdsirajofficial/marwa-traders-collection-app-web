import React, { useEffect, useState } from 'react';
import { X, Building2, Phone, MapPin, Receipt, FileText, Calendar, User } from 'lucide-react';
import api from '../services/api';

export default function CustomerProfileModal({ customerId, onClose, onSelectPayment }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invoices');

  useEffect(() => {
    if (!customerId) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/customers/${customerId}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch customer profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [customerId]);

  if (!customerId) return null;

  const customer = data?.customer;
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{customer?.shopName || 'Customer Profile'}</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-sky-400 font-mono">
                  {customer?.customerCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">Owner: {customer?.ownerName} • {customer?.mobile}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-slate-400">Loading customer ledger...</div>
          ) : (
            <>
              {/* Financial Balance Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500 uppercase">Opening Balance</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    ₹{Number(customer?.openingBalance || 0).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-slate-400 font-medium">Historical baseline</span>
                </div>

                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                  <span className="text-xs font-bold text-rose-700 uppercase">Current Outstanding</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">
                    ₹{Number(customer?.currentOutstanding || 0).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-rose-600/80 font-medium">Total balance due</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-500 uppercase">Address</span>
                  <p className="text-xs font-medium text-slate-700 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{customer?.address}</span>
                  </p>
                </div>
              </div>

              {/* Ledger Tabs */}
              <div>
                <div className="flex border-b border-slate-200 mb-4">
                  <button
                    onClick={() => setActiveTab('invoices')}
                    className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'invoices' 
                        ? 'border-sky-600 text-sky-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Invoices ({invoices.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`py-2 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                      activeTab === 'payments' 
                        ? 'border-sky-600 text-sky-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Payments ({payments.length})</span>
                  </button>
                </div>

                {activeTab === 'invoices' ? (
                  invoices.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">No invoices recorded yet.</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 font-bold">Invoice #</th>
                            <th className="py-2.5 px-3 font-bold">Date</th>
                            <th className="py-2.5 px-3 font-bold text-right">Invoice Amt</th>
                            <th className="py-2.5 px-3 font-bold text-right">Initial Paid</th>
                            <th className="py-2.5 px-3 font-bold text-right">Outstanding</th>
                            <th className="py-2.5 px-3 font-bold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoices.map((inv) => (
                            <tr key={inv._id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-right">
                                ₹{inv.invoiceAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-emerald-600 text-right">
                                ₹{inv.initialPayment.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-rose-600 text-right">
                                ₹{inv.outstandingAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-center">
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
                  )
                ) : (
                  payments.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">No payments recorded yet.</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 font-bold">Receipt #</th>
                            <th className="py-2.5 px-3 font-bold">Date & Time</th>
                            <th className="py-2.5 px-3 font-bold">Collector</th>
                            <th className="py-2.5 px-3 font-bold text-right">Amount</th>
                            <th className="py-2.5 px-3 font-bold text-right">Remaining</th>
                            <th className="py-2.5 px-3 font-bold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {payments.map((p) => (
                            <tr key={p._id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-mono font-bold text-sky-600">{p.receiptNumber}</td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {new Date(p.createdAt).toLocaleDateString('en-IN')} {new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">
                                {p.collectedBy?.name || 'Ravi'}
                              </td>
                              <td className="py-2.5 px-3 font-black text-emerald-600 text-right">
                                ₹{p.amount.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-700 text-right">
                                ₹{p.remainingOutstanding.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() => onSelectPayment(p)}
                                  className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 underline"
                                >
                                  View Receipt
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
