'use client';

import Link from 'next/link';
import { 
  Bot, 
  ShoppingBag, 
  Building2, 
  MapPin, 
  Smartphone, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Layers,
  HelpCircle,
  Code2,
  Zap
} from 'lucide-react';

export default function SolutionsPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-16">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF8EC] border border-[#C59B27]/40 text-[#B8860B] text-xs font-bold uppercase">
          <Bot className="w-3.5 h-3.5 text-[#C59B27]" /> Solutions & Solomon AI Overview
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Tailored AI Workflows for Every Industry Vertical
        </h1>
        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          From e-commerce stores seeking higher sales conversions to B2B teams capturing high-intent leads, Quadrace CRM adapts to your business needs.
        </p>
      </div>

      {/* 1. VERTICAL SOLUTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'E-Commerce Growth',
            icon: ShoppingBag,
            desc: 'Boost conversion rates with AI product recommendations and instant order tracking timeline cards inside live chat.',
            features: [
              'Shopify & WooCommerce catalog sync',
              'FedEx / UPS / DHL order status cards',
              'Abandoned cart recovery prompts',
              'AI discount code distribution'
            ]
          },
          {
            title: 'B2B Lead Generation',
            icon: Building2,
            desc: 'Qualify inbound website traffic, capture business leads, and route high-value prospects directly to sales reps.',
            features: [
              'Automated contact capture forms',
              'HubSpot / Salesforce CRM sync',
              'Meeting scheduler integration',
              'Custom qualification scoring'
            ]
          },
          {
            title: 'Local Services & FAQ',
            icon: MapPin,
            desc: 'Answer location, pricing, and operating hours questions 24/7 with zero human delay.',
            features: [
              'Store hours & map directions RAG',
              'Service appointment booking',
              'Support ticket auto-creation',
              'Multilingual support engine'
            ]
          }
        ].map((vert, idx) => {
          const Icon = vert.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-[#0F2B1D] transition">
              <div className="w-10 h-10 rounded-2xl bg-[#0F2B1D] text-[#C59B27] flex items-center justify-center font-bold">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{vert.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{vert.desc}</p>
              
              <div className="pt-2 space-y-2 border-t border-slate-100 text-xs text-slate-700">
                {vert.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. SOLOMON AI DEEP DIVE */}
      <div className="bg-gradient-to-br from-[#0F2B1D] to-[#153B27] rounded-3xl p-8 md:p-12 text-white border-2 border-[#C59B27] shadow-xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C59B27] text-[#0F2B1D] flex items-center justify-center font-black text-lg">SAI</div>
          <div>
            <h2 className="text-2xl font-bold">Solomon AI Engine & Copilot Modes</h2>
            <p className="text-xs text-[#E6C280] font-semibold">Autonomous RAG & Human-in-the-Loop Collaboration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-6 bg-white/10 rounded-2xl border border-white/15 space-y-3">
            <h4 className="font-bold text-sm text-[#C59B27]">🤖 Automated AI Mode</h4>
            <p className="text-slate-200 leading-relaxed">
              Solomon AI handles customer questions autonomously, retrieving answers from your knowledge base with Claude 3.5 Sonnet and executing tool calls for order tracking and recommendations.
            </p>
          </div>

          <div className="p-6 bg-white/10 rounded-2xl border border-white/15 space-y-3">
            <h4 className="font-bold text-sm text-[#C59B27]">✍️ Copilot Approval Mode</h4>
            <p className="text-slate-200 leading-relaxed">
              Solomon AI drafts recommended responses in real time. Human support agents can review, edit, or send the AI draft with a single click before the visitor sees it.
            </p>
          </div>
        </div>
      </div>

      {/* 3. MOBILE APP HIGHLIGHT */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5" /> Mobile App Included
          </div>
          <h3 className="text-2xl font-bold text-slate-900">React Native Expo App for iOS & Android</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Manage your inbox on the go. Get push notifications when a customer needs help, review AI drafts from your phone, and take over chats effortlessly.
          </p>
        </div>

        <Link
          href="/signup"
          className="px-6 py-3 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-extrabold shadow-md border border-[#C59B27] flex items-center gap-2 shrink-0"
        >
          Get Started Now <ArrowRight className="w-4 h-4 text-[#C59B27]" />
        </Link>
      </div>

    </div>
  );
}
