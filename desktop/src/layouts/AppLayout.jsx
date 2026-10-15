import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  HandCoins, 
  ShieldAlert, 
  BarChart3, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Building2,
  Clock,
  UserCog
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AppLayout({ currentTab, setCurrentTab, children, openMobileCollector }) {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || 'STAFF';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN'] },
    { id: 'users', label: 'User Management', icon: UserCog, roles: ['OWNER', 'ADMIN'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['OWNER', 'ADMIN', 'STAFF'] },
    { id: 'invoices', label: 'Invoices', icon: FileText, roles: ['OWNER', 'ADMIN', 'STAFF'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['OWNER', 'ADMIN', 'STAFF', 'CASH_COLLECTOR'] },
    { id: 'settlements', label: 'Cash Settlements', icon: HandCoins, roles: ['OWNER', 'ADMIN'] },
    { id: 'corrections', label: 'Corrections', icon: ShieldAlert, roles: ['OWNER', 'ADMIN'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['OWNER', 'ADMIN'] },
    { id: 'audit', label: 'Audit Logs', icon: History, roles: ['OWNER'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['OWNER'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(role));

  const roleBadgeColors = {
    OWNER: 'bg-amber-100 text-amber-800 border-amber-300',
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
    STAFF: 'bg-blue-100 text-blue-800 border-blue-300',
    CASH_COLLECTOR: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-sky-900/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white">MARWA TRADERS</h1>
              <p className="text-xs text-sky-400 font-medium">Collection Management</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Brief */}
        <div className="px-5 py-4 bg-slate-800/60 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Code: {user?.code}</p>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleBadgeColors[role] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
              {role}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left
                  ${active 
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 capitalize">
              {currentTab === 'settlements' ? 'Cash Settlements & Shortage Tracking' : currentTab}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-600 font-medium">Online</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
