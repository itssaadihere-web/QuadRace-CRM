'use client';

import Link from 'next/link';
import { 
  MessageSquare, 
  Globe, 
  Code2, 
  Layers, 
  Zap, 
  Database, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function IntegrationsPage() {
  const integrationsList = [
    {
      title: 'WhatsApp Business API',
      category: 'Omnichannel Channel',
      icon: MessageSquare,
      desc: 'Official WhatsApp BSP integration. Send automated order status alerts, interactive button menus, and human agent takeover threads.'
    },
    {
      title: 'Instagram Direct & Comments',
      category: 'Social Commerce',
      icon: Globe,
      desc: 'Connect your Instagram Business account to receive DMs, auto-reply to product story mentions, and manage comment inquiries.'
    },
    {
      title: 'Vite Shadow DOM Web Widget',
      category: 'Web SDK',
      icon: Code2,
      desc: 'Lightweight JavaScript SDK (<25KB gzipped). ShadowRoot encapsulation ensures host site CSS styling never alters widget layout.'
    },
    {
      title: 'Shopify Store Connector',
      category: 'E-Commerce Platform',
      icon: Layers,
      desc: 'Instant 1-click sync for Shopify product catalogs, customer order tracking, discount codes, and abandoned cart recovery.'
    },
    {
      title: 'WooCommerce Plugin',
      category: 'E-Commerce Platform',
      icon: Layers,
      desc: 'REST API integration for WordPress & WooCommerce. Sync inventory levels and order fulfillment timelines directly into chat.'
    },
    {
      title: 'Omnichannel Email Desk',
      category: 'Support Desk',
      icon: MessageSquare,
      desc: 'Convert support emails into live omnichannel inbox tickets. Solomon AI drafts email responses for 1-click agent dispatch.'
    },
    {
      title: 'Zapier & Webhooks',
      category: 'Automation Engine',
      icon: Zap,
      desc: 'Connect with HubSpot, Salesforce, Slack, and Google Sheets using real-time HTTP POST JSON webhook events.'
    },
    {
      title: 'pgvector Multi-Tenant Storage',
      category: 'Vector Database',
      icon: Database,
      desc: 'PostgreSQL + pgvector multi-tenant database isolation. Guarantees your knowledge embeddings are secure and private.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF8EC] border border-[#C59B27]/40 text-[#B8860B] text-xs font-bold uppercase">
          <Layers className="w-3.5 h-3.5 text-[#C59B27]" /> Omnichannel Integration Ecosystem
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Connect Your Channels & Tools Seamlessly
        </h1>
        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          Quadrace CRM centralizes customer communications from WhatsApp, Instagram, Email, and Web Chat into one collaborative workspace.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrationsList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-[#0F2B1D] transition space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#0F2B1D] text-[#C59B27] flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider border border-slate-200">
                  {item.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-[#0F2B1D] text-white rounded-3xl p-8 text-center space-y-4 border-2 border-[#C59B27]">
        <h3 className="text-xl font-bold">Need a Custom Integration for Your Enterprise?</h3>
        <p className="text-xs text-slate-300 max-w-lg mx-auto font-medium">
          Our REST APIs and Socket.io WebSocket engine support custom ERP, CRM, and custom store builds.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#C59B27] text-[#0F2B1D] font-extrabold text-xs rounded-xl shadow-lg transition"
        >
          Start Free Integration Trial <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
