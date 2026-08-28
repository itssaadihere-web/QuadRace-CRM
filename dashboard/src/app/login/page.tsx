'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QuadraceLogo } from '@/components/Logo';
import { Lock, Mail, ChevronRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('alex@aurafashion.com');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      localStorage.setItem('quadrace_authenticated', 'true');
      localStorage.setItem('quadrace_user_email', email);
      router.push('/inbox');
    }, 600);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <QuadraceLogo />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Log In to Workspace Portal</h2>
          <p className="text-xs text-slate-500 font-medium">Enter your credentials to access live omnichannel dashboard & Solomon AI.</p>
        </div>

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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0F2B1D] hover:bg-[#153B27] text-white font-extrabold text-xs rounded-xl shadow-md border border-[#C59B27] flex items-center justify-center gap-2 transition"
          >
            {loading ? 'Authenticating Workspace...' : 'Log In & Open Dashboard'}
            <ChevronRight className="w-4 h-4 text-[#C59B27]" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Don't have a workspace account yet?{' '}
          <Link href="/signup" className="font-bold text-[#0F2B1D] hover:underline">
            Sign Up & Select Plan
          </Link>
        </div>

      </div>
    </div>
  );
}
