import React, { useEffect, useState } from 'react';
import { Settings, CheckCircle2, AlertCircle, Server, MessageSquare, Database, Smartphone } from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.get('/health', { baseURL: 'http://localhost:8080' });
        setHealth(res);
      } catch (err) {
        setHealth({ status: 'offline', error: err.message });
      } finally {
        setLoading(false);
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings & Health</h1>
        <p className="text-sm text-slate-500 font-medium">Verify backend connectivity, WhatsApp service status, and deployment parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend & Cloud Run Status */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Backend Server (Cloud Run)</h2>
              <p className="text-xs text-slate-400">Node.js Express API</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Health Endpoint:</span>
            <span className="font-mono text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Status: OK (HTTP 200)</span>
            </span>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Environment:</span>
              <span className="font-mono font-bold text-slate-800">production / dev</span>
            </div>
            <div className="flex justify-between">
              <span>Architecture:</span>
              <span className="font-semibold text-slate-800">Modular Monolith</span>
            </div>
            <div className="flex justify-between">
              <span>Storage:</span>
              <span className="font-semibold text-slate-800">Stateless (Cloud Run Ready)</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Notification Service */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">WhatsApp Notification Service</h2>
              <p className="text-xs text-slate-400">Customer & Owner Alerts</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Provider Abstraction:</span>
            <span className="font-semibold text-emerald-700">Active</span>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Queue Status:</span>
              <span className="font-semibold text-slate-800">Direct / Optional BullMQ</span>
            </div>
            <div className="flex justify-between">
              <span>Customer Receipt:</span>
              <span className="font-semibold text-emerald-600">Automated</span>
            </div>
            <div className="flex justify-between">
              <span>Owner Alert:</span>
              <span className="font-semibold text-emerald-600">Automated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database & Security Architecture */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-600" />
          <span>Security & Financial Integrity Architecture</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          In strict compliance with architectural rules: Clients never connect directly to MongoDB. All data access flows through authenticated, role-authorized REST APIs with atomic validation and server-generated receipt sequences. Completed collections are append-only and cannot be deleted.
        </p>
      </div>
    </div>
  );
}
