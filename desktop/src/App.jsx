import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import InvoicesPage from './pages/InvoicesPage';
import PaymentsPage from './pages/PaymentsPage';
import SettlementsPage from './pages/SettlementsPage';
import CorrectionsPage from './pages/CorrectionsPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import ThermalReceipt from './components/ThermalReceipt';

export default function App() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [activeReceipt, setActiveReceipt] = useState(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Adjust default tab according to user role
  useEffect(() => {
    if (user?.role === 'STAFF') {
      setCurrentTab('customers');
    } else if (user?.role === 'CASH_COLLECTOR') {
      setCurrentTab('payments');
    }
  }, [user]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    // Prevent staff from viewing restricted tabs
    if (user?.role === 'STAFF' && ['dashboard', 'users', 'corrections', 'reports', 'settlements', 'audit', 'settings'].includes(currentTab)) {
      return <CustomersPage onSelectPayment={(payment) => setActiveReceipt(payment)} />;
    }

    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'users':
        return <UsersPage />;
      case 'customers':
        return <CustomersPage onSelectPayment={(payment) => setActiveReceipt(payment)} />;
      case 'invoices':
        return <InvoicesPage />;
      case 'payments':
        return <PaymentsPage onSelectPayment={(payment) => setActiveReceipt(payment)} />;
      case 'settlements':
        return <SettlementsPage />;
      case 'corrections':
        return <CorrectionsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit':
        return <AuditLogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <>
      <AppLayout
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      >
        {renderContent()}
      </AppLayout>

      {/* 58mm ESC/POS Thermal Receipt Modal */}
      {activeReceipt && (
        <ThermalReceipt
          payment={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </>
  );
}
