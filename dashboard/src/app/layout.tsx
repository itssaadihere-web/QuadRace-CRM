'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { QuadraceLogo } from '@/components/Logo';
import { 
  MessageSquare, 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  BarChart3, 
  CreditCard, 
  ShieldCheck,
  ChevronRight,
  LogOut,
  ArrowRight,
  Users
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('alex@aurafashion.com');
  const [orgName, setOrgName] = useState<string>('Quadrace Pakistan');
  const [planTier, setPlanTier] = useState<string>('Growth Plan ($25/mo)');
  const [chatsUsed, setChatsUsed] = useState<number>(42);
  const [chatsLimit, setChatsLimit] = useState<number>(500);

  useEffect(() => {
    const authFlag = localStorage.getItem('quadrace_authenticated');
    const savedOrg = localStorage.getItem('quadrace_org_name');
    const savedUser = localStorage.getItem('quadrace_user_email');
    
    if (authFlag === 'true') {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }

    if (savedOrg) setOrgName(savedOrg);
    if (savedUser) setUserEmail(savedUser);

    const fetchOrg = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/org?org_id=org-demo-123`);
        const data = await res.json();
        if (data.success && data.organization) {
          setOrgName(data.organization.name || savedOrg || 'Quadrace Pakistan');
          setPlanTier(`${data.organization.plan_tier || 'Growth'} Plan`);
          setChatsUsed(data.organization.monthly_chats_used || 42);
          setChatsLimit(data.organization.monthly_chats_limit || 500);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrg();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('quadrace_authenticated');
    setIsAuthenticated(false);
    router.push('/');
  };

  const isPublicRoute = ['/', '/about', '/solutions', '/integrations', '/pricing', '/login', '/signup'].includes(pathname);

  // PUBLIC MARKETING WEBSITE LAYOUT WITH PREMIUM HEADER & FOOTER
  if (isPublicRoute) {
    return (
      <html lang="en">
        <body className="bg-[#F8FAF8] text-slate-800 min-h-screen flex flex-col antialiased selection:bg-[#C59B27]/30 selection:text-[#0F2B1D]">
          
          {/* Top Banner Ribbon */}
          <div className="bg-[#0F2B1D] text-white text-[11px] font-bold py-1.5 px-4 text-center border-b border-[#C59B27]/30 flex flex-wrap items-center justify-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#C59B27] text-[#0F2B1D] font-extrabold uppercase text-[9px] shrink-0">New Feature</span>
            <span>Solomon AI Copilot & Sitemap Auto-Crawler active for all Growth plans</span>
            <Link href="/pricing" className="underline text-[#E6C280] hover:text-white font-extrabold ml-1 shrink-0">Learn More →</Link>
          </div>

          {/* Premium Glassmorphic Header */}
          <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all duration-200">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
              
              {/* Brand Logo Header */}
              <Link href="/" className="group flex items-center gap-3 transition transform hover:scale-[1.01] shrink-0">
                <QuadraceLogo size={48} />
              </Link>

              {/* Navigation Pill Links */}
              <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/70 text-xs font-bold text-slate-700">
                {[
                  { name: 'Home', href: '/' },
                  { name: 'About Us', href: '/about' },
                  { name: 'Solutions & AI', href: '/solutions' },
                  { name: 'Integrations', href: '/integrations' },
                  { name: 'Pricing', href: '/pricing' }
                ].map(nav => {
                  const isActive = pathname === nav.href;
                  return (
                    <Link
                      key={nav.href}
                      href={nav.href}
                      className={`px-4 py-2 rounded-xl transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? 'bg-[#0F2B1D] text-white shadow-md shadow-[#0F2B1D]/20 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/90'
                      }`}
                    >
                      {nav.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                {isAuthenticated ? (
                  <Link
                    href="/inbox"
                    className="px-5 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#0F2B1D]/20 flex items-center gap-2 transition transform hover:scale-105 border border-[#C59B27] whitespace-nowrap"
                  >
                    Open Dashboard <ChevronRight className="w-4 h-4 text-[#C59B27]" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-4 py-2.5 text-[#0F2B1D] hover:bg-slate-100 rounded-xl text-xs font-extrabold transition whitespace-nowrap"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      className="px-5 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-extrabold shadow-md shadow-[#0F2B1D]/20 flex items-center gap-2 transition transform hover:scale-105 border border-[#C59B27] whitespace-nowrap"
                    >
                      Start Free Trial <ArrowRight className="w-3.5 h-3.5 text-[#C59B27]" />
                    </Link>
                  </>
                )}
              </div>

            </div>
          </header>

          {/* Main Website Content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Premium Footer */}
          <footer className="bg-[#0F2B1D] text-white pt-16 pb-12 border-t-2 border-[#C59B27] mt-20 relative">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <QuadraceLogo size={44} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  The AI-powered omnichannel customer growth platform. Powered by Solomon AI, Claude 3.5 Sonnet RAG retrieval, and React Native mobile apps.
                </p>
                <div className="flex items-center gap-2 pt-2 text-[11px] text-[#E6C280]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Multi-Tenant SOC-2 SaaS Architecture
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#C59B27] mb-4">Product Platform</h4>
                <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                  <li><Link href="/solutions" className="hover:text-[#E6C280] transition">Solomon AI Engine</Link></li>
                  <li><Link href="/solutions" className="hover:text-[#E6C280] transition">Omnichannel Inbox</Link></li>
                  <li><Link href="/solutions" className="hover:text-[#E6C280] transition">React Native Expo App</Link></li>
                  <li><Link href="/solutions" className="hover:text-[#E6C280] transition">RAG Knowledge Vector Engine</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#C59B27] mb-4">Omnichannel Ecosystem</h4>
                <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                  <li><Link href="/integrations" className="hover:text-[#E6C280] transition">WhatsApp Business API</Link></li>
                  <li><Link href="/integrations" className="hover:text-[#E6C280] transition">Instagram Direct Messages</Link></li>
                  <li><Link href="/integrations" className="hover:text-[#E6C280] transition">Shopify & WooCommerce</Link></li>
                  <li><Link href="/integrations" className="hover:text-[#E6C280] transition">Vite Shadow DOM Web Widget</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#C59B27] mb-4">Company & Access</h4>
                <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                  <li><Link href="/about" className="hover:text-[#E6C280] transition">About Quadrace</Link></li>
                  <li><Link href="/pricing" className="hover:text-[#E6C280] transition">Pricing Plans</Link></li>
                  <li><Link href="/login" className="hover:text-[#E6C280] transition">Customer Portal Log In</Link></li>
                  <li><Link href="/signup" className="hover:text-[#E6C280] transition">Create Workspace Account</Link></li>
                </ul>
              </div>

            </div>

            <div className="max-w-7xl mx-auto px-6 pt-10 mt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
              <div>© {new Date().getFullYear()} Quadrace CRM & Solomon AI Inc. All rights reserved.</div>
              <div className="flex gap-4 mt-2 md:mt-0 font-medium">
                <span className="hover:text-white transition cursor-pointer">Privacy Policy</span>
                <span className="hover:text-white transition cursor-pointer">Terms of Service</span>
                <span className="hover:text-white transition cursor-pointer">Security Portal</span>
              </div>
            </div>
          </footer>

        </body>
      </html>
    );
  }

  // PROTECTED DASHBOARD LAYOUT WITH EXPANDED 280PX SIDEBAR
  const navItems = [
    { name: 'Live Omnichannel Inbox', href: '/inbox', icon: MessageSquare, badge: 'Realtime' },
    { name: 'Leads & Pipeline CRM', href: '/leads', icon: Users, badge: '100+' },
    { name: 'Vertical Onboarding', href: '/onboarding', icon: Sparkles, badge: 'Wizard' },
    { name: 'Unanswered Gaps Hub', href: '/gaps', icon: HelpCircle, badge: '1-Click' },
    { name: 'Knowledge Base (RAG)', href: '/knowledge', icon: BookOpen },
    { name: 'Analytics & Trends', href: '/analytics', icon: BarChart3 },
    { name: 'Pricing & Quota Engine', href: '/billing', icon: CreditCard },
  ];

  return (
    <html lang="en">
      <body className="bg-[#f8faf8] text-slate-800 min-h-screen flex antialiased">
        <aside className="w-[280px] bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 shrink-0 shadow-xs">
          <div>
            <div className="px-1 py-2 mb-5 border-b border-slate-100 flex items-center justify-between">
              <QuadraceLogo size={46} />
            </div>

            <div className="mx-0.5 mb-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{orgName}</div>
                  <div className="text-[11px] text-slate-500 font-medium truncate">{planTier}</div>
                </div>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#0F2B1D] text-white shadow-md shadow-[#0F2B1D]/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1 ${
                        isActive 
                          ? 'bg-[#C59B27] text-white' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FDF8EC] to-[#F7F3E3] border border-[#C59B27]/30 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#0F2B1D] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C59B27] shrink-0" /> Solomon AI Usage
                </span>
                <span className="text-xs font-extrabold text-[#B8860B]">{chatsUsed} / {chatsLimit}</span>
              </div>
              <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-[#C59B27] to-[#B8860B] rounded-full w-[8.4%]"></div>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">8.4% of monthly quota used. Resets Sept 1.</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out Workspace
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[#f8faf8]">
          <header className="h-16 border-b border-slate-200/80 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium min-w-0">
              <Link href="/" className="font-semibold text-slate-700 hover:text-[#0F2B1D] shrink-0">Public Site</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[#0F2B1D] font-bold capitalize truncate">
                {pathname.replace('/', '').replace('-', ' ') || 'Inbox'}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                Socket.io Live Sync Active
              </div>
              <div className="w-9 h-9 rounded-full bg-[#0F2B1D] border-2 border-[#C59B27] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                AR
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 overflow-y-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
