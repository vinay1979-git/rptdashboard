'use client';

import React, { useState, useTransition } from 'react';
import { Mail, Lock, ShieldAlert, Loader2 } from 'lucide-react';
import { login } from './actions';

export default function LoginClient() {
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* Logo/Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="inline-flex p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-100 shadow-sm">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Product Reporting Dashboard
          </h1>
          <p className="text-slate-500 text-xs">Executive Reporting Hub</p>
        </div>

        {/* Login Card */}
        <div className="corporate-card bg-white rounded-xl p-8 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-5 text-center">Sign In</h2>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-700 text-xs px-4 py-3 rounded-lg flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-650 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="email" 
                  name="email"
                  required
                  className="custom-input w-full !pl-10"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-650 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="password" 
                  name="password"
                  required
                  defaultValue="Welcome@123"
                  className="custom-input w-full !pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Default credentials tip */}
            <div className="text-[11px] text-blue-900 leading-normal bg-blue-50 border border-blue-100 p-3 rounded-lg">
              🔑 <strong>Note:</strong> Log in using your registered email and the default password <strong>`Welcome@123`</strong>.
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-900/60 text-white font-bold text-sm rounded-lg transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
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
          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <span className="text-[11px] text-slate-500">
              Password changes and resets are disabled for all accounts.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
