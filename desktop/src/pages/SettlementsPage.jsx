import React, { useEffect, useState } from 'react';
import { HandCoins, AlertTriangle, CheckCircle, RefreshCw, X, Coins, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function SettlementsPage() {
  const { user } = useAuthStore();
  const [collectors, setCollectors] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settlement Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [expectedData, setExpectedData] = useState(null);
  const [expectedLoading, setExpectedLoading] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const fetchCollectorsAndSettlements = async () => {
    setLoading(true);
    try {
      const [colRes, setRes] = await Promise.all([
        api.get('/users/collectors'),
        api.get('/settlements', { params: { limit: 100 } }),
      ]);
      setCollectors(colRes.data.collectors || []);
      setSettlements(setRes.data.settlements || []);
    } catch (err) {
      console.error('Failed to load settlement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectorsAndSettlements();
  }, []);

  // When employee is selected, fetch their real-time expected cash
  useEffect(() => {
    if (!selectedEmployeeId) {
      setExpectedData(null);
      return;
    }

    const fetchExpected = async () => {
      setExpectedLoading(true);
      try {
        const res = await api.get(`/settlements/expected/${selectedEmployeeId}`);
        setExpectedData(res.data);
        setReceivedAmount(String(res.data.expectedAmount || ''));
      } catch (err) {
        console.error('Failed to get expected cash:', err);
      } finally {
        setExpectedLoading(false);
      }
    };

    fetchExpected();
  }, [selectedEmployeeId]);

  const handleRecordSettlement = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await api.post('/settlements', {
        employeeId: selectedEmployeeId,
        receivedAmount: Number(receivedAmount),
        notes,
      });

      setSubmitSuccess(res.data.settlement);
      setSelectedEmployeeId('');
      setExpectedData(null);
      setReceivedAmount('');
      setNotes('');
      fetchCollectorsAndSettlements();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const expectedAmount = expectedData?.expectedAmount || 0;
  const numReceived = Number(receivedAmount || 0);
  const difference = numReceived - expectedAmount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Cash Settlement & Shortage Detection</h1>
        <p className="text-sm text-slate-500 font-medium">Verify actual cash handed to the office against expected collections</p>
      </div>

      {/* Settlement Action Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900">Record Employee Cash Handover</h2>
        </div>

        {submitSuccess && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>
                Settlement #{submitSuccess.settlementNumber} recorded! Status: {submitSuccess.status} (Diff: ₹{submitSuccess.difference.toLocaleString('en-IN')})
              </span>
            </div>
            <button onClick={() => setSubmitSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
            {submitError}
          </div>
        )}

        <form onSubmit={handleRecordSettlement} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Collector Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Select Cash Collector <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-sky-500 focus:outline-none"
              >
                <option value="">-- Choose Collector --</option>
                {collectors.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code}){c.role === 'OWNER' ? ' · Owner' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Amount (Computed Automatically) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Expected Cash From Collections
              </label>
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-black text-slate-900 font-mono flex items-center justify-between">
                <span>₹{expectedLoading ? '...' : expectedAmount.toLocaleString('en-IN')}</span>
                {expectedData && (
                  <span className="text-[11px] font-normal text-slate-500">
                    ({expectedData.unsettledPaymentCount} payments)
                  </span>
                )}
              </div>
            </div>

            {/* Actual Received Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Actual Cash Handed Over (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                disabled={!selectedEmployeeId}
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="Counted cash amount..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-sky-500 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          {/* Real-time Reconciliation & Status Preview */}
          {selectedEmployeeId && (
            <div className={`p-4 rounded-2xl border transition-all ${
              difference < 0 
                ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-md shadow-rose-900/10' 
                : difference === 0 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                : 'bg-blue-50 border-blue-300 text-blue-950'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {difference < 0 ? (
                    <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      {difference < 0 
                        ? 'CRITICAL SHORTAGE DETECTED' 
                        : difference === 0 
                        ? 'PERFECT RECONCILIATION (SETTLED)' 
                        : 'SURPLUS CASH RECORDED'}
                    </h3>
                    <p className="text-xs font-medium opacity-80 mt-0.5">
                      Expected: ₹{expectedAmount.toLocaleString('en-IN')} | Received: ₹{numReceived.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold opacity-75">Difference Amount</span>
                  <div className={`text-xl font-black ${difference < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {difference < 0 ? `- ₹${Math.abs(difference).toLocaleString('en-IN')}` : `₹${difference.toLocaleString('en-IN')}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Settlement Notes / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. Verified by Admin at evening cash counter..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitLoading || !selectedEmployeeId}
              className="py-3 px-6 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition disabled:opacity-50"
            >
              {submitLoading ? 'Recording Settlement...' : 'Record Cash Settlement'}
            </button>
          </div>
        </form>
      </div>

      {/* Historical Settlements & Shortages Log */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Settlements & Shortage History</h2>
          <span className="text-xs text-slate-400 font-medium">Verified by Office</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading settlements...</div>
        ) : settlements.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No settlements recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Settlement #</th>
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold">Employee</th>
                  <th className="py-3 px-4 font-bold">Settled By</th>
                  <th className="py-3 px-4 font-bold text-right">Expected</th>
                  <th className="py-3 px-4 font-bold text-right">Received</th>
                  <th className="py-3 px-4 font-bold text-right">Difference</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.settlementNumber}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(s.settlementDate).toLocaleDateString('en-IN')} {new Date(s.settlementDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {s.employeeId?.name || 'Collector'}
                      <div className="text-[10px] text-slate-400 font-normal font-mono">Code: {s.employeeId?.code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {s.settledBy?.name || 'Admin'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 text-right">
                      ₹{Number(s.expectedAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-right">
                      ₹{Number(s.receivedAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-black">
                      <span className={s.difference < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {s.difference < 0 ? `- ₹${Math.abs(s.difference).toLocaleString('en-IN')}` : `₹${s.difference.toLocaleString('en-IN')}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'SHORTAGE' ? 'bg-rose-100 text-rose-800 animate-pulse font-black' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
