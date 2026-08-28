'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, Zap, Sparkles, RefreshCw } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function BillingPage() {
  const [usage, setUsage] = useState<any>(null);
  const [inactivityMsg, setInactivityMsg] = useState<string>('');

  const fetchUsage = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/billing/usage?org_id=org-demo-123`);
      const data = await res.json();
      if (data.success) {
        setUsage(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerInactivityCheck = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/billing/check-inactivity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' }
      });
      const data = await res.json();
      if (data.success) {
        setInactivityMsg(data.message);
        setTimeout(() => setInactivityMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0F2B1D]" /> Pricing, Quota & Billing Engine
          </h1>
          <p className="text-xs text-slate-500 font-medium">Hard programmatic locks, multi-tier plans, and visitor 15-minute inactivity session management.</p>
        </div>
        
        <button
          onClick={triggerInactivityCheck}
          className="px-3.5 py-2 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#C59B27]" /> Run 15-Min Inactivity Reset Worker
        </button>
      </div>

      {inactivityMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
          <Zap className="w-4 h-4 text-emerald-600" /> {inactivityMsg}
        </div>
      )}

      {usage && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Organization Plan</span>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                Growth Tier ($25/mo) <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">Active</span>
              </h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-[#0F2B1D]">{usage.used_chats} / {usage.limit_chats}</div>
              <div className="text-xs text-slate-500 font-medium">Monthly Solomon AI Chats</div>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-[#0F2B1D] to-[#C59B27] rounded-full transition-all duration-500" 
              style={{ width: `${usage.usage_percentage}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 font-medium">
            <span>Programmatic Lock Status: <strong className="text-emerald-700">Unlocked & Operational</strong></span>
            <span>15-Min Visitor Idle Reset: <strong className="text-[#0F2B1D]">Active</strong></span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            name: 'Free Tier',
            price: '$0',
            period: '/mo',
            chats: '50 Solomon AI Chats',
            seats: '2 Agent Seats',
            features: ['50 total billable conversations', 'Basic Web Widget', 'Community Support'],
            button: 'Current Free Tier',
            active: false
          },
          {
            name: 'Starter Tier',
            price: '$12',
            period: '/mo ($10 annual)',
            chats: '100 Solomon AI Chats',
            seats: '5 Agent Seats',
            features: ['100 billable conversations', 'Basic Analytics', 'Email Support'],
            button: 'Upgrade to Starter',
            active: false
          },
          {
            name: 'Growth Tier',
            price: '$25',
            period: '/mo ($20 annual)',
            chats: '500 Solomon AI Chats',
            seats: '15 Agent Seats',
            features: ['Shopify/E-Comm Actions', 'Live Typing Previews', 'White-label Add-on ($9/mo)'],
            button: 'Current Active Plan',
            active: true
          },
          {
            name: 'Plus Tier',
            price: '$200',
            period: '/mo',
            chats: '10,000 AI Chats',
            seats: '99 Agent Seats',
            features: ['Custom OpenAPI', 'Dedicated Account Manager', 'Multi-Brand Routing'],
            button: 'Upgrade to Plus',
            active: false
          }
        ].map((tier, idx) => (
          <div 
            key={idx} 
            className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
              tier.active
                ? 'bg-[#FDF8EC] border-[#C59B27] shadow-md shadow-[#C59B27]/10'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">{tier.name}</span>
                {tier.active && <span className="text-[10px] px-2 py-0.5 bg-[#0F2B1D] text-[#D4AF37] font-extrabold rounded-full">ACTIVE</span>}
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-0.5">{tier.price} <span className="text-xs text-slate-500 font-normal">{tier.period}</span></div>
              <div className="text-xs font-bold text-[#0F2B1D] mb-4">{tier.chats}</div>

              <ul className="space-y-2 text-xs text-slate-600 mb-6 font-medium">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button className={`w-full py-2 rounded-xl text-xs font-bold transition ${
              tier.active
                ? 'bg-slate-200 text-slate-700 cursor-default'
                : 'bg-[#0F2B1D] hover:bg-[#153B27] text-white shadow-xs'
            }`}>
              {tier.button}
            </button>
          </div>
        ))}
      </div>

      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C59B27]" /> Standalone Solomon AI Chat Add-Ons
        </h2>

        <div className="grid grid-cols-4 gap-4">
          {[
            { chats: '50 AI Chats/mo', price: '$15/mo' },
            { chats: '100 AI Chats/mo', price: '$25/mo' },
            { chats: '500 AI Chats/mo', price: '$50/mo' },
            { chats: '1,000 AI Chats/mo', price: '$100/mo' }
          ].map((addon, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">{addon.chats}</div>
                <div className="text-xs font-extrabold text-[#0F2B1D]">{addon.price}</div>
              </div>
              <button className="px-3 py-1.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-lg text-[11px] font-bold transition">
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
