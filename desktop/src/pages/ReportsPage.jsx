import React, { useEffect, useState } from 'react';
import { BarChart3, Download, Printer, Filter, Calendar } from 'lucide-react';
import api from '../services/api';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('collections');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '/reports/collections';
      if (reportType === 'employees') endpoint = '/reports/employees';
      if (reportType === 'outstanding') endpoint = '/reports/outstanding';
      if (reportType === 'settlements') endpoint = '/reports/settlements';
      if (reportType === 'shortages') endpoint = '/reports/shortages';

      const res = await api.get(endpoint, {
        params: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
      });
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Audit Reports</h1>
          <p className="text-sm text-slate-500 font-medium">Exportable executive summaries for collections, balances, and shortages</p>
        </div>

        <button
          onClick={handlePrint}
          className="py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
        {[
          { id: 'collections', label: '1. Collection Report' },
          { id: 'employees', label: '2. Employee Collection' },
          { id: 'outstanding', label: '3. Customer Outstanding' },
          { id: 'settlements', label: '4. Settlement Report' },
          { id: 'shortages', label: '5. Shortage Report' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition ${
              reportType === tab.id
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600 uppercase">From Date:</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-600 uppercase">To Date:</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50"
          />
        </div>
        <button
          onClick={fetchReport}
          className="py-2 px-4 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700 transition"
        >
          Apply Filter
        </button>
      </div>

      {/* Report Canvas Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Compiling financial data...</div>
        ) : !reportData ? (
          <div className="py-20 text-center text-slate-400">No data available.</div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. Collection Report View */}
            {reportType === 'collections' && (
              <div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">Total Filtered Collections:</span>
                  <span className="text-2xl font-black text-sky-600">
                    ₹{Number(reportData.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Receipt #</th>
                      <th className="py-2.5 px-3 font-bold">Date</th>
                      <th className="py-2.5 px-3 font-bold">Shop</th>
                      <th className="py-2.5 px-3 font-bold">Employee</th>
                      <th className="py-2.5 px-3 font-bold text-right">Amount</th>
                      <th className="py-2.5 px-3 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.payments || []).map((p) => (
                      <tr key={p._id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-600">{p.receiptNumber}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{p.customerId?.shopName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{p.collectedBy?.name}</td>
                        <td className="py-2.5 px-3 font-black text-slate-900 text-right">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Employee Collection Report */}
            {reportType === 'employees' && (
              <div className="space-y-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Employee</th>
                      <th className="py-2.5 px-3 font-bold">Code</th>
                      <th className="py-2.5 px-3 font-bold text-right">Transactions</th>
                      <th className="py-2.5 px-3 font-bold text-right">Total Cash Collected</th>
                      <th className="py-2.5 px-3 font-bold text-right">Settled Amount</th>
                      <th className="py-2.5 px-3 font-bold text-right">Pending In Transit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(Array.isArray(reportData) ? reportData : []).map((emp, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{emp.employee?.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{emp.employee?.code}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{emp.transactionCount}</td>
                        <td className="py-2.5 px-3 font-black text-sky-600 text-right">
                          ₹{emp.totalCollected.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-600 font-bold text-right">
                          ₹{emp.settledAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-amber-600 font-bold text-right">
                          ₹{emp.unsettledAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Customer Outstanding Report */}
            {reportType === 'outstanding' && (
              <div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">Total Market Outstanding:</span>
                  <span className="text-2xl font-black text-rose-600">
                    ₹{Number(reportData.totalOutstanding || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Shop Name</th>
                      <th className="py-2.5 px-3 font-bold">Owner</th>
                      <th className="py-2.5 px-3 font-bold">Mobile</th>
                      <th className="py-2.5 px-3 font-bold text-right">Opening Balance</th>
                      <th className="py-2.5 px-3 font-bold text-right">Current Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.customers || []).map((c) => (
                      <tr key={c._id}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{c.shopName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{c.ownerName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{c.mobile}</td>
                        <td className="py-2.5 px-3 text-right">₹{c.openingBalance.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-600">
                          ₹{c.currentOutstanding.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Shortages Report */}
            {reportType === 'shortages' && (
              <div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 mb-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-rose-800">Total Unaccounted Shortage:</span>
                  <span className="text-2xl font-black text-rose-600">
                    ₹{Number(reportData.totalShortageAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Settlement #</th>
                      <th className="py-2.5 px-3 font-bold">Date</th>
                      <th className="py-2.5 px-3 font-bold">Employee</th>
                      <th className="py-2.5 px-3 font-bold text-right">Expected</th>
                      <th className="py-2.5 px-3 font-bold text-right">Received</th>
                      <th className="py-2.5 px-3 font-bold text-right">Shortage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.shortages || []).map((s) => (
                      <tr key={s._id}>
                        <td className="py-2.5 px-3 font-mono font-bold">{s.settlementNumber}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(s.settlementDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{s.employeeId?.name}</td>
                        <td className="py-2.5 px-3 text-right">₹{s.expectedAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right">₹{s.receivedAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-600">
                          - ₹{Math.abs(s.difference).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. Settlement Report */}
            {reportType === 'settlements' && (
              <div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Settlement #</th>
                      <th className="py-2.5 px-3 font-bold">Date</th>
                      <th className="py-2.5 px-3 font-bold">Employee</th>
                      <th className="py-2.5 px-3 font-bold text-right">Expected</th>
                      <th className="py-2.5 px-3 font-bold text-right">Received</th>
                      <th className="py-2.5 px-3 font-bold text-right">Difference</th>
                      <th className="py-2.5 px-3 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(reportData.settlements || []).map((s) => (
                      <tr key={s._id}>
                        <td className="py-2.5 px-3 font-mono font-bold">{s.settlementNumber}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(s.settlementDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{s.employeeId?.name}</td>
                        <td className="py-2.5 px-3 text-right">₹{s.expectedAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right">₹{s.receivedAmount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          ₹{s.difference.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' :
                            s.status === 'SHORTAGE' ? 'bg-rose-100 text-rose-800' :
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
        )}
      </div>

    </div>
  );
}
