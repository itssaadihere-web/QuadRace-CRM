'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Building2, 
  MapPin, 
  Sparkles, 
  Upload, 
  Globe, 
  Code2, 
  CheckCircle2, 
  ChevronRight, 
  Copy,
  Check,
  Wand2,
  X
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<number>(1);
  const [vertical, setVertical] = useState<'ecommerce' | 'b2b' | 'services'>('ecommerce');
  
  // Step 2: Knowledge Base Crawling
  const [crawlUrl, setCrawlUrl] = useState<string>('https://aurafashion.com');
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawledChunks, setCrawledChunks] = useState<any[]>([]);

  // Step 3: Business Details & Intent Collector
  const [companyName, setCompanyName] = useState<string>('Quadrace Pakistan');
  const [businessOverview, setBusinessOverview] = useState<string>('We specialize in modern e-commerce solutions, tech apparel, and customer service automation with 3-day express nationwide delivery.');
  const [brandTone, setBrandTone] = useState<string>('Warm, professional, and helpful');
  const [specialOffers, setSpecialOffers] = useState<string>('Free shipping over PKR 2,000. Use promo code QUADRACE10 for 10% off.');

  // Step 4: Customized Brand & Guidance Rules
  const [primaryColor, setPrimaryColor] = useState<string>('#0F2B1D');
  const [greetingMessage, setGreetingMessage] = useState<string>('');
  const [solomonGuidance, setSolomonGuidance] = useState<string>('');
  
  const [copied, setCopied] = useState<boolean>(false);

  // Automatically construct dynamic Greeting Message & Solomon Guidance Rules
  const generateDynamicConfig = (name: string, overview: string, tone: string, offers: string, type: string) => {
    let greeting = '';
    let guidance = '';

    if (type === 'ecommerce') {
      greeting = `Welcome to ${name || 'our store'}! I am Solomon AI, your personal shopping & order assistant. How can I help you find products or track your order today?`;
      guidance = `Tone: ${tone || 'Warm and helpful'}. Primary focus: Assist customer with product catalog recommendations, order tracking lookups, and shipping rules. Store Overview: ${overview}. Offers & Rules: ${offers}.`;
    } else if (type === 'b2b') {
      greeting = `Welcome to ${name || 'our company'}! I am Solomon AI. How can I assist you with our services, custom solutions, or demo bookings today?`;
      guidance = `Tone: ${tone || 'Professional and direct'}. Primary focus: Qualify business leads, capture visitor inquiries, schedule meetings, and explain B2B service offerings. Overview: ${overview}. Offers: ${offers}.`;
    } else {
      greeting = `Hello! Welcome to ${name || 'our business'}. I am Solomon AI, your virtual assistant. How can I help you with our hours, location, or bookings today?`;
      guidance = `Tone: ${tone || 'Friendly and informative'}. Primary focus: Provide accurate operating hours, location details, service pricing, and auto-booking instructions. Overview: ${overview}. Rules: ${offers}.`;
    }

    return { greeting, guidance };
  };

  useEffect(() => {
    const savedOrg = localStorage.getItem('quadrace_org_name');
    if (savedOrg) setCompanyName(savedOrg);
  }, []);

  useEffect(() => {
    const { greeting, guidance } = generateDynamicConfig(companyName, businessOverview, brandTone, specialOffers, vertical);
    setGreetingMessage(greeting);
    setSolomonGuidance(guidance);
  }, [companyName, businessOverview, brandTone, specialOffers, vertical]);

  const handleCrawl = async () => {
    setIsCrawling(true);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge-base/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({ source_type: 'url', source_url: crawlUrl })
      });
      const data = await res.json();
      if (data.success) {
        if (data.chunks && Array.isArray(data.chunks)) {
          setCrawledChunks(prev => [...prev, ...data.chunks]);
        } else if (data.chunk) {
          setCrawledChunks(prev => [...prev, data.chunk]);
        }
      }
    } catch (err) {
      console.error('Crawling error:', err);
    } finally {
      setIsCrawling(false);
    }
  };

  const handleSaveSetup = async () => {
    const { greeting, guidance } = generateDynamicConfig(companyName, businessOverview, brandTone, specialOffers, vertical);
    const finalGreeting = greetingMessage || greeting;
    const finalGuidance = solomonGuidance || guidance;

    try {
      await fetch(`${API_BASE}/api/onboarding/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({
          vertical,
          company_name: companyName,
          primary_color: primaryColor,
          greeting_message: finalGreeting,
          solomon_guidance: finalGuidance
        })
      });
      if (step === 3) setStep(4);
      else if (step === 4) onClose();
    } catch (err) {
      console.error(err);
      onClose();
    }
  };

  const snippetCode = `<script src="http://localhost:5000/solomon.js" data-org-id="org-demo-123" data-api-host="http://localhost:5000" async></script>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl max-h-[88vh] rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-[#0F2B1D] via-[#153B27] to-[#0F2B1D] text-white flex items-center justify-between border-b border-[#C59B27] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C59B27] text-[#0F2B1D] font-black flex items-center justify-center text-xs shrink-0">
              <Sparkles className="w-5 h-5 text-[#0F2B1D]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Smart Vertical Onboarding Setup</h3>
              <p className="text-[11.5px] text-[#E6C280] font-medium">Configure your workspace intent, RAG memory, and embed script</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
            >
              Skip Onboarding <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wizard Progress Indicator */}
        <div className="px-6 pt-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { num: 1, title: '1. Vertical' },
              { num: 2, title: '2. RAG Knowledge' },
              { num: 3, title: '3. Intent Setup' },
              { num: 4, title: '4. Embed Script' }
            ].map(s => (
              <div key={s.num} className="space-y-1">
                <div className="text-[11px] font-bold text-slate-600 truncate">{s.title}</div>
                <div className={`h-1.5 rounded-full transition-all ${
                  step >= s.num ? 'bg-[#0F2B1D]' : 'bg-slate-200'
                }`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* STEP 1: BUSINESS TYPE */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1">Select Your Business Type</h2>
                <p className="text-xs text-slate-500">Solomon AI will automatically enable vertical-specific workflows and RAG parameters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'ecommerce',
                    title: 'E-Commerce Store',
                    icon: ShoppingBag,
                    desc: 'Inventory Scraping, Order Tracking Cards, Product Recommendations, Shopify/WooCommerce.'
                  },
                  {
                    id: 'b2b',
                    title: 'B2B / Lead Gen',
                    icon: Building2,
                    desc: 'Custom Lead Form Triggers, CRM Payload Sync (HubSpot/Zapier), and Meeting Scheduler.'
                  },
                  {
                    id: 'services',
                    title: 'Local Services / FAQ',
                    icon: MapPin,
                    desc: 'Hours/Location RAG, Support Ticket Creation, and Auto-Booking workflows.'
                  }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = vertical === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setVertical(item.id as any)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#FDF8EC] border-[#C59B27] shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl mb-3 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#0F2B1D] text-[#D4AF37]' : 'bg-slate-200 text-slate-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={onClose}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  Skip for Now
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition border border-[#C59B27] whitespace-nowrap"
                >
                  Continue to Step 2 <ChevronRight className="w-4 h-4 text-[#C59B27]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: RAG KNOWLEDGE BASE */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1">Train Solomon AI Knowledge Base</h2>
                <p className="text-xs text-slate-500">Provide domain URLs or documents to chunk and generate pgvector embeddings.</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#0F2B1D] shrink-0" /> Website URL Auto-Crawler (Sitemap Auto-Fetch)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={crawlUrl}
                    onChange={(e) => setCrawlUrl(e.target.value)}
                    placeholder="https://yourdomain.com"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                  />
                  <button
                    onClick={handleCrawl}
                    disabled={isCrawling}
                    className="px-5 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 whitespace-nowrap"
                  >
                    {isCrawling ? 'Crawling...' : 'Crawl Domain'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <Upload className="w-8 h-8 text-[#C59B27] mx-auto" />
                <div className="text-xs font-bold text-slate-800">Drop PDF, CSV, DOCX files here</div>
                <div className="text-[11px] text-slate-500">Supports catalog exports, shipping policy PDFs, and FAQ CSV sheets</div>
              </div>

              {crawledChunks.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Vector Embeddings Generated ({crawledChunks.length})
                  </span>
                  {crawledChunks.map((c, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 break-words">
                      <span className="text-[#0F2B1D] font-bold">Chunk #{i+1}:</span> {c?.content_chunk || 'Vector chunk stored.'}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition border border-[#C59B27] whitespace-nowrap"
                >
                  Continue to Step 3 <ChevronRight className="w-4 h-4 text-[#C59B27]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BUSINESS DETAILS & INTENT */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1">Business Details & AI Intent Configuration</h2>
                <p className="text-xs text-slate-500">Provide details about your business so Solomon AI can craft dynamic greeting messages and guidance rules.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Business / Store Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Quadrace Pakistan"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Business Overview</label>
                    <textarea
                      value={businessOverview}
                      onChange={(e) => setBusinessOverview(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Desired Brand Tone</label>
                    <input
                      type="text"
                      value={brandTone}
                      onChange={(e) => setBrandTone(e.target.value)}
                      placeholder="e.g. Warm, professional, helpful"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Special Offers / Store Rules</label>
                    <textarea
                      value={specialOffers}
                      onChange={(e) => setSpecialOffers(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#FDF8EC] rounded-xl border border-[#C59B27]/40 flex items-center justify-between text-xs">
                <div className="font-bold text-[#0F2B1D] flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-[#C59B27] shrink-0" /> Live AI Greeting & Rule Sync Active
                </div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0">● Synced</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveSetup}
                  className="px-6 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition border border-[#C59B27] whitespace-nowrap"
                >
                  Continue to Step 4 <ChevronRight className="w-4 h-4 text-[#C59B27]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: EMBED CODE */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1">Brand Customization & Copy-Paste Embed Code</h2>
                <p className="text-xs text-slate-500">Review your customized greeting, AI rules, and copy your single HTML JS snippet.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Greeting Message</label>
                    <textarea
                      value={greetingMessage}
                      onChange={(e) => setGreetingMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Solomon Guidance Rules</label>
                    <textarea
                      value={solomonGuidance}
                      onChange={(e) => setSolomonGuidance(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#0F2B1D] flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-[#C59B27] shrink-0" /> Copy-Paste HTML Snippet
                      </span>
                      <button
                        onClick={copySnippet}
                        className="px-3 py-1.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 whitespace-nowrap"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#C59B27]" />}
                        {copied ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <pre className="p-3 bg-white rounded-xl text-[11px] font-mono text-[#0F2B1D] whitespace-pre-wrap overflow-x-auto border border-slate-200 break-words">
                      {snippetCode}
                    </pre>
                  </div>

                  <div className="p-3 bg-[#FDF8EC] rounded-xl text-[11px] text-slate-700 font-medium border border-[#C59B27]/30">
                    <strong>Shadow DOM Encapsulation:</strong> Host site CSS will never alter widget styles.
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveSetup}
                  className="px-6 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition border border-[#C59B27] whitespace-nowrap"
                >
                  Complete Setup & Open Workspace <CheckCircle2 className="w-4 h-4 text-[#C59B27]" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
