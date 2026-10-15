import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Check, 
  Copy, 
  Phone, 
  BadgeCheck, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Sparkles,
  Lock,
  User,
  Shield,
  Truck,
  Briefcase,
  Pencil,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const ROLE_CONFIGS = {
  OWNER: {
    label: 'Owner',
    icon: Sparkles,
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    avatarBg: 'bg-amber-500 text-white',
    desc: 'Full system privileges & enterprise control',
    defaultCodePrefix: '100',
    defaultPermissions: ['ALL_PERMISSIONS', 'MANAGE_USERS', 'SETTLE_CASH', 'AUDIT_LOGS']
  },
  ADMIN: {
    label: 'Admin',
    icon: Shield,
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
    avatarBg: 'bg-purple-600 text-white',
    desc: 'System oversight, settlement approval & cash management',
    defaultCodePrefix: '200',
    defaultPermissions: ['MANAGE_USERS', 'SETTLE_CASH', 'VIEW_REPORTS', 'APPROVE_CORRECTIONS']
  },
  STAFF: {
    label: 'Staff',
    icon: Briefcase,
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    avatarBg: 'bg-blue-600 text-white',
    desc: 'Counter sales, billing entry & customer inquiries',
    defaultCodePrefix: '300',
    defaultPermissions: ['CREATE_INVOICES', 'RECORD_PAYMENTS', 'VIEW_CUSTOMERS']
  },
  CASH_COLLECTOR: {
    label: 'Cash Collector',
    icon: Truck,
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    avatarBg: 'bg-emerald-600 text-white',
    desc: 'Mobile field collections, receipts & customer ledger updates',
    defaultCodePrefix: '400',
    defaultPermissions: ['COLLECT_PAYMENTS', 'PRINT_RECEIPTS', 'VIEW_CUSTOMERS']
  }
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const isOwner = currentUser?.role === 'OWNER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaff = currentUser?.role === 'STAFF';

  // Allowed roles that this user can create / assign
  const creatableRoles = useMemo(() => {
    if (isOwner) {
      return ['OWNER', 'ADMIN', 'STAFF', 'CASH_COLLECTOR'];
    }
    if (isAdmin || isStaff) {
      return ['ADMIN', 'STAFF', 'CASH_COLLECTOR'];
    }
    return [];
  }, [isOwner, isAdmin, isStaff]);

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      const userList = res.data?.users || res.users || [];
      setUsers(userList);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered Users (only present users are returned from API)
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.code?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search);
      
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: users.length,
      owners: users.filter(u => u.role === 'OWNER').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      staff: users.filter(u => u.role === 'STAFF').length,
      collectors: users.filter(u => u.role === 'CASH_COLLECTOR').length,
    };
  }, [users]);

  // Soft Delete User
  const handleDeleteUser = async (targetUser) => {
    if (targetUser._id === currentUser?.id || targetUser.code === currentUser?.code) {
      alert('You cannot delete your own active account.');
      return;
    }

    if (isAdmin && targetUser.role === 'OWNER') {
      alert('Admins cannot delete Owner accounts.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete user "${targetUser.name}" (${targetUser.code})?\n\nThis will remove them from the system.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${targetUser._id}`);
      setUsers(prev => prev.filter(u => u._id !== targetUser._id));
      setSuccessBanner(`User "${targetUser.name}" (${targetUser.code}) has been deleted.`);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Role Permissions Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-sky-600" />
            <span>User Management</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Manage system access credentials, role authorizations, and field staff accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition"
            title="Refresh Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {(isOwner || isAdmin) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 flex items-center gap-2 transition active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Permission Guidance Notice */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
        isOwner 
          ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' 
          : 'bg-purple-50/70 border-purple-200/80 text-purple-900'
      }`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isOwner ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {isOwner ? <Sparkles className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        </div>
        <div className="text-xs">
          <p className="font-bold text-sm">
            {isOwner ? '👑 Owner Privileges Active' : '🛡️ Admin Privileges Active'}
          </p>
          <p className="mt-0.5 opacity-90">
            {isOwner ? (
              <>As <strong>Owner</strong>, you have full authority to create <strong>all user roles</strong> (Owner, Admin, Staff, and Cash Collector).</>
            ) : (
              <>As <strong>Admin</strong>, you have authorized permission to create and manage <strong>Admin</strong> and <strong>Cash Collector</strong> accounts.</>
            )}
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-0.5 block">Active Accounts</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Owners
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.owners}</div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Primary Control</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-purple-500" /> Admins
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.admins}</div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Management</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <Truck className="w-3 h-3 text-emerald-500" /> Collectors
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.collectors}</div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Field Agents</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-blue-500" /> Staff
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.staff}</div>
          <span className="text-[11px] text-slate-400 block mt-0.5">Counter / Billing</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none transition"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {['ALL', 'OWNER', 'ADMIN', 'CASH_COLLECTOR', 'STAFF'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  roleFilter === r
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : ROLE_CONFIGS[r]?.label || r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
            <p className="text-xs font-medium">Loading user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">No users found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or create a new user account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Access Code</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const roleCfg = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.STAFF;
                  const RoleIcon = roleCfg.icon;
                  const isCurrent = u._id === currentUser?.id || u.code === currentUser?.code;
                  const canModify = isOwner || ((isAdmin || isStaff) && u.role !== 'OWNER');

                  return (
                    <tr key={u._id || u.code} className="hover:bg-slate-50/60 transition">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${roleCfg.avatarBg}`}>
                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{roleCfg.desc}</span>
                          </div>
                        </div>
                      </td>

                      {/* Login Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-slate-900">
                            {u.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(u.code)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Copy Login Code"
                          >
                            {copiedCode === u.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleCfg.badgeBg}`}>
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleCfg.label}</span>
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {u.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not provided</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {canModify && !isCurrent ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition flex items-center gap-1"
                              title="Edit user details"
                            >
                              <Pencil className="w-3 h-3 text-sky-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1"
                              title="Delete user"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : isCurrent ? (
                          <span className="text-[11px] text-slate-400 italic">You (Active)</span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          existingUsers={users}
          creatableRoles={creatableRoles}
          isOwner={isOwner}
          isAdmin={isAdmin || isStaff}
          onClose={() => setShowAddModal(false)}
          onSuccess={(newUser) => {
            setShowAddModal(false);
            setUsers(prev => [newUser, ...prev]);
            setSuccessBanner(`Successfully created user "${newUser.name}" with access code ${newUser.code}.`);
            setTimeout(() => setSuccessBanner(null), 5000);
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOwner={isOwner}
          isAdmin={isAdmin || isStaff}
          onClose={() => setEditingUser(null)}
          onSuccess={(updatedUser) => {
            setEditingUser(null);
            setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
            setSuccessBanner(`Successfully updated details for "${updatedUser.name}".`);
            setTimeout(() => setSuccessBanner(null), 4000);
          }}
        />
      )}
    </div>
  );
}

// Add User Modal Component
function AddUserModal({ existingUsers, creatableRoles, isOwner, isAdmin, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState(creatableRoles[0] || 'CASH_COLLECTOR');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Auto suggest next code whenever role changes
  useEffect(() => {
    const rolePrefix = ROLE_CONFIGS[role]?.defaultCodePrefix || '400';
    // Find highest numeric code starting with prefix
    const codesWithPrefix = existingUsers
      .map(u => parseInt(u.code, 10))
      .filter(num => !isNaN(num) && num.toString().startsWith(rolePrefix.substring(0, 1)));

    let nextCodeNum = parseInt(`${rolePrefix}1`, 10);
    if (codesWithPrefix.length > 0) {
      const maxCode = Math.max(...codesWithPrefix);
      nextCodeNum = maxCode + 1;
    }
    setCode(nextCodeNum.toString());
  }, [role, existingUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter user full name');
      return;
    }

    if (!code.trim()) {
      setFormError('Please enter a login code');
      return;
    }

    if (!creatableRoles.includes(role)) {
      setFormError(`You do not have permission to create accounts with role "${role}"`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        role,
        phone: phone.trim() || undefined,
        permissions: ROLE_CONFIGS[role]?.defaultPermissions || [],
      };

      const res = await api.post('/users', payload);
      const createdUser = res.data?.user || res.user || { ...payload, isActive: true, _id: Date.now().toString() };
      onSuccess(createdUser);
    } catch (err) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-scaleUp">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New User</h2>
              <p className="text-xs text-sky-300">
                {isOwner ? '👑 Owner: Can add all roles' : '🛡️ Admin: Can add Admin & Cash Collector'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Role & Permissions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {['OWNER', 'ADMIN', 'CASH_COLLECTOR', 'STAFF'].map(r => {
                const cfg = ROLE_CONFIGS[r];
                const Icon = cfg.icon;
                const isAllowed = creatableRoles.includes(r);
                const isSelected = role === r;

                return (
                  <button
                    key={r}
                    type="button"
                    disabled={!isAllowed}
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20'
                        : isAllowed
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <Icon className="w-3.5 h-3.5 text-sky-600" />
                        <span>{cfg.label}</span>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {isAllowed ? cfg.desc : 'Restricted for Owner only'}
                    </span>
                  </button>
                );
              })}
            </div>
            {isAdmin && (
              <p className="text-[11px] text-purple-700 mt-2 font-medium">
                * As an Administrator, your permissions allow creating <strong>Admin</strong> and <strong>Cash Collector</strong> accounts.
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mohamed Irfan or Collector Rajesh"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Code & Phone (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Login Access Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Login Code / User ID *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 4003"
                  className="w-full pl-10 pr-4 py-2.5 font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-sky-500 focus:outline-none transition"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Suggested based on {ROLE_CONFIGS[role]?.label} role sequence.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phone Number (Employee Contact)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none transition"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Direct employee phone contact. (Note: Customer shop owners receive WhatsApp receipts automatically).
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Create User Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, isOwner, isAdmin, onClose, onSuccess }) {
  const [name, setName] = useState(user.name || '');
  const [code, setCode] = useState(user.code || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [role, setRole] = useState(user.role || 'CASH_COLLECTOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const availableRoles = useMemo(() => {
    if (isOwner) return ['OWNER', 'ADMIN', 'STAFF', 'CASH_COLLECTOR'];
    if (isAdmin) return ['ADMIN', 'STAFF', 'CASH_COLLECTOR'];
    return [user.role];
  }, [isOwner, isAdmin, user.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter user full name');
      return;
    }
    if (!code.trim()) {
      setFormError('Please enter access code');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.put(`/users/${user._id}`, {
        name: name.trim(),
        code: code.trim(),
        phone: phone.trim(),
        role,
      });
      const updated = res.data?.user || res.user || {
        ...user,
        name: name.trim(),
        code: code.trim(),
        phone: phone.trim(),
        role,
      };
      onSuccess(updated);
    } catch (err) {
      setFormError(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Pencil className="w-5 h-5" />
            <div>
              <h2 className="text-base font-bold">Edit User Details</h2>
              <p className="text-xs text-sky-100">Update code, name, phone, or assigned role</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ravi Kumar"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Access Code * (Login PIN)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 4001"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number (Employee Contact)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none transition"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Direct employee phone contact. (Note: Customer shop owners receive WhatsApp receipts automatically).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Role Authority
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={!isOwner && !isAdmin}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none transition disabled:opacity-60"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_CONFIGS[r]?.label || r}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
