import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Smartphone, 
  TrendingUp, 
  ArrowLeft, 
  CheckCircle2, 
  Printer, 
  CreditCard, 
  MapPin, 
  Receipt, 
  LogOut,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

export default function MobileCollectorSimulator({ onClose, onPrintReceipt }) {
  // Mobile app state machine
  const [screen, setScreen] = useState('login'); // 'login' | 'dashboard' | 'search' | 'collect' | 'confirm' | 'success'
  const [collectorUser, setCollectorUser] = useState(null);
  const [collectorToken, setCollectorToken] = useState(null);
  const [loginCode, setLoginCode] = useState('4001'); // default test collector Ravi
  const [loginError, setLoginError] = useState(null);

  // Today summary
  const [todaySummary, setTodaySummary] = useState({ todayCollection: 0, todayTransactionCount: 0 });

  // Customer search & selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH'); // 'CASH' | 'GPAY'
  const [locationName, setLocationName] = useState('Counter');
  const [gpsLocation, setGpsLocation] = useState({ latitude: 11.6643, longitude: 78.1460 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [confirmedPayment, setConfirmedPayment] = useState(null);

  // Attendance work session state (Part 5 - 18)
  const [attendanceSession, setAttendanceSession] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signOutSummary, setSignOutSummary] = useState(null);
  const [showSignOutSuccess, setShowSignOutSuccess] = useState(false);

  // Attempt real browser geolocation if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
          });
        },
        (err) => console.log('GPS fallback:', err.message),
        { timeout: 5000 }
      );
    }
  }, []);

  const fetchAttendanceSession = async (token) => {
    try {
      const res = await api.get('/employee-attendance/today', {
        headers: { Authorization: `Bearer ${token || collectorToken}` },
      });
      setAttendanceSession(res.data.session || null);
    } catch (err) {
      console.log('Attendance fetch error:', err.message);
    }
  };

  const handleCollectorLogin = async (e) => {
    e?.preventDefault();
    setLoginError(null);
    try {
      const res = await api.post('/auth/login', { code: loginCode.trim() });
      if (res.data.user.role !== 'CASH_COLLECTOR' && res.data.user.role !== 'OWNER' && res.data.user.role !== 'ADMIN') {
        throw new Error('Please login with a Cash Collector code (e.g. 4001 or 4002)');
      }
      setCollectorUser(res.data.user);
      setCollectorToken(res.data.token);
      setScreen('dashboard');
      fetchCollectorToday(res.data.token);
      fetchAttendanceSession(res.data.token);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setPaymentError(null);
    try {
      const location = {
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        address: 'Salem City Counter',
      };
      const res = await api.post(
        '/employee-attendance/sign-in',
        { location },
        { headers: { Authorization: `Bearer ${collectorToken}` } }
      );
      setAttendanceSession(res.data.session);
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOutConfirm = async () => {
    setIsSigningOut(true);
    try {
      const location = {
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        address: 'Salem Evening Depot',
      };
      const res = await api.post(
        '/employee-attendance/sign-out',
        {
          workSessionId: attendanceSession?.workSessionId,
          location,
        },
        { headers: { Authorization: `Bearer ${collectorToken}` } }
      );
      setSignOutSummary(res.data.summary);
      setShowSignOutConfirm(false);
      setShowSignOutSuccess(true);
      setAttendanceSession(res.data.session);
      fetchCollectorToday(collectorToken);
    } catch (err) {
      setPaymentError(err.message);
      setShowSignOutConfirm(false);
    } finally {
      setIsSigningOut(false);
    }
  };

  const fetchCollectorToday = async (token) => {
    try {
      const res = await api.get('/payments/collector/today', {
        headers: { Authorization: `Bearer ${token || collectorToken}` },
      });
      setTodaySummary(res.data);
    } catch (err) {
      console.log('Failed to fetch collector today:', err.message);
    }
  };

  const handleSearch = async (q) => {
    setSearchQuery(q);
    try {
      const res = await api.get('/customers', {
        params: { search: q, limit: 30 },
        headers: { Authorization: `Bearer ${collectorToken}` },
      });
      setSearchResults(res.data.customers || []);
    } catch (err) {
      console.log('Search error:', err);
    }
  };

  const startCollection = (customer) => {
    if (!attendanceSession || attendanceSession.status !== 'ACTIVE') {
      setPaymentError('You must SIGN IN before collecting cash');
      return;
    }
    setSelectedCustomer(customer);
    setPaymentAmount('');
    setLocationName(`${customer.shopName}, ${customer.address}`);
    setPaymentError(null);
    setScreen('collect');
  };

  const goToConfirmation = () => {
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      setPaymentError('Please enter a valid cash amount');
      return;
    }
    if (amt > selectedCustomer.currentOutstanding) {
      setPaymentError(`Amount cannot exceed customer's outstanding balance of ₹${selectedCustomer.currentOutstanding.toLocaleString('en-IN')}`);
      return;
    }
    setPaymentError(null);
    setScreen('confirm');
  };

  const submitFinalPayment = async () => {
    setIsSubmitting(true);
    setPaymentError(null);
    try {
      const idempotencyKey = `mob_${collectorUser.id}_${selectedCustomer._id}_${Date.now()}`;
      const res = await api.post(
        '/payments',
        {
          customerId: selectedCustomer._id,
          amount: Number(paymentAmount),
          paymentMode,
          location: {
            locationName,
            latitude: gpsLocation.latitude,
            longitude: gpsLocation.longitude,
          },
          idempotencyKey,
        },
        { headers: { Authorization: `Bearer ${collectorToken}` } }
      );

      setConfirmedPayment(res.data.payment);
      setScreen('success');
      fetchCollectorToday(collectorToken);
      fetchAttendanceSession(collectorToken);
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      {/* Phone Case Container */}
      <div className="relative w-[380px] h-[740px] bg-slate-900 rounded-[48px] p-4 shadow-2xl border-4 border-slate-700 flex flex-col justify-between">
        
        {/* Top Speaker / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-950 rounded-b-xl flex items-center justify-center z-20">
          <div className="w-10 h-1 bg-slate-800 rounded-full" />
        </div>

        {/* Close Modal Button Top Right */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-lg hover:bg-slate-700 z-30"
          title="Exit Simulator"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mobile Screen Display */}
        <div className="w-full h-full bg-slate-100 rounded-[36px] overflow-hidden flex flex-col font-sans select-none relative">
          
          {/* Mobile Status Bar */}
          <div className="h-7 bg-slate-900 text-white px-5 pt-1.5 flex justify-between items-center text-[10px] font-mono font-semibold">
            <span>04:35 PM</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>

          {/* SCREEN: 1. LOGIN */}
          {screen === 'login' && (
            <div className="flex-1 p-6 flex flex-col justify-between bg-slate-900 text-white">
              <div className="text-center pt-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-sky-600/30 mb-3">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-black tracking-wider">MARWA TRADERS</h1>
                <p className="text-xs text-sky-400 font-semibold mt-0.5">Cash Collector Android App</p>
              </div>

              <div className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs">
                    {loginError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase text-center mb-1">
                    Enter Collector Code
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    placeholder="4001"
                    maxLength={6}
                    className="w-full py-3 text-center text-2xl font-mono tracking-[0.4em] font-bold text-white bg-slate-800 border-2 border-slate-700 rounded-2xl focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setLoginCode('4001')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-emerald-300 font-medium text-center"
                  >
                    Ravi (4001)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginCode('4002')}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-emerald-300 font-medium text-center"
                  >
                    Kumar (4002)
                  </button>
                </div>
              </div>

              <button
                onClick={handleCollectorLogin}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-95 transition"
              >
                LOGIN
              </button>
            </div>
          )}

          {/* SCREEN: 2. COLLECTOR DASHBOARD (Prompt 2 Part 6 & 11) */}
          {screen === 'dashboard' && (
            <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto relative">
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Collector Portal</span>
                  <h2 className="text-base font-black">Good Morning, {collectorUser?.name}</h2>
                </div>
                <button 
                  onClick={() => setScreen('login')}
                  className="p-1.5 text-slate-400 hover:text-white"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Attendance Status Banner (Prompt 2 Part 6 & 11) */}
              <div className="p-4 space-y-3">
                {paymentError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {(!attendanceSession || attendanceSession.status !== 'ACTIVE') ? (
                  /* PART 6: NOT SIGNED IN STATE */
                  <div className="p-5 bg-white border-2 border-amber-200 rounded-3xl shadow-sm text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center font-bold">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">You are not signed in.</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Location will be captured at sign-in time.</p>
                    </div>

                    <button
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition flex items-center justify-center gap-2"
                    >
                      {isSigningIn ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>CAPTURING GPS & SIGNING IN...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>SIGN IN</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* PART 11: SIGNED IN DASHBOARD */
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">STATUS</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white tracking-wider uppercase">
                        SIGNED IN
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sign In Time</span>
                        <p className="font-bold text-slate-800">
                          {new Date(attendanceSession.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sign In Location</span>
                        <p className="font-bold text-slate-800 truncate">
                          {attendanceSession.signInLocation?.address || 'Salem'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* KPI Cards */}
                <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                    TODAY'S COLLECTION
                  </span>
                  <div className="text-3xl font-black mt-1">
                    ₹{Number(todaySummary.todayCollection || 0).toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-emerald-100 mt-1">Cash held by you</p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">TRANSACTIONS</span>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">
                      {todaySummary.todayTransactionCount || 0}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                </div>

                {/* Big Action Buttons */}
                <div className="pt-1 space-y-2.5">
                  <button
                    onClick={() => {
                      if (!attendanceSession || attendanceSession.status !== 'ACTIVE') {
                        setPaymentError('You must SIGN IN before collecting cash');
                        return;
                      }
                      setScreen('search');
                      handleSearch('');
                    }}
                    className={`w-full py-4 px-4 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition ${
                      attendanceSession?.status === 'ACTIVE'
                        ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/30'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-sm">SEARCH & COLLECT PAYMENT</span>
                  </button>

                  {attendanceSession?.status === 'ACTIVE' && (
                    <button
                      onClick={() => setShowSignOutConfirm(true)}
                      className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-md shadow-rose-600/20 text-xs flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>SIGN OUT</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      fetchCollectorToday();
                      fetchAttendanceSession();
                    }}
                    className="w-full py-2.5 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm text-xs flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Refresh Status</span>
                  </button>
                </div>
              </div>

              {/* MODAL: SIGN OUT CONFIRMATION (Part 16 & 38) */}
              {showSignOutConfirm && (
                <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
                  <div className="bg-white rounded-3xl p-5 w-full text-slate-900 space-y-4 shadow-2xl border border-slate-200">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center font-bold mb-2">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">MARWA TRADERS</h3>
                      <p className="text-xs text-slate-500 font-bold">Today's Collection Summary</p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl space-y-2 text-xs border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Employee:</span>
                        <span className="font-bold text-slate-900">{collectorUser?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Transactions:</span>
                        <span className="font-bold text-slate-900">{todaySummary.todayTransactionCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Total Cash Collected:</span>
                        <span className="font-bold text-emerald-600">₹{Number(todaySummary.todayCollection || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Expected Cash:</span>
                        <span className="font-bold text-slate-900">₹{Number(todaySummary.todayCollection || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500 font-medium">Sign In:</span>
                        <span className="font-semibold text-slate-800">
                          {attendanceSession?.signInTime ? new Date(attendanceSession.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Sign In Location:</span>
                        <span className="font-semibold text-slate-800 truncate">
                          {attendanceSession?.signInLocation?.address || 'Salem'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-center font-bold text-slate-700">Are you sure you want to sign out?</p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setShowSignOutConfirm(false)}
                        disabled={isSigningOut}
                        className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        CANCEL
                      </button>
                      <button
                        onClick={handleSignOutConfirm}
                        disabled={isSigningOut}
                        className="py-3 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                      >
                        {isSigningOut ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>SIGN OUT</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL: SIGNED OUT SUCCESSFULLY (Part 38) */}
              {showSignOutSuccess && (
                <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
                  <div className="bg-white rounded-3xl p-5 w-full text-slate-900 space-y-4 shadow-2xl border border-slate-200 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">SIGNED OUT SUCCESSFULLY</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Shift completed for today</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs border border-slate-100 text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Today's Collection:</span>
                        <span className="font-black text-emerald-600 text-sm">₹{Number(signOutSummary?.totalCollected || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Transactions:</span>
                        <span className="font-bold text-slate-900">{signOutSummary?.totalTransactions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Sign Out:</span>
                        <span className="font-bold text-slate-800">
                          {signOutSummary?.signOutTime ? new Date(signOutSummary.signOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
                      Owner daily report has been processed.
                    </p>

                    <button
                      onClick={() => setShowSignOutSuccess(false)}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                    >
                      DONE
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCREEN: 3. SEARCH CUSTOMER (Section 8 & 35) */}
          {screen === 'search' && (
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
              <div className="p-3 bg-slate-900 text-white flex items-center gap-2">
                <button onClick={() => setScreen('dashboard')} className="p-1 text-slate-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-sm font-bold">Select Shop to Collect</h2>
              </div>

              {/* Search Input */}
              <div className="p-3 bg-white border-b border-slate-200">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search shop, owner, or mobile..."
                    className="w-full bg-transparent text-xs text-slate-900 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              {/* Customer List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {searchResults.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => startCollection(c)}
                    className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm active:bg-sky-50 transition cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{c.shopName}</h3>
                        <p className="text-[11px] text-slate-500">{c.ownerName} • {c.mobile}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{c.address}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Due</span>
                        <div className="text-sm font-black text-rose-600">
                          ₹{Number(c.currentOutstanding || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN: 4. COLLECT PAYMENT AMOUNT (Section 13) */}
          {screen === 'collect' && selectedCustomer && (
            <div className="flex-1 flex flex-col justify-between bg-slate-50 p-4 overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setScreen('search')} className="p-1 text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-sm font-bold text-slate-900">Enter Payment Amount</h2>
                </div>

                {/* Customer Card */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm mb-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{selectedCustomer.shopName}</h3>
                      <p className="text-xs text-slate-500">{selectedCustomer.ownerName} • {selectedCustomer.mobile}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md h-fit">
                      {selectedCustomer.customerCode}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500">Current Outstanding:</span>
                    <span className="text-base font-black text-rose-600">
                      ₹{selectedCustomer.currentOutstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {paymentError && (
                  <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                    {paymentError}
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Cash Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedCustomer.currentOutstanding}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0"
                      className="w-full py-3 px-4 text-center text-3xl font-black font-mono text-slate-900 bg-white border-2 border-sky-500 rounded-2xl shadow-inner focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Payment Mode Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                      Select Payment Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMode('CASH')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          paymentMode === 'CASH'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        💵 CASH
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('GPAY')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          paymentMode === 'GPAY'
                            ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        📱 GPAY / UPI
                      </button>
                    </div>
                  </div>

                  {/* GPS Location Tag (Section 18) */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 px-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">GPS: {gpsLocation.latitude}, {gpsLocation.longitude}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={goToConfirmation}
                disabled={!paymentAmount || Number(paymentAmount) <= 0}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/30 text-sm active:scale-95 transition disabled:opacity-50"
              >
                PROCEED TO CONFIRM
              </button>
            </div>
          )}

          {/* SCREEN: 5. EXPLICIT PAYMENT CONFIRMATION (Section 14 & 44) */}
          {screen === 'confirm' && selectedCustomer && (
            <div className="flex-1 flex flex-col justify-between bg-slate-900 text-white p-5">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setScreen('collect')} className="p-1 text-slate-400 hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-sky-400">Confirm Payment</h2>
                </div>

                {/* Explicit Details (Section 14) */}
                <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Customer</span>
                    <div className="text-base font-bold text-white">{selectedCustomer.shopName}</div>
                    <div className="text-[11px] text-slate-400">{selectedCustomer.address}</div>
                  </div>

                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="text-slate-400">Previous Outstanding:</span>
                    <span className="font-bold">₹{selectedCustomer.currentOutstanding.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between py-1 border-y border-dashed border-slate-600">
                    <span className="text-emerald-400 font-bold">Payment Amount:</span>
                    <span className="text-base font-black text-emerald-400">
                      ₹{Number(paymentAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining Outstanding:</span>
                    <span className="font-bold text-rose-400">
                      ₹{Math.max(0, selectedCustomer.currentOutstanding - Number(paymentAmount)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="border-t border-slate-700 pt-2 flex justify-between text-[11px]">
                    <span className="text-slate-400">Collected By:</span>
                    <span className="font-semibold text-white">{collectorUser?.name}</span>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Payment Mode:</span>
                    <span className="font-bold text-emerald-400">
                      {paymentMode === 'GPAY' ? '📱 GPAY / UPI' : '💵 CASH'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-[10px] text-emerald-300 text-center font-medium">
                    ✓ WhatsApp Receipt will be sent to customer: {selectedCustomer.shopName} ({selectedCustomer.mobile})
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <button
                  onClick={submitFinalPayment}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/30 active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'CONFIRMING...' : 'CONFIRM PAYMENT'}
                </button>
                <button
                  onClick={() => setScreen('collect')}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-medium"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: 6. SUCCESS & PRINT RECEIPT (Section 19 & 44) */}
          {screen === 'success' && confirmedPayment && (
            <div className="flex-1 flex flex-col justify-between bg-white p-5 text-center">
              <div className="pt-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-lg font-black text-slate-900">PAYMENT SUCCESSFUL</h2>
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">Recorded immutably in system</p>

                {/* Receipt Card */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Receipt No:</span>
                    <span className="font-mono font-bold text-sky-600">{confirmedPayment.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Amount Received:</span>
                    <span className="font-black text-emerald-600 text-sm">
                      ₹{confirmedPayment.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Remaining Due:</span>
                    <span className="font-bold text-slate-800">
                      ₹{confirmedPayment.remainingOutstanding.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-3">
                  WhatsApp notification sent to Customer & Owner automatically.
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => onPrintReceipt(confirmedPayment)}
                  className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 text-xs active:scale-95 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>PRINT 58MM RECEIPT</span>
                </button>

                <button
                  onClick={() => {
                    setScreen('dashboard');
                    setSelectedCustomer(null);
                    setConfirmedPayment(null);
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs active:scale-95 transition"
                >
                  DONE (NEW COLLECTION)
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
