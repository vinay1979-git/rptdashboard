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
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-[#F9FAFC] text-[#030522]">
      <div className="w-full max-w-md">
        
        {/* Login Card */}
        <div className="bg-white border border-[#E6E9EF] shadow-sm rounded-lg p-8 w-full">
          <div className="flex flex-col items-center gap-3 mb-6">
            <img src="https://lentra.ai/favicon.ico" alt="Lentra" className="h-10 w-auto" />
            <h2 className="text-xl font-semibold text-[#030522] text-center">Sign in to Lentra Reports</h2>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-700 text-xs px-4 py-3 rounded-lg flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="email" 
                  name="email"
                  required
                  className="w-full pl-10 pr-3 py-2 bg-white border border-[#E6E9EF] text-[#030522] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B42C4] focus:border-[#3B42C4] text-sm transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="password" 
                  name="password"
                  required
                  defaultValue="Welcome@123"
                  className="w-full pl-10 pr-3 py-2 bg-white border border-[#E6E9EF] text-[#030522] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3B42C4] focus:border-[#3B42C4] text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Default credentials tip */}
            <div className="text-[11px] text-[#3B42C4] leading-normal bg-[#3B42C4]/5 border border-[#3B42C4]/10 p-3 rounded-lg">
              🔑 <strong>Note:</strong> Log in using your registered email and the default password <strong>`Welcome@123`</strong>.
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#3B42C4] hover:bg-[#3137A3] disabled:bg-[#3B42C4]/60 text-white font-medium rounded-md transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed text-sm"
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
