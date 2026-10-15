import React, { useEffect, useState } from 'react';
import { CreditCard, Printer, Search, ShieldAlert, X, MapPin } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import LocationMapModal from '../components/LocationMapModal';

export default function PaymentsPage({ onSelectPayment }) {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Correction Request Modal
  const [selectedPaymentForCorrection, setSelectedPaymentForCorrection] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({ requestedAmount: '', reason: '' });
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionMsg, setCorrectionMsg] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', { params: { limit: 100 } });
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRequestCorrection = async (e) => {
    e.preventDefault();
    if (!selectedPaymentForCorrection) return;
    setCorrectionLoading(true);
    setCorrectionMsg(null);
    try {
      await api.post(`/payments/${selectedPaymentForCorrection._id}/correction-request`, {
        requestedAmount: Number(correctionForm.requestedAmount),
        reason: correctionForm.reason,
      });
      setCorrectionMsg({ type: 'success', text: 'Correction request submitted for Admin/Owner review.' });
      setTimeout(() => {
        setSelectedPaymentForCorrection(null);
        setCorrectionMsg(null);
        setCorrectionForm({ requestedAmount: '', reason: '' });
      }, 1800);
    } catch (err) {
      setCorrectionMsg({ type: 'error', text: err.message });
    } finally {
      setCorrectionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments & Receipts Ledger</h1>
          <p className="text-sm text-slate-500 font-medium">Immutable append-only payment transactions with 58mm thermal receipts</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading payment receipts...</div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Receipt Number</th>
                  <th className="py-3 px-4 font-bold">Customer Shop</th>
                  <th className="py-3 px-4 font-bold">Collected By</th>
                  <th className="py-3 px-4 font-bold">Location</th>
                  <th className="py-3 px-4 font-bold text-center">Mode</th>
                  <th className="py-3 px-4 font-bold text-right">Amount Paid</th>
                  <th className="py-3 px-4 font-bold text-right">Remaining Due</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">
                      <div>{p.receiptNumber}</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(p.createdAt).toLocaleDateString('en-IN')} {new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.customerId?.shopName || 'Shop'}
                      <div className="text-[10px] text-slate-400 font-normal font-mono">{p.customerId?.customerCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {p.collectedBy?.name || 'Collector'}
                      <div className="text-[10px] text-slate-400 font-mono">Code: {p.collectedBy?.code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <button
                        type="button"
                        onClick={() => setSelectedLocation({
                          title: 'Payment Collection Location',
                          userName: p.collectedBy?.name || 'Collector',
                          userRole: p.collectedBy?.role || 'CASH_COLLECTOR',
                          eventName: `Cash Collection • ${p.customerId?.shopName || 'Customer'}`,
                          timestamp: p.createdAt,
                          address: p.location?.locationName || p.location?.address || p.customerId?.address || 'Shop Counter',
                          latitude: p.location?.latitude,
                          longitude: p.location?.longitude,
                          receiptNumber: p.receiptNumber,
                          amount: p.amount,
                        })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-900 border border-sky-200 text-xs font-semibold transition group cursor-pointer"
                        title="Click to view presence location on map"
                      >
                        <MapPin className="w-3.5 h-3.5 text-sky-500 group-hover:scale-110 transition shrink-0" />
                        <span className="truncate max-w-[130px]">{p.location?.locationName || 'Counter'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        p.paymentMode === 'GPAY'
                          ? 'bg-sky-50 text-sky-700 border-sky-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}>
                        {p.paymentMode || 'CASH'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-emerald-600 text-sm">
                        ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700 text-right">
                      ₹{Number(p.remainingOutstanding || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onSelectPayment(p)}
                          className="py-1 px-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg font-semibold text-[11px] transition flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                        {p.status === 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setSelectedPaymentForCorrection(p);
                              setCorrectionForm({ requestedAmount: p.amount, reason: '' });
                            }}
                            className="py-1 px-2 text-slate-500 hover:text-amber-600 font-medium text-[11px] transition"
                            title="Request correction"
                          >
                            Correct
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Correction Request Modal */}
      {selectedPaymentForCorrection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold">Request Payment Correction</h2>
              </div>
              <button onClick={() => setSelectedPaymentForCorrection(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestCorrection} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium leading-relaxed">
                Completed payments are immutable. If approved by Owner/Admin, the original payment will be reversed in the audit trail and an adjusted record created.
              </div>

              {correctionMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  correctionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                }`}>
                  {correctionMsg.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Receipt Number</label>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {selectedPaymentForCorrection.receiptNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Original (₹)</label>
                  <div className="font-bold text-slate-900 text-sm">
                    ₹{selectedPaymentForCorrection.amount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Correct Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={correctionForm.requestedAmount}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, requestedAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Correction <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Mistyped extra zero on counter..."
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForCorrection(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correctionLoading}
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition disabled:opacity-50"
                >
                  {correctionLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Location Presence Map Modal */}
      {selectedLocation && (
        <LocationMapModal
          locationData={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </div>
  );
}
