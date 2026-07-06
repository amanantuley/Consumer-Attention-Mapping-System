'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore, User as UserType } from '@/store/authStore';
import { 
  Settings, Users, ShieldAlert, History, Shield, 
  Trash2, UserPlus, ToggleLeft, ToggleRight, CheckCircle
} from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  target_table: string;
  target_id: number;
  timestamp: string;
  ip_address: string;
}

export default function AdminPage() {
  const { accessToken, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // New user registration form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState('retail_analyst');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/users', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Failed to load user records", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = () => {
    // Return sample audit log tracking coordinate events
    const sampleLogs: AuditLog[] = [
      { id: 1, user_id: 1, action: 'User login success', target_table: 'users', target_id: 1, timestamp: new Date(Date.now() - 50000).toISOString(), ip_address: '127.0.0.1' },
      { id: 2, user_id: 1, action: 'Updated planogram layout', target_table: 'shelves', target_id: 3, timestamp: new Date(Date.now() - 120000).toISOString(), ip_address: '127.0.0.1' },
      { id: 3, user_id: 1, action: 'Triggered camera stream ping', target_table: 'cameras', target_id: 1, timestamp: new Date(Date.now() - 300000).toISOString(), ip_address: '192.168.1.1' }
    ];
    setAuditLogs(sampleLogs);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          full_name: regFullName,
          role: regRole
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create user profile');
      }

      setStatusMsg('New user registered successfully!');
      setRegEmail('');
      setRegPassword('');
      setRegFullName('');
      fetchUsers();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" /> Admin Panel
        </h1>
        <p className="text-zinc-400 text-sm">
          Register new retail staff roles, manage system accounts, and audit core application telemetry logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Management Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-400" /> System Accounts
            </h3>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-zinc-600">Retrieving user roster...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-zinc-500 font-semibold">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Clearance Role</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={idx} className="border-b border-zinc-900/60 text-zinc-300">
                        <td className="py-3.5 font-bold text-white">{u.full_name}</td>
                        <td className="py-3.5 font-mono">{u.email}</td>
                        <td className="py-3.5">
                          <span className="bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded-md text-emerald-400 font-semibold capitalize">
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
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

        {/* Register User Form Panel */}
        <div className="space-y-6">
          
          {/* User Registration Form */}
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-emerald-400" /> Create Account
            </h3>

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-2">Full Name</label>
                <input 
                  type="text" required value={regFullName} onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  placeholder="Retail Analyst 1"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-2">Email Address</label>
                <input 
                  type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  placeholder="analyst1@cams.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-2">Access Password</label>
                <input 
                  type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase mb-2">Clearance Authorization</label>
                <select 
                  value={regRole} onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="administrator">Administrator</option>
                  <option value="store_manager">Store Manager</option>
                  <option value="retail_analyst">Retail Analyst</option>
                  <option value="marketing_manager">Marketing Manager</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl shadow-lg transition-all cursor-pointer text-xs"
              >
                Create Staff Account
              </button>
            </form>

            {statusMsg && (
              <div className="mt-4 p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl font-mono text-[10px] text-zinc-400">
                {statusMsg}
              </div>
            )}
          </div>

          {/* Audit Logs Terminal */}
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-emerald-400" /> System Audit Logs
            </h3>
            
            <div className="space-y-3 font-mono text-[10px] text-zinc-400">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-zinc-950/80 border border-zinc-900 rounded-xl">
                  <div className="flex justify-between text-zinc-500 mb-1">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span>{log.ip_address}</span>
                  </div>
                  <div className="text-white font-semibold">{log.action}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
