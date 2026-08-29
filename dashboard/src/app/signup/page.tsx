'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuadraceLogo } from '@/components/Logo';
import { Lock, Mail, Building, ChevronRight, User, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, UserRole } from '@/lib/supabase';

function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Quadrace Pakistan');
  const [role, setRole] = useState<UserRole>('owner');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim() || 'Team Member',
            company_name: companyName.trim(),
            role: role,
            org_id: 'org-demo-123',
          }
        }
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to create account.');
        setLoading(false);
        return;
      }

      if (data?.user) {
        setSuccessMsg('Account created successfully in Supabase! Redirecting to Leads CRM...');
        localStorage.setItem('quadrace_authenticated', 'true');
        localStorage.setItem('quadrace_user_email', data.user.email || email);
        localStorage.setItem('quadrace_user_id', data.user.id);
        localStorage.setItem('quadrace_user_role', role);
        localStorage.setItem('quadrace_user_name', fullName);

        setTimeout(() => {
          router.push('/leads');
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign up.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
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

      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Your Full Name</label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Alex Rivera"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Company / Workspace Name</label>
        <div className="relative">
          <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Quadrace Pakistan"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Select Your Team Role</label>
        <div className="relative">
          <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D] font-bold"
          >
            <option value="owner">Workspace Owner (Full Admin & Billing)</option>
            <option value="admin">Operations Admin</option>
            <option value="sales_rep">Sales Representative / Closer</option>
            <option value="agent">Support & Pipeline Agent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Work Email Address</label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@quadrace.pk"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Password</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#0F2B1D] hover:bg-[#153B27] text-white font-extrabold text-xs rounded-xl shadow-md border border-[#C59B27] flex items-center justify-center gap-2 transition disabled:opacity-50"
      >
        {loading ? 'Creating Supabase Account...' : 'Register & Launch Workspace'}
        <ChevronRight className="w-4 h-4 text-[#C59B27]" />
      </button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <QuadraceLogo />
          </div>
          <h2 className="text-xl font-black text-slate-900">Create Multi-User Account</h2>
          <p className="text-xs text-slate-500 font-medium">Join your team's live Supabase PostgreSQL CRM.</p>
        </div>

        <Suspense fallback={<div className="text-xs text-center py-4">Loading form...</div>}>
          <SignupForm />
        </Suspense>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#0F2B1D] hover:underline">
            Log In to Workspace
          </Link>
        </div>

      </div>
    </div>
  );
}
