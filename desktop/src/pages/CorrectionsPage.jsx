import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, RefreshCw, X } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function CorrectionsPage() {
  const { user } = useAuthStore();
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchCorrections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/corrections', { params: { limit: 100 } });
      setCorrections(res.data.corrections || []);
    } catch (err) {
      console.error('Failed to load corrections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  const handleReviewAction = async (status) => {
    if (!reviewModal) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await api.post(`/corrections/${reviewModal._id}/review`, {
        status,
        reviewNotes,
      });
      setReviewModal(null);
      setReviewNotes('');
      fetchCorrections();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Correction & Reversal Requests</h1>
        <p className="text-sm text-slate-500 font-medium">Immutable financial audit: Review Cash Collector amount adjustments</p>
      </div>

      {/* Corrections Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading correction requests...</div>
        ) : corrections.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No correction requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Receipt #</th>
                  <th className="py-3 px-4 font-bold">Shop Name</th>
                  <th className="py-3 px-4 font-bold">Requested By</th>
                  <th className="py-3 px-4 font-bold text-right">Original Amt</th>
                  <th className="py-3 px-4 font-bold text-right">Requested Amt</th>
                  <th className="py-3 px-4 font-bold">Reason</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {corrections.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">{c.receiptNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.customerId?.shopName}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {c.requestedBy?.name} ({c.requestedBy?.code})
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 text-right">
                      ₹{c.originalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600 text-right">
                      ₹{c.requestedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={c.reason}>
                      {c.reason}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setReviewModal(c);
                            setReviewNotes('');
                            setActionError(null);
                          }}
                          className="py-1 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-[11px] transition shadow-sm"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Reviewed by {c.reviewedBy?.name || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">Review Correction Request</h2>
              <button onClick={() => setReviewModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold">
                  {actionError}
                </div>
              )}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-900">{reviewModal.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Original Recorded:</span>
                  <span className="font-bold text-slate-900">₹{reviewModal.originalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Requested Amount:</span>
                  <span className="font-black text-emerald-600">₹{reviewModal.requestedAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-semibold">Reason given by employee:</span>
                  <p className="italic text-slate-700 mt-0.5">{reviewModal.reason}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Review Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified with shop owner Kumar..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleReviewAction('REJECTED')}
                  className="flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleReviewAction('APPROVED')}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Approve & Reverse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
