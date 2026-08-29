'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuadraceLogo } from '@/components/Logo';
import { Lock, Mail, ChevronRight, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // If Supabase user does not exist yet in fresh project, provide friendly fallback
        setErrorMsg(error.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        setSuccessMsg('Authenticated successfully! Loading your CRM workspace...');
        localStorage.setItem('quadrace_authenticated', 'true');
        localStorage.setItem('quadrace_user_email', data.user.email || email);
        localStorage.setItem('quadrace_user_id', data.user.id);
        
        setTimeout(() => {
          router.push('/leads');
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign in.');
      setLoading(false);
    }
  };

  // Quick Demo Sign In
  const handleDemoSignIn = async (role: 'owner' | 'sales_rep') => {
    const demoEmail = role === 'owner' ? 'alex.owner@quadrace.pk' : 'agent.sarah@quadrace.pk';
    const demoPass = 'Quadrace2026!';
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setErrorMsg('');

    // Attempt sign in or auto-create demo user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPass,
    });

    if (error) {
      // Auto register demo user if not existing
      const signUpRes = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPass,
        options: {
          data: {
            full_name: role === 'owner' ? 'Alex Rivera (Owner)' : 'Sarah Jenkins (Sales Rep)',
            role: role,
            org_id: 'org-demo-123',
          }
        }
      });
      if (signUpRes.data?.user) {
        localStorage.setItem('quadrace_authenticated', 'true');
        localStorage.setItem('quadrace_user_email', demoEmail);
        router.push('/leads');
        return;
      }
    }

    if (data?.user) {
      localStorage.setItem('quadrace_authenticated', 'true');
      localStorage.setItem('quadrace_user_email', demoEmail);
      router.push('/leads');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <QuadraceLogo />
          </div>
          <h2 className="text-xl font-black text-slate-900">Supabase Multi-User Portal</h2>
          <p className="text-xs text-slate-500 font-medium">Log in to your authenticated cloud workspace on Supabase PostgreSQL.</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Work Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0F2B1D] hover:bg-[#153B27] text-white font-extrabold text-xs rounded-xl shadow-md border border-[#C59B27] flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating with Supabase...' : 'Log In & Access Leads CRM'}
            <ChevronRight className="w-4 h-4 text-[#C59B27]" />
          </button>
        </form>

        {/* Quick Multi-User Test Logins */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">Or Instant Role Login</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn('owner')}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#C59B27]" /> Owner Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('sales_rep')}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Sales Rep Demo
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Need a new team member account?{' '}
          <Link href="/signup" className="font-bold text-[#0F2B1D] hover:underline">
            Create Supabase Account
          </Link>
        </div>

      </div>
    </div>
  );
}
