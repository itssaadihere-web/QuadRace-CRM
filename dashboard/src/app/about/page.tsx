'use client';

import Link from 'next/link';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Bot, 
  Database, 
  CheckCircle2, 
  ArrowRight,
  Globe,
  Lock,
  Cpu,
  Users
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-16">
      
      {/* Page Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF8EC] border border-[#C59B27]/40 text-[#B8860B] text-xs font-bold uppercase">
          <Building2 className="w-3.5 h-3.5 text-[#C59B27]" /> About Quadrace CRM & Solomon AI
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Empowering Businesses with Autonomous AI Conversations
        </h1>
        <p className="text-sm text-slate-600 font-medium leading-relaxed">
          Quadrace CRM was engineered to bridge the gap between AI automation and human customer support, providing multi-tenant SaaS architecture for modern businesses worldwide.
        </p>
      </div>

      {/* Core Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0F2B1D] text-[#C59B27] flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Our Core Mission</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            We believe customer support should never be frustrating or delayed. Our mission is to empower business owners with Solomon AI — an intelligent assistant that knows your website, products, and policies inside out, resolving 80%+ of customer inquiries instantly.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF8EC] text-[#B8860B] border border-[#C59B27]/40 flex items-center justify-center font-bold">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">The Technology Stack</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Built on Next.js 14, Node.js Express, Socket.io real-time engine, PostgreSQL pgvector, and Anthropic Claude 3.5 Sonnet RAG retrieval. Accompanied by a lightweight Shadow DOM Web SDK and React Native Expo mobile apps.
          </p>
        </div>
      </div>

      {/* Architecture Highlights */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white space-y-8 border-2 border-[#C59B27]">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#C59B27] uppercase tracking-wider">Enterprise Foundations</span>
          <h2 className="text-2xl md:text-3xl font-extrabold">Built for Scalability, Privacy & Speed</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-5 bg-white/10 rounded-2xl border border-white/10 space-y-2">
            <ShieldCheck className="w-6 h-6 text-[#C59B27]" />
            <h4 className="font-bold text-sm text-white">Multi-Tenant Isolation</h4>
            <p className="text-slate-300 leading-relaxed">
              Strict organization data boundaries ensure your vector embeddings, customer chats, and catalog data are completely isolated and encrypted.
            </p>
          </div>

          <div className="p-5 bg-white/10 rounded-2xl border border-white/10 space-y-2">
            <Database className="w-6 h-6 text-[#C59B27]" />
            <h4 className="font-bold text-sm text-white">RAG Vector Knowledge</h4>
            <p className="text-slate-300 leading-relaxed">
              PostgreSQL + pgvector indexes your shipping rules, return policies, and product details into 1536-dimensional vector space for high-precision retrieval.
            </p>
          </div>

          <div className="p-5 bg-white/10 rounded-2xl border border-white/10 space-y-2">
            <Lock className="w-6 h-6 text-[#C59B27]" />
            <h4 className="font-bold text-sm text-white">Shadow DOM Isolation</h4>
            <p className="text-slate-300 leading-relaxed">
              Our embeddable chat SDK uses ShadowRoot encapsulation, guaranteeing that host website CSS will never distort your customer chat experience.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-extrabold text-slate-900">Experience Quadrace CRM Today</h3>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-[#0F2B1D] hover:bg-[#153B27] text-white font-extrabold text-xs rounded-xl shadow-md border border-[#C59B27] flex items-center gap-2"
          >
            Create Your Account <ArrowRight className="w-4 h-4 text-[#C59B27]" />
          </Link>
        </div>
      </div>

    </div>
  );
}
