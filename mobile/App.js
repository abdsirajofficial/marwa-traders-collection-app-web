import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import api, { setAuthToken } from './src/services/api';
import { ThermalPrinterService } from './src/services/printerService';
import { getCollectionLocation } from './src/services/locationService';

export default function App() {
  const [screen, setScreen] = useState('login'); // 'login' | 'dashboard' | 'search' | 'collect' | 'confirm' | 'success' | 'history'
  const [user, setUser] = useState(null);
  const [code, setCode] = useState('4001'); // Default collector Ravi
  const [loading, setLoading] = useState(false);

  // Today summary
  const [todaySummary, setTodaySummary] = useState({ todayCollection: 0, todayTransactionCount: 0 });

  // Customer search & selection
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Payment form
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH'); // 'CASH' | 'GPAY'
  const [confirmedPayment, setConfirmedPayment] = useState(null);
  const [printerError, setPrinterError] = useState(null);

  // My Collections History
  const [myHistory, setMyHistory] = useState([]);

  // Prompt 2: Attendance state
  const [attendanceSession, setAttendanceSession] = useState(null);

  // Login handler
  const handleLogin = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter your collector code');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { code: code.trim() });
      setAuthToken(res.data.token);
      setUser(res.data.user);
      setScreen('dashboard');
      loadTodayMetrics();
      loadAttendanceSession();
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceSession = async () => {
    try {
      const res = await api.get('/employee-attendance/today');
      setAttendanceSession(res.data.session || null);
    } catch (err) {
      console.log('Attendance error:', err.message);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const loc = await getCollectionLocation('Salem Counter');
      const res = await api.post('/employee-attendance/sign-in', {
        location: {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.locationName || 'Salem Mobile Point',
        },
      });
      setAttendanceSession(res.data.session);
      Alert.alert('Signed In', `Work Session: ${res.data.session.workSessionId}`);
    } catch (err) {
      Alert.alert('Sign-In Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!attendanceSession || attendanceSession.status !== 'ACTIVE') {
      Alert.alert('Not Signed In', 'No active work session to sign out');
      return;
    }

    Alert.alert(
      "Today's Collection Summary",
      `Employee: ${user?.name}\nTransactions: ${todaySummary.todayTransactionCount || 0}\nTotal Cash Collected: ₹${Number(todaySummary.todayCollection || 0).toLocaleString('en-IN')}\nExpected Cash: ₹${Number(todaySummary.todayCollection || 0).toLocaleString('en-IN')}\n\nAre you sure you want to sign out?`,
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'SIGN OUT',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const loc = await getCollectionLocation('Salem Depot');
              const res = await api.post('/employee-attendance/sign-out', {
                workSessionId: attendanceSession.workSessionId,
                location: {
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  address: loc.locationName || 'Salem Depot',
                },
              });
              setAttendanceSession(res.data.session);
              loadTodayMetrics();
              Alert.alert(
                'SIGNED OUT SUCCESSFULLY',
                `Today's Collection: ₹${Number(res.data.summary.totalCollected || 0).toLocaleString('en-IN')}\nTransactions: ${res.data.summary.totalTransactions}\n\nOwner daily report has been processed.`
              );
            } catch (err) {
              Alert.alert('Sign-Out Error', err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const loadTodayMetrics = async () => {
    try {
      const res = await api.get('/payments/collector/today');
      setTodaySummary(res.data);
    } catch (err) {
      console.log('Metrics error:', err.message);
    }
  };

  const loadCustomers = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { search: q, limit: 50 } });
      setCustomers(res.data.customers || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMyHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', { params: { limit: 50 } });
      setMyHistory(res.data.payments || []);
      setScreen('history');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (item) => {
    if (!attendanceSession || attendanceSession.status !== 'ACTIVE') {
      Alert.alert('Sign-In Required', 'You must SIGN IN before collecting cash payments.');
      return;
    }
    setSelectedCustomer(item);
    setAmount('');
    setPaymentMode('CASH');
    setScreen('collect');
  };

  const handleProceedToConfirm = () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
      return;
    }
    if (num > selectedCustomer.currentOutstanding) {
      Alert.alert(
        'Overpayment Rejected',
        `Amount (₹${num.toLocaleString('en-IN')}) cannot exceed customer balance of ₹${selectedCustomer.currentOutstanding.toLocaleString('en-IN')}`
      );
      return;
    }
    setScreen('confirm');
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setPrinterError(null);
    try {
      const location = await getCollectionLocation('Collector Live Location');
      const idempotencyKey = `mob_${user.id}_${selectedCustomer._id}_${Date.now()}`;

      // Section 20: Payment must be saved BEFORE printing!
      const res = await api.post('/payments', {
        customerId: selectedCustomer._id,
        amount: Number(amount),
        paymentMode,
        location,
        idempotencyKey,
      });

      const payment = res.data.payment;
      setConfirmedPayment(payment);
      setScreen('success');
      loadTodayMetrics();

      // Trigger automatic 58mm thermal print
      try {
        await ThermalPrinterService.printPaymentReceipt(payment);
      } catch (printErr) {
        // Section 20: Payment remains successful even if printer fails!
        setPrinterError('Payment recorded successfully. Printer unavailable.');
      }
    } catch (err) {
      Alert.alert('Payment Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAgain = async () => {
    if (!confirmedPayment) return;
    try {
      await ThermalPrinterService.printPaymentReceipt(confirmedPayment);
      Alert.alert('Printer', 'Receipt sent to thermal printer');
      setPrinterError(null);
    } catch (err) {
      Alert.alert('Printer Error', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* 1. LOGIN SCREEN */}
      {screen === 'login' && (
        <View style={styles.loginContainer}>
          <View style={styles.brandBox}>
            <Text style={styles.brandTitle}>MARWA TRADERS</Text>
            <Text style={styles.brandSubtitle}>Cash Collector Mobile App</Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.inputLabel}>ENTER CODE</Text>
            <TextInput
              style={styles.codeInput}
              keyboardType="numeric"
              maxLength={6}
              secureTextEntry
              value={code}
              onChangeText={setCode}
              placeholder="4001"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>LOGIN</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoCodes}>
              <Text style={styles.demoLabel}>Quick Test Collectors:</Text>
              <View style={styles.demoRow}>
                <TouchableOpacity onPress={() => setCode('4001')} style={styles.demoBtn}>
                  <Text style={styles.demoBtnText}>4001: Ravi</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCode('4002')} style={styles.demoBtn}>
                  <Text style={styles.demoBtnText}>4002: Kumar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 2. DASHBOARD SCREEN (Section 34) */}
      {screen === 'dashboard' && (
        <View style={styles.screenContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerRole}>COLLECTOR</Text>
              <Text style={styles.headerName}>{user?.name} ({user?.code})</Text>
            </View>
            <TouchableOpacity onPress={() => setScreen('login')} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Attendance Status Card (Prompt 2 Part 6 & 11) */}
            {(!attendanceSession || attendanceSession.status !== 'ACTIVE') ? (
              <View style={styles.signInCard}>
                <Text style={styles.signInGreeting}>Good Morning, {user?.name}</Text>
                <Text style={styles.signInPrompt}>You are not signed in.</Text>
                <Text style={styles.signInSub}>Location will be captured when you sign in.</Text>
                <TouchableOpacity
                  style={styles.signInButton}
                  onPress={handleSignIn}
                  disabled={loading}
                >
                  <Text style={styles.signInButtonText}>
                    {loading ? 'SIGNING IN...' : 'SIGN IN'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.signedInCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.signedInGreeting}>Good Morning, {user?.name}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>SIGNED IN</Text>
                  </View>
                </View>
                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionLine}>
                    Sign In: {new Date(attendanceSession.signInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.sessionLine}>
                    Location: {attendanceSession.signInLocation?.address || 'Salem'}
                  </Text>
                </View>
              </View>
            )}

            {/* Today Collection Card */}
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY'S COLLECTION</Text>
              <Text style={styles.kpiValue}>
                ₹{Number(todaySummary.todayCollection || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Today Transactions */}
            <View style={styles.secondaryCard}>
              <Text style={styles.secondaryLabel}>TODAY'S TRANSACTIONS</Text>
              <Text style={styles.secondaryValue}>{todaySummary.todayTransactionCount || 0}</Text>
            </View>

            {/* Buttons (Section 34) */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.bigActionBtn,
                  attendanceSession?.status !== 'ACTIVE' && { backgroundColor: '#94a3b8' },
                ]}
                onPress={() => {
                  if (!attendanceSession || attendanceSession.status !== 'ACTIVE') {
                    Alert.alert('Sign-In Required', 'Please click SIGN IN before searching shops and collecting cash.');
                    return;
                  }
                  setScreen('search');
                  loadCustomers('');
                }}
              >
                <Text style={styles.bigActionText}>SEARCH SHOP</Text>
              </TouchableOpacity>

              {attendanceSession?.status === 'ACTIVE' && (
                <TouchableOpacity
                  style={styles.signOutBtn}
                  onPress={handleSignOut}
                >
                  <Text style={styles.signOutText}>SIGN OUT</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={loadMyHistory}
              >
                <Text style={styles.secondaryActionText}>MY COLLECTIONS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => {
                  loadTodayMetrics();
                  loadAttendanceSession();
                }}
              >
                <Text style={styles.secondaryActionText}>REFRESH STATUS</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* 3. CUSTOMER SEARCH SCREEN */}
      {screen === 'search' && (
        <View style={styles.screenContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setScreen('dashboard')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Search Customer</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search shop, owner, mobile, or code..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                loadCustomers(text);
              }}
            />
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} color="#0284c7" />
          ) : (
            <FlatList
              data={customers}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.customerItem}
                  onPress={() => handleSelectCustomer(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shopName}>{item.shopName}</Text>
                    <Text style={styles.shopOwner}>{item.ownerName} • {item.mobile}</Text>
                    <Text style={styles.shopAddress}>{item.address}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.dueLabel}>DUE</Text>
                    <Text style={styles.dueAmount}>
                      ₹{Number(item.currentOutstanding || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* 4. COLLECT PAYMENT SCREEN */}
      {screen === 'collect' && selectedCustomer && (
        <View style={styles.screenContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setScreen('search')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Collect Payment</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.customerSummaryCard}>
              <Text style={styles.shopNameLarge}>{selectedCustomer.shopName}</Text>
              <Text style={styles.shopOwner}>{selectedCustomer.ownerName} • {selectedCustomer.mobile}</Text>
              <View style={styles.divider} />
              <View style={styles.rowBetween}>
                <Text style={styles.mutedText}>Current Outstanding:</Text>
                <Text style={styles.boldRedText}>
                  ₹{Number(selectedCustomer.currentOutstanding).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>ENTER COLLECTION AMOUNT (₹)</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="#cbd5e1"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>SELECT PAYMENT MODE</Text>
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeBtn, paymentMode === 'CASH' && styles.modeBtnActive]}
                  onPress={() => setPaymentMode('CASH')}
                >
                  <Text style={[styles.modeBtnText, paymentMode === 'CASH' && styles.modeBtnTextActive]}>
                    💵 CASH
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeBtn, paymentMode === 'GPAY' && styles.modeBtnActive]}
                  onPress={() => setPaymentMode('GPAY')}
                >
                  <Text style={[styles.modeBtnText, paymentMode === 'GPAY' && styles.modeBtnTextActive]}>
                    📱 GPAY / UPI
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleProceedToConfirm}
            >
              <Text style={styles.primaryButtonText}>PROCEED TO CONFIRM</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 5. CONFIRMATION SCREEN (Section 14) */}
      {screen === 'confirm' && selectedCustomer && (
        <View style={styles.screenContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setScreen('collect')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Confirmation</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmHeading}>CHECK DETAILS CAREFULLY</Text>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Customer:</Text>
                <Text style={styles.confirmValBold}>{selectedCustomer.shopName}</Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Previous Outstanding:</Text>
                <Text style={styles.confirmVal}>
                  ₹{Number(selectedCustomer.currentOutstanding).toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.confirmRowHighlight}>
                <Text style={styles.confirmHighlightLabel}>Payment Amount:</Text>
                <Text style={styles.confirmHighlightVal}>
                  ₹{Number(amount).toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Remaining Outstanding:</Text>
                <Text style={styles.confirmValBold}>
                  ₹{Math.max(0, selectedCustomer.currentOutstanding - Number(amount)).toLocaleString('en-IN')}
                </Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Collected By:</Text>
                <Text style={styles.confirmVal}>{user?.name}</Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Payment Mode:</Text>
                <Text style={styles.confirmValBold}>
                  {paymentMode === 'GPAY' ? '📱 GPAY / UPI' : '💵 CASH'}
                </Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Location Capture:</Text>
                <Text style={[styles.confirmVal, { color: '#38bdf8' }]}>Real GPS Presence</Text>
              </View>

              <View style={styles.receiptNoticeBox}>
                <Text style={styles.receiptNoticeText}>
                  WhatsApp Receipt will be sent to customer: {selectedCustomer.shopName} ({selectedCustomer.mobile})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmPayment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.confirmButtonText}>CONFIRM PAYMENT</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setScreen('collect')}
            >
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 6. SUCCESS & PRINT RECEIPT (Section 19, 20, 44) */}
      {screen === 'success' && confirmedPayment && (
        <View style={styles.screenContainer}>
          <ScrollView style={styles.content}>
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successHeading}>PAYMENT SUCCESSFUL</Text>

              {printerError ? (
                <View style={styles.printerAlert}>
                  <Text style={styles.printerAlertText}>{printerError}</Text>
                </View>
              ) : null}

              <View style={styles.receiptBox}>
                <Text style={styles.receiptLine}>Receipt No:   {confirmedPayment.receiptNumber}</Text>
                <Text style={styles.receiptLine}>Customer:     {selectedCustomer?.shopName}</Text>
                <Text style={styles.receiptLine}>Mode:         {confirmedPayment.paymentMode || paymentMode}</Text>
                <Text style={styles.receiptLine}>Received:     ₹{Number(confirmedPayment.amount).toLocaleString('en-IN')}</Text>
                <Text style={styles.receiptLine}>Remaining:    ₹{Number(confirmedPayment.remainingOutstanding).toLocaleString('en-IN')}</Text>
                {confirmedPayment.location?.latitude && (
                  <Text style={styles.receiptLine}>GPS Coords:   {confirmedPayment.location.latitude}, {confirmedPayment.location.longitude}</Text>
                )}
              </View>

              <View style={[styles.receiptNoticeBox, { width: '100%', marginTop: 14 }]}>
                <Text style={styles.receiptNoticeText}>
                  ✓ WhatsApp Receipt sent to Shop Owner: {selectedCustomer?.shopName} ({selectedCustomer?.mobile})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.printButton}
              onPress={handlePrintAgain}
            >
              <Text style={styles.printButtonText}>PRINT RECEIPT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                setScreen('dashboard');
                setSelectedCustomer(null);
                setConfirmedPayment(null);
              }}
            >
              <Text style={styles.doneButtonText}>DONE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 7. MY COLLECTIONS HISTORY */}
      {screen === 'history' && (
        <View style={styles.screenContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setScreen('dashboard')} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Collections</Text>
            <View style={{ width: 40 }} />
          </View>

          <FlatList
            data={myHistory}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.historyReceipt}>{item.receiptNumber}</Text>
                  <Text style={styles.historyAmount}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.historyCustomer}>{item.customerId?.shopName || 'Customer'}</Text>
                <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleString('en-IN')}</Text>
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  screenContainer: { flex: 1, backgroundColor: '#f8fafc' },
  loginContainer: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0f172a' },
  brandBox: { alignItems: 'center', marginBottom: 32 },
  brandTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  brandSubtitle: { fontSize: 13, color: '#38bdf8', marginTop: 4, fontWeight: '600' },
  loginCard: { backgroundColor: '#1e293b', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#334155' },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textAlign: 'center', marginBottom: 12, letterSpacing: 1 },
  codeInput: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    color: '#fff',
    fontSize: 28,
    textAlign: 'center',
    paddingVertical: 14,
    fontWeight: '800',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: 20,
  },
  primaryButton: { backgroundColor: '#0284c7', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
  demoCodes: { marginTop: 20, borderTopWidth: 1, borderColor: '#334155', paddingTop: 16 },
  demoLabel: { fontSize: 11, color: '#64748b', textAlign: 'center', marginBottom: 8 },
  demoRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  demoBtn: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  demoBtnText: { color: '#34d399', fontSize: 12, fontWeight: '600' },

  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRole: { fontSize: 10, color: '#34d399', fontWeight: '800', letterSpacing: 1 },
  headerName: { fontSize: 15, color: '#fff', fontWeight: '800' },
  headerTitle: { fontSize: 16, color: '#fff', fontWeight: '800' },
  logoutBtn: { padding: 6 },
  logoutText: { color: '#f87171', fontSize: 12, fontWeight: '600' },
  backBtn: { padding: 4 },
  backText: { color: '#38bdf8', fontSize: 14, fontWeight: '700' },

  content: { padding: 16 },
  kpiCard: { backgroundColor: '#059669', padding: 20, borderRadius: 20, marginBottom: 12 },
  kpiLabel: { color: '#a7f3d0', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  kpiValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 4 },
  secondaryCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  secondaryLabel: { color: '#64748b', fontSize: 11, fontWeight: '800' },
  secondaryValue: { color: '#0f172a', fontSize: 24, fontWeight: '900', marginTop: 4 },

  actionsContainer: { gap: 12 },
  bigActionBtn: { backgroundColor: '#0284c7', paddingVertical: 18, borderRadius: 18, alignItems: 'center', elevation: 3 },
  bigActionText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  secondaryActionBtn: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  secondaryActionText: { color: '#334155', fontSize: 13, fontWeight: '700' },

  searchBar: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { backgroundColor: '#f1f5f9', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, fontSize: 14, color: '#0f172a' },
  customerItem: { backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0' },
  shopName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  shopNameLarge: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  shopOwner: { fontSize: 12, color: '#64748b', marginTop: 2 },
  shopAddress: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  dueLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800' },
  dueAmount: { fontSize: 14, fontWeight: '900', color: '#e11d48' },

  customerSummaryCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mutedText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  boldRedText: { fontSize: 18, fontWeight: '900', color: '#e11d48' },
  inputCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  amountInput: { fontSize: 32, fontWeight: '900', textAlign: 'center', color: '#0f172a', paddingVertical: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#0284c7', marginVertical: 10 },
  badgeRow: { alignItems: 'center', marginTop: 4 },
  cashBadge: { backgroundColor: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modeSelector: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  modeBtnActive: { borderColor: '#0284c7', backgroundColor: '#e0f2fe' },
  modeBtnText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  modeBtnTextActive: { color: '#0369a1', fontWeight: '900' },
  receiptNoticeBox: { marginTop: 10, backgroundColor: '#f0fdf4', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
  receiptNoticeText: { color: '#166534', fontSize: 11, fontWeight: '700', textAlign: 'center' },

  confirmBox: { backgroundColor: '#1e293b', padding: 18, borderRadius: 20, marginBottom: 20 },
  confirmHeading: { color: '#38bdf8', fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 14, letterSpacing: 1 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#334155' },
  confirmRowHighlight: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#334155' },
  confirmLabel: { color: '#94a3b8', fontSize: 13 },
  confirmVal: { color: '#fff', fontSize: 13, fontWeight: '600' },
  confirmValBold: { color: '#fff', fontSize: 14, fontWeight: '800' },
  confirmHighlightLabel: { color: '#34d399', fontSize: 14, fontWeight: '800' },
  confirmHighlightVal: { color: '#34d399', fontSize: 18, fontWeight: '900' },
  confirmButton: { backgroundColor: '#34d399', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginBottom: 10 },
  confirmButtonText: { color: '#0f172a', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },

  successBox: { alignItems: 'center', backgroundColor: '#fff', padding: 24, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  successIcon: { fontSize: 44, color: '#10b981', fontWeight: 'bold' },
  successHeading: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginTop: 8 },
  printerAlert: { backgroundColor: '#fef3c7', padding: 10, borderRadius: 10, marginTop: 12, borderWidth: 1, borderColor: '#fde68a' },
  printerAlertText: { color: '#92400e', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  receiptBox: { marginTop: 16, backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, width: '100%', borderWidth: 1, borderColor: '#e2e8f0' },
  receiptLine: { fontSize: 12, color: '#334155', fontFamily: 'monospace', paddingVertical: 2 },
  printButton: { backgroundColor: '#0284c7', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 10 },
  printButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  doneButton: { backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  doneButtonText: { color: '#334155', fontWeight: '700', fontSize: 14 },

  historyCard: { backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  historyReceipt: { fontSize: 13, fontWeight: '800', color: '#0284c7' },
  historyAmount: { fontSize: 14, fontWeight: '900', color: '#059669' },
  historyCustomer: { fontSize: 12, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  historyDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  // Prompt 2: Attendance Styles
  signInCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 16, alignItems: 'center', borderWidth: 2, borderColor: '#fef3c7' },
  signInGreeting: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  signInPrompt: { fontSize: 16, fontWeight: '900', color: '#d97706', marginTop: 4 },
  signInSub: { fontSize: 11, color: '#64748b', marginTop: 2, marginBottom: 14, textAlign: 'center' },
  signInButton: { backgroundColor: '#059669', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, elevation: 3 },
  signInButtonText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  signedInCard: { backgroundColor: '#ecfdf5', padding: 16, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: '#a7f3d0' },
  signedInGreeting: { fontSize: 14, fontWeight: '800', color: '#065f46' },
  activeBadge: { backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sessionDetails: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#d1fae5' },
  sessionLine: { fontSize: 12, color: '#047857', fontWeight: '600', marginTop: 2 },

  signOutBtn: { backgroundColor: '#e11d48', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  signOutText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});

