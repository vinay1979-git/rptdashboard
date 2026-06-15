'use client';

import React, { useState, useTransition } from 'react';
import { Mail, Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { login } from './actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await login(formData);
      if (result && result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#090d16]">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-900/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-3 shadow-lg">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-pink-400 to-sky-400 bg-clip-text text-transparent">
            rptdashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Executive Reporting Hub</p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 border border-slate-800/80">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In</h2>

          {error && (
            <div className="mb-6 bg-rose-500/15 border border-rose-500/20 text-rose-300 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="email" 
                  name="email"
                  required
                  className="custom-input w-full pl-10"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="password" 
                  name="password"
                  required
                  defaultValue="Welcome@123"
                  className="custom-input w-full pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Default credentials tip */}
            <div className="text-[11px] text-indigo-400/90 leading-normal bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-lg">
              🔑 <strong>Note:</strong> Log in using your registered email and the default password <strong>`Welcome@123`</strong>.
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:from-indigo-800 disabled:to-pink-800 text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Reset disabled message */}
          <div className="mt-6 text-center">
            <span className="text-xs text-slate-500">
              Password changes and resets are disabled for all accounts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
