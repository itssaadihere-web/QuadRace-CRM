'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QuadraceLogo } from '@/components/Logo';
import { Lock, Mail, Building, ChevronRight } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [companyName, setCompanyName] = useState<string>('Quadrace Pakistan');
  const [email, setEmail] = useState<string>('alex@quadrace.pk');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [selectedPlan, setSelectedPlan] = useState<string>('growth');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      setSelectedPlan(planParam);
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`${API_BASE}/api/onboarding/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({
          company_name: companyName,
          plan_tier: selectedPlan
        })
      });
    } catch (err) {
      console.error(err);
    }

    localStorage.setItem('quadrace_authenticated', 'true');
    localStorage.setItem('quadrace_org_name', companyName);
    localStorage.setItem('quadrace_user_email', email);
    localStorage.setItem('quadrace_show_onboarding_popup', 'true');

    setTimeout(() => {
      router.push('/inbox');
    }, 600);
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-1">Company / Business Name</label>
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
          />
        </div>
      </div>

      {/* Plan Selection Grid */}
      <div>
        <label className="text-xs font-bold text-slate-800 block mb-2">Select Your Subscription Plan</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'free', name: 'Free', price: '$0/mo' },
            { id: 'starter', name: 'Starter', price: '$12/mo' },
            { id: 'growth', name: 'Growth', price: '$25/mo' },
            { id: 'plus', name: 'Plus', price: '$200/mo' }
          ].map((p) => {
            const isSelected = selectedPlan === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                  isSelected
                    ? 'bg-[#0F2B1D] text-white border-[#C59B27] shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold">{p.name}</div>
                <div className={`text-[10px] font-medium ${isSelected ? 'text-[#E6C280]' : 'text-slate-500'}`}>{p.price}</div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#0F2B1D] hover:bg-[#153B27] text-white font-extrabold text-xs rounded-xl shadow-md border border-[#C59B27] flex items-center justify-center gap-2 transition mt-2"
      >
        {loading ? 'Creating Workspace...' : `Create Workspace on ${selectedPlan.toUpperCase()} Plan`}
        <ChevronRight className="w-4 h-4 text-[#C59B27]" />
      </button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <QuadraceLogo />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Create Your Workspace</h2>
          <p className="text-xs text-slate-500 font-medium">Set up your business organization and select your Solomon AI subscription plan.</p>
        </div>

        <Suspense fallback={<div className="text-xs text-center text-slate-400">Loading signup portal...</div>}>
          <SignupForm />
        </Suspense>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already have an active workspace?{' '}
          <Link href="/login" className="font-bold text-[#0F2B1D] hover:underline">
            Log In
          </Link>
        </div>

      </div>
    </div>
  );
}
