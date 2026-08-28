'use client';

import Link from 'next/link';
import { CheckCircle2, CreditCard, Sparkles, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12">
      
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF8EC] border border-[#C59B27]/40 text-[#B8860B] text-xs font-bold uppercase">
          <CreditCard className="w-3.5 h-3.5 text-[#C59B27]" /> Transparent Pricing Plans
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Flexible Pricing Tailored for Your Growth Stage
        </h1>
        <p className="text-sm text-slate-600 font-medium">
          All plans include full access to Solomon AI, Knowledge Base RAG Ingestion, and the React Native Mobile App.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { name: 'Free', price: '$0/mo', chats: '50 AI chats / mo', seats: '2 Agent Seats', cta: 'Start Free' },
          { name: 'Starter', price: '$12/mo', chats: '100 AI chats / mo', seats: '5 Agent Seats', cta: 'Select Starter' },
          { name: 'Growth', price: '$25/mo', chats: '500 AI chats / mo', seats: '15 Agent Seats', popular: true, cta: 'Start Growth Trial' },
          { name: 'Plus', price: '$200/mo', chats: '10,000 AI chats / mo', seats: 'Unlimited Seats', cta: 'Select Enterprise Plus' }
        ].map((plan, idx) => (
          <div key={idx} className={`bg-white rounded-3xl p-6 border flex flex-col justify-between transition relative ${
            plan.popular ? 'border-2 border-[#C59B27] shadow-xl scale-105' : 'border-slate-200 shadow-xs'
          }`}>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#C59B27] text-[#0F2B1D] text-[10px] font-extrabold uppercase rounded-full">
                Most Popular
              </span>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                <div className="text-3xl font-black text-[#0F2B1D] mt-1">{plan.price}</div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {plan.chats}</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {plan.seats}</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Solomon AI Engine</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> React Native Mobile App</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Web Widget Shadow DOM</div>
              </div>
            </div>

            <Link
              href={`/signup?plan=${plan.name.toLowerCase()}`}
              className={`w-full mt-6 py-3 rounded-xl text-xs font-extrabold text-center transition block ${
                plan.popular 
                  ? 'bg-[#0F2B1D] text-white hover:bg-[#153B27] shadow-md border border-[#C59B27]'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

    </div>
  );
}
