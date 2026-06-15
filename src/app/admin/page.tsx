'use client';

import React, { useState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Mail,
  User
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { registerUser } from './actions';

interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch all registered users
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email');
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emailInput) return;

    setActionPending(true);
    setMessage(null);

    startTransition(async () => {
      const res = await registerUser(emailInput);
      setActionPending(false);

      if (res && res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else if (res && res.success) {
        setMessage({ text: res.success, type: 'success' });
        setEmailInput('');
        fetchProfiles(); // Refresh user list
      }
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-6 text-slate-200">
      
      {/* Header bar */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Back to Dashboard"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-pink-400 to-sky-400 bg-clip-text text-transparent">
              Admin Control Center
            </h1>
            <p className="text-slate-400 text-xs mt-1">Manage user provisioning and access controls</p>
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-400" />
              Provision New User
            </h2>

            {message && (
              <div className={`mb-5 p-4 rounded-xl border flex items-start gap-2.5 text-xs ${
                message.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="email" 
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="custom-input w-full pl-10"
                    placeholder="colleague@company.com"
                    disabled={actionPending}
                  />
                </div>
              </div>

              {/* Password notice */}
              <div className="text-[11px] text-slate-400 leading-normal bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                🔒 <strong>Password Provisioning:</strong> New accounts are automatically activated with their email pre-confirmed and a temporary password set to <strong>`Welcome@123`</strong>.
              </div>

              <button
                type="submit"
                disabled={actionPending || !emailInput}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:from-indigo-800 disabled:to-pink-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {actionPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Provisioning...
                  </>
                ) : (
                  'Register User'
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Column: User list (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-pink-400" />
              Registered Accounts ({profiles.length})
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <span className="text-xs">Loading accounts...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="py-3 px-4 font-semibold text-slate-400">Email</th>
                      <th className="py-3 px-4 font-semibold text-slate-400">Role</th>
                      <th className="py-3 px-4 font-semibold text-slate-400">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="border-b border-slate-900 hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 text-slate-200 font-medium">{profile.email}</td>
                        <td className="py-3.5 px-4">
                          {profile.is_admin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded-full border border-pink-400/25">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded-full border border-slate-500/20">
                              <Shield className="h-3 w-3" />
                              User
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {profiles.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500">
                          No registered accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
