'use client';

import Link from 'next/link';
import { 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight, 
  Bot, 
  Globe, 
  Layers, 
  TrendingUp, 
  HelpCircle,
  Database,
  Lock,
  Code2,
  Check,
  Star,
  Activity,
  Bell
} from 'lucide-react';

export default function MarketingHomePage() {
  return (
    <div className="space-y-28 py-6">
      
      {/* 1. HERO SECTION WITH GLOWING ACCENTS & LIVE PREVIEW */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-4 text-center space-y-8">
        
        {/* Soft Background Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#0F2B1D]/10 via-[#C59B27]/15 to-transparent blur-3xl -z-10 rounded-full pointer-events-none"></div>

        {/* Hero Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDF8EC] border border-[#C59B27]/40 text-[#B8860B] text-xs font-extrabold tracking-wide uppercase shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Sparkles className="w-4 h-4 text-[#C59B27]" /> Autonomous AI & Omnichannel Growth Platform
        </div>

        {/* Hero Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight max-w-5xl mx-auto">
          Scale Customer Service into <span className="text-[#0F2B1D] bg-gradient-to-r from-[#0F2B1D] via-[#153B27] to-[#0F2B1D] bg-clip-text text-transparent">Revenue Growth</span> with Solomon AI
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
          Unify WhatsApp, Instagram, Email, and Web Chat into one collaborative omnichannel workspace powered by RAG vector memory and cross-platform mobile apps.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/signup"
            className="px-8 py-4 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-[#0F2B1D]/25 flex items-center gap-2.5 transition transform hover:-translate-y-0.5 border border-[#C59B27]"
          >
            Start Free 14-Day Trial <ArrowRight className="w-4 h-4 text-[#C59B27]" />
          </Link>
          
          <Link
            href="/solutions"
            className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl text-sm font-bold border border-slate-200 shadow-sm flex items-center gap-2 transition transform hover:-translate-y-0.5"
          >
            Explore Solomon AI & Mobile App
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-600 font-bold">
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" /> No Credit Card Required</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" /> 1-Line HTML Embed Widget (&lt;25KB)</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" /> React Native Expo Mobile App</span>
        </div>

        {/* HERO INTERACTIVE PRODUCT MOCKUP BOARD */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl p-4 md:p-6 border-2 border-slate-200 shadow-2xl shadow-slate-900/10 space-y-4">
            
            {/* Header bar of board */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="text-xs font-bold text-slate-600 ml-2 font-mono">http://localhost:3000/inbox — Quadrace Live Portal</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Live Socket Sync
                </span>
              </div>
            </div>

            {/* Simulated Live Inbox Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              
              {/* Active Conversation Sidebar Mock */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 hidden md:block">
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">Active Visitor Chats</div>
                
                <div className="p-3 bg-white rounded-xl border border-[#0F2B1D] shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>Elena Rostova</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold">● AI Active</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">Where is my order #AUR-94021?</div>
                </div>

                <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Tariq Mansoor</span>
                    <span className="text-[10px] text-amber-600 font-bold">Copilot Draft</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">Do you ship express to Lahore?</div>
                </div>
              </div>

              {/* Chat Session Window Mock */}
              <div className="md:col-span-2 bg-[#F8FAF8] p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0F2B1D] text-[#C59B27] flex items-center justify-center text-[10px] font-bold">ER</div>
                    <div>
                      <div className="text-slate-900">Elena Rostova</div>
                      <div className="text-[10px] text-slate-500 font-normal">Channel: Web Widget | Org: Quadrace Pakistan</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-[#FDF8EC] text-[#B8860B] border border-[#C59B27]/40 text-[10px] font-extrabold">
                    Solomon AI Handled
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-200/80 rounded-2xl rounded-tr-none text-slate-900 max-w-[80%] ml-auto">
                    Hi! Where is my order #AUR-94021?
                  </div>

                  <div className="p-3.5 bg-[#0F2B1D] text-white rounded-2xl rounded-tl-none max-w-[85%] space-y-2 border border-[#C59B27]">
                    <div className="font-medium text-slate-100">I looked up order #AUR-94021! Here is your live tracking timeline:</div>
                    
                    <div className="bg-white text-slate-900 p-3 rounded-xl space-y-1 font-sans shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-700 font-bold text-[11px]">● In Transit (FedEx Express)</span>
                        <span className="text-[10px] font-bold text-slate-500">FX-982310492</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">Organic Cotton Streetwear Hoodie (Black / Medium)</div>
                      <div className="text-[11px] text-slate-600">Est. Delivery: <strong>Tomorrow by 4:00 PM</strong></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 2. SOLOMON AI DEEP SHOWCASE */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-[#0F2B1D] via-[#153B27] to-[#0F2B1D] rounded-3xl p-8 md:p-14 text-white border-2 border-[#C59B27] shadow-2xl relative overflow-hidden">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C59B27]/20 border border-[#C59B27] text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                <Bot className="w-4 h-4" /> Next-Gen AI Customer Growth Agent
              </div>

              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                Meet Solomon AI — Your Autonomous RAG Customer Service Agent
              </h2>

              <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
                Solomon AI reads your website, shipping policies, and product catalog using Claude 3.5 Sonnet RAG context. It automatically answers customer questions, checks live order statuses, and recommends products right inside the chat window.
              </p>

              <div className="space-y-3 text-xs text-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#C59B27] text-[#0F2B1D] font-bold flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span><strong>Copilot Mode Toggle:</strong> Choose between automated AI responses or agent approval mode.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#C59B27] text-[#0F2B1D] font-bold flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span><strong>1-Click Gap Approval:</strong> Log low-confidence customer questions and inject answers into RAG memory with one click.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#C59B27] text-[#0F2B1D] font-bold flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span><strong>Interactive E-Commerce Cards:</strong> Renders live FedEx tracking timelines and product recommendation carousels.</span>
                </div>
              </div>

              <Link
                href="/solutions"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#C59B27] hover:bg-[#D4AF37] text-[#0F2B1D] font-extrabold rounded-xl text-xs shadow-lg transition transform hover:scale-105"
              >
                Explore Solomon AI Capabilities <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Interactive Feature Board */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 space-y-4">
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold text-white">Solomon RAG Vector Engine</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#C59B27] text-[#0F2B1D] font-extrabold">1536 Vector Dims</span>
              </div>

              <div className="space-y-3 text-xs text-slate-200">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                  <div className="text-[#D4AF37] font-bold">1. Sitemap XML Crawler</div>
                  <div className="text-[11px] text-slate-300">Auto-fetches all sub-pages (/shipping, /faq, /returns) into pgvector memory.</div>
                </div>

                <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                  <div className="text-[#D4AF37] font-bold">2. Persistent Disk Memory</div>
                  <div className="text-[11px] text-slate-300">100% of your knowledge chunks and intent rules are saved permanently across server restarts.</div>
                </div>

                <div className="p-3 bg-white/10 rounded-xl border border-white/10 space-y-1">
                  <div className="text-[#D4AF37] font-bold">3. Shadow DOM Web Widget</div>
                  <div className="text-[11px] text-slate-300">Lightweight JS SDK (&lt;25KB gzipped) isolated inside ShadowRoot.</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CROSS-PLATFORM MOBILE APP SECTION */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Simulated Mobile Device Display */}
          <div className="order-2 md:order-1 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#0F2B1D]" />
                <span className="text-xs font-bold text-slate-900">React Native Expo Mobile App</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">SDK 51+</span>
            </div>

            {/* Mobile Push Notification Banner */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-[#C59B27] shadow-lg">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#E6C280] flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#C59B27] animate-bounce" /> New Chat Alert
                </span>
                <span className="text-slate-400">Just now</span>
              </div>
              <div className="text-xs font-bold">Elena Rostova on Web Chat</div>
              <p className="text-[11px] text-slate-300">"Where is my order #AUR-94021?"</p>
              <div className="pt-1 flex gap-2">
                <button className="px-3 py-1 bg-[#C59B27] text-[#0F2B1D] font-extrabold text-[10px] rounded-lg">1-Tap Takeover</button>
                <button className="px-3 py-1 bg-white/10 text-white text-[10px] rounded-lg">Approve AI Draft</button>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Real-time push notifications for new incoming chats</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> 1-tap human agent takeover protocol from mobile devices</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Offline message queuing & local storage sync</li>
            </ul>
          </div>

          <div className="order-1 md:order-2 space-y-5">
            <span className="text-xs font-bold text-[#C59B27] uppercase tracking-wider">Mobile-First Support Team</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              Manage Support Chats On The Go — Anywhere, Anytime
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Whether you are at your desk or travelling, Quadrace CRM ensures your support team never misses an opportunity to engage customers and close sales.
            </p>
            <div className="pt-2">
              <Link
                href="/solutions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F2B1D] hover:bg-[#153B27] text-white font-extrabold rounded-xl text-xs shadow-md border border-[#C59B27] transition"
              >
                Learn About Mobile App <ArrowRight className="w-4 h-4 text-[#C59B27]" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 4. OMNICHANNEL INTEGRATIONS GRID */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#C59B27] uppercase tracking-wider">Unified Communication</span>
          <h2 className="text-3xl font-extrabold text-slate-900">Connect All Your Channels in Minutes</h2>
          <p className="text-xs text-slate-500 font-medium max-w-xl mx-auto">
            Quadrace CRM integrates with your existing channels so all customer conversations flow into one centralized inbox.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'WhatsApp Business API', desc: 'Automate WhatsApp inquiries & send order notifications.', icon: MessageSquare },
            { title: 'Instagram Direct', desc: 'Reply to IG DMs and comments directly from your dashboard.', icon: Globe },
            { title: 'Embed Web Widget', desc: 'Vite Shadow DOM SDK under 25KB gzipped.', icon: Code2 },
            { title: 'Shopify & WooCommerce', desc: 'Sync inventory, order tracking, and product catalogs.', icon: Layers },
            { title: 'Omnichannel Email', desc: 'Transform customer support emails into live tickets.', icon: MessageSquare },
            { title: 'Zapier & Webhooks', desc: 'Connect 5,000+ apps with real-time JSON webhooks.', icon: Zap },
            { title: 'RAG Knowledge Vector', desc: 'PostgreSQL + pgvector multi-tenant data boundaries.', icon: Database },
            { title: 'Enterprise Security', desc: 'Isolated tenant API keys with Role-Based Access Control.', icon: Lock }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#0F2B1D] transition transform hover:-translate-y-1 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#0F2B1D] flex items-center justify-center font-bold">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                <p className="text-[11px] text-slate-500 leading-normal">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. PRICING OVERVIEW */}
      <section className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#C59B27] uppercase tracking-wider">Transparent Pricing</span>
          <h2 className="text-3xl font-extrabold text-slate-900">Simple Plans Designed for Growing Businesses</h2>
          <p className="text-xs text-slate-500 font-medium">Select a plan to start your 14-day free trial immediately.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { name: 'Free', price: '$0/mo', chats: '50 AI chats', seats: '2 Seats', cta: 'Start Free' },
            { name: 'Starter', price: '$12/mo', chats: '100 AI chats', seats: '5 Seats', cta: 'Select Starter' },
            { name: 'Growth', price: '$25/mo', chats: '500 AI chats', seats: '15 Seats', popular: true, cta: 'Start Growth Trial' },
            { name: 'Plus', price: '$200/mo', chats: '10,000 AI chats', seats: 'Unlimited', cta: 'Contact Enterprise' }
          ].map((plan, idx) => (
            <div key={idx} className={`bg-white rounded-3xl p-6 border flex flex-col justify-between transition transform hover:-translate-y-1 relative ${
              plan.popular ? 'border-2 border-[#C59B27] shadow-xl scale-105' : 'border-slate-200 shadow-xs'
            }`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#C59B27] text-[#0F2B1D] text-[10px] font-extrabold uppercase rounded-full">
                  Most Popular
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{plan.name}</h3>
                  <div className="text-2xl font-black text-[#0F2B1D] mt-1">{plan.price}</div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {plan.chats}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {plan.seats}</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Solomon AI Engine</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> React Native Mobile App</div>
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
      </section>

      {/* 6. CTA BANNER */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-[#0F2B1D] rounded-3xl p-10 md:p-14 text-white text-center space-y-6 border-2 border-[#C59B27] shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Ready to Automate Customer Support with Solomon AI?</h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto font-medium leading-relaxed">
            Join hundreds of forward-thinking brands using Quadrace CRM to improve customer satisfaction and boost sales conversions.
          </p>

          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="px-8 py-4 bg-[#C59B27] hover:bg-[#D4AF37] text-[#0F2B1D] rounded-xl text-xs font-extrabold shadow-xl transition transform hover:scale-105"
            >
              Create Your Workspace Now
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
