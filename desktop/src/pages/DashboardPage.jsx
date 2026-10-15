import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Users,
  ArrowUpRight,
  RefreshCw,
  PlusCircle,
  FilePlus,
  Coins,
  UserPlus,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import LocationMapModal from '../components/LocationMapModal';

export default function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const today = data?.today || {
    totalCollection: 0,
    transactions: 0,
    cash: 0,
    pendingSettlement: 0,
    settled: 0,
    shortage: 0,
    outstanding: 0,
  };

  const employeeSummary = data?.employeeSummary || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time collections, settlements, and outstanding monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('users')}
            className="py-2.5 px-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-3.5 h-3.5 text-sky-600" />
            <span>Users</span>
          </button>
          <button
            onClick={() => onNavigate('settlements')}
            className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Cash Settlement</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Primary KPI Grid (Section 31) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Collection</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{today.totalCollection.toLocaleString('en-IN')}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-sky-600 font-bold">{today.transactions}</span> Transactions Today
          </p>
        </div>

        {/* Cash Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Cash</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{today.cash.toLocaleString('en-IN')}
          </div>
          <p className="text-xs font-semibold text-emerald-600 mt-1">
            100% Cash Collections
          </p>
        </div>

        {/* Pending Settlement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Settlement</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">
            ₹{today.pendingSettlement.toLocaleString('en-IN')}
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            With collectors in transit
          </p>
        </div>

        {/* Settled Cash */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Settled Cash</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{today.settled.toLocaleString('en-IN')}
          </div>
          <p className="text-xs font-semibold text-blue-600 mt-1">
            Handed into office safe
          </p>
        </div>
      </div>

      {/* Secondary KPI Bar: Shortage & Outstanding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shortages Alert */}
        <div className={`p-5 rounded-2xl border transition-all ${
          today.shortage > 0 
            ? 'bg-rose-50 border-rose-200 text-rose-950 shadow-md shadow-rose-900/10' 
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Shortage Detected Today
              </span>
              <div className="text-3xl font-black mt-2 text-rose-600">
                ₹{today.shortage.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {today.shortage > 0 
                  ? 'Discrepancy detected between expected cash and received cash.' 
                  : 'Zero shortages reported today. All settled cash reconciled.'}
              </p>
            </div>
            {today.shortage > 0 && (
              <button 
                onClick={() => onNavigate('settlements')}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Inspect Shortage
              </button>
            )}
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
              Total Customer Outstanding
            </span>
            <div className="text-3xl font-black mt-2 text-white">
              ₹{today.outstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Opening balances + manual invoices - confirmed collections
            </p>
          </div>
          <button 
            onClick={() => onNavigate('customers')}
            className="py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/40"
          >
            View Balances
          </button>
        </div>
      </div>


      {/* Part 32 — TODAY'S EMPLOYEE ATTENDANCE & WORK SESSIONS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Employee Attendance & Activity</h2>
              <p className="text-xs text-slate-500">Live work sessions, GPS locations, and daily sign-in/sign-out records</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            MongoDB Source of Truth
          </span>
        </div>

        {(!data?.todayAttendance || data.todayAttendance.length === 0) ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No employees have signed in today yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.todayAttendance.map((att) => {
              const isActive = att.status === 'ACTIVE';
              const signInTime = att.signInTime ? new Date(att.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
              const signOutTime = att.signOutTime ? new Date(att.signOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
              const signInLoc = att.signInLocation?.address || (att.signInLocation?.latitude ? `${att.signInLocation.latitude}, ${att.signInLocation.longitude}` : 'Location recorded');
              const signOutLoc = att.signOutLocation?.address || (att.signOutLocation?.latitude ? `${att.signOutLocation.latitude}, ${att.signOutLocation.longitude}` : '—');

              return (
                <div key={att._id} className="p-6 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${
                      isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {(att.employeeName || 'EM').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{att.employeeName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                          isActive 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {isActive ? 'SIGNED IN' : 'SIGNED OUT'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Session: {att.workSessionId}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400">Sign In:</span>
                          <span className="font-semibold text-slate-800">{signInTime}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedLocation({
                              title: 'Sign In Location',
                              userName: att.employeeName,
                              userRole: 'Cash Collector',
                              eventName: 'Work Session Sign In',
                              timestamp: att.signInTime,
                              address: att.signInLocation?.address || 'Salem Counter',
                              latitude: att.signInLocation?.latitude,
                              longitude: att.signInLocation?.longitude,
                            })}
                            className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200 transition font-semibold"
                            title="Click to view presence location on map"
                          >
                            <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>{signInLoc}</span>
                          </button>
                        </div>
                        {!isActive && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400">Sign Out:</span>
                            <span className="font-semibold text-slate-800">{signOutTime}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedLocation({
                                title: 'Sign Out Location',
                                userName: att.employeeName,
                                userRole: 'Cash Collector',
                                eventName: 'Work Session Sign Out',
                                timestamp: att.signOutTime,
                                address: att.signOutLocation?.address || 'Salem Depot',
                                latitude: att.signOutLocation?.latitude,
                                longitude: att.signOutLocation?.longitude,
                              })}
                              className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 transition font-semibold"
                              title="Click to view presence location on map"
                            >
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>{signOutLoc}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-left md:text-right">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Collections</p>
                      <p className="text-sm font-bold text-slate-800">{att.totalTransactions || 0} entries</p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Total Cash</p>
                      <p className="text-lg font-black text-emerald-600">₹{(att.totalCollected || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
