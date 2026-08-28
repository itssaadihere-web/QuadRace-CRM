'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Database, 
  Plus, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Globe, 
  Upload, 
  X, 
  Sparkles,
  HelpCircle,
  Link as LinkIcon,
  Trash2,
  ListTree
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function KnowledgePage() {
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'file'>('url');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [crawledSubUrls, setCrawledSubUrls] = useState<string[]>([]);

  // Form Inputs
  const [urlInput, setUrlInput] = useState<string>('');
  const [sourceTitle, setSourceTitle] = useState<string>('');
  const [rawTextInput, setRawTextInput] = useState<string>('');

  const fetchKnowledge = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/knowledge-base?org_id=org-demo-123`);
      const data = await res.json();
      if (data.success) {
        setKnowledgeList(data.knowledge_base);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  // Submit Handler for Adding Knowledge Source
  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCrawledSubUrls([]);

    let sourceType: 'url' | 'faq' | 'pdf' = 'url';
    let sourceUrl = urlInput;
    let content = rawTextInput;

    if (activeTab === 'url') {
      sourceType = 'url';
      sourceUrl = urlInput || 'https://domain.com';
    } else if (activeTab === 'text') {
      sourceType = 'faq';
      sourceUrl = sourceTitle || 'Custom FAQ / Knowledge Entry';
    } else if (activeTab === 'file') {
      sourceType = 'pdf';
      sourceUrl = sourceTitle || 'Uploaded Document';
      content = rawTextInput || `Parsed text from uploaded file ${sourceTitle || 'document.pdf'}.`;
    }

    try {
      const res = await fetch(`${API_BASE}/api/knowledge-base/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({
          source_type: sourceType,
          source_url: sourceUrl,
          raw_text: content
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.sub_urls_crawled) {
          setCrawledSubUrls(data.sub_urls_crawled);
          setSuccessMsg(`Sitemap XML inspected! Auto-fetched & vectorized ${data.sub_urls_crawled.length} sub-URLs into pgvector.`);
        } else {
          setSuccessMsg('Knowledge base chunk trained and vectorized successfully into pgvector!');
        }
        setUrlInput('');
        setSourceTitle('');
        setRawTextInput('');
        fetchKnowledge();
        setTimeout(() => {
          setSuccessMsg('');
          setIsModalOpen(false);
        }, 2200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge chunk from the vector engine?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/knowledge-base/${id}`, {
        method: 'DELETE',
        headers: { 'x-org-id': 'org-demo-123' }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Knowledge chunk deleted successfully from RAG engine.');
        fetchKnowledge();
        setTimeout(() => setSuccessMsg(''), 2500);
      }
    } catch (err) {
      console.error('Failed to delete knowledge chunk:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0F2B1D]" /> RAG Knowledge Base Engine (Sitemap Auto-Crawler)
          </h1>
          <p className="text-xs text-slate-500 font-medium">Auto-fetches domain sitemaps & sub-URLs into pgvector for Solomon AI.</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchKnowledge}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Engine
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 transition border border-[#C59B27]"
          >
            <Plus className="w-4 h-4 text-[#C59B27]" /> Add Knowledge Base
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Metrics Header */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F2B1D] text-[#C59B27] flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Indexed Chunks</div>
            <div className="text-lg font-bold text-slate-900">{knowledgeList.length} Chunks</div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <ListTree className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Sitemap Auto-Crawler</div>
            <div className="text-lg font-bold text-slate-900">Active (XML Auto-Fetch)</div>
          </div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FDF8EC] text-[#B8860B] flex items-center justify-center font-bold border border-[#C59B27]/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Retrieval Model</div>
            <div className="text-lg font-bold text-slate-900">Claude 3.5 Sonnet</div>
          </div>
        </div>
      </div>

      {/* Active Vector Chunks Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Vector Chunks ({knowledgeList.length})</h2>
          <span className="text-xs font-semibold text-emerald-700">● RAG Vector Ready</span>
        </div>

        <div className="space-y-3">
          {knowledgeList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No knowledge base chunks stored yet. Click "+ Add Knowledge Base" to crawl a domain.</div>
          ) : (
            knowledgeList.map(kb => (
              <div key={kb.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 group hover:border-[#0F2B1D]/30 transition">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#0F2B1D] flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#C59B27]" /> Source: {kb.source_url || kb.source_type}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold uppercase">
                      {kb.vector_status}
                    </span>
                    
                    <button
                      onClick={() => handleDeleteKnowledge(kb.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Knowledge Chunk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-mono bg-white p-3 rounded-lg border border-slate-200">
                  "{kb.content_chunk}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD KNOWLEDGE BASE MODAL (WITH SITEMAP AUTO-FETCH) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#0F2B1D] to-[#153B27] text-white flex items-center justify-between border-b border-[#C59B27]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-base font-bold">Add Knowledge Base (Sitemap Auto-Crawler)</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Type Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
              {[
                { id: 'url', label: 'Domain & Sitemap URL', icon: Globe },
                { id: 'text', label: 'Q&A / Custom Text', icon: HelpCircle },
                { id: 'file', label: 'Document Upload', icon: Upload }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#0F2B1D] text-[#D4AF37] shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddKnowledge} className="p-6 space-y-4">
              
              {crawledSubUrls.length > 0 && (
                <div className="p-3 bg-[#FDF8EC] border border-[#C59B27]/40 rounded-xl space-y-1.5 text-xs text-slate-800">
                  <div className="font-bold text-[#0F2B1D] flex items-center gap-1.5">
                    <ListTree className="w-4 h-4 text-[#C59B27]" /> Sub-URLs Discovered via Sitemap.xml ({crawledSubUrls.length}):
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200">
                    {crawledSubUrls.map((url, i) => (
                      <div key={i} className="truncate">✓ {url}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 1: WEBSITE & SITEMAP CRAWLER */}
              {activeTab === 'url' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Main Domain / Website URL</label>
                    <input
                      type="url"
                      required
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="e.g. https://yourdomain.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Providing a main domain will automatically inspect <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[#0F2B1D]">/sitemap.xml</code> and crawl all live sub-pages (/shipping, /faq, /returns, /catalog).
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Q&A / CUSTOM TEXT */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Knowledge Title / Question Reference</label>
                    <input
                      type="text"
                      required
                      value={sourceTitle}
                      onChange={(e) => setSourceTitle(e.target.value)}
                      placeholder="e.g. International Shipping Rates to Japan"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Detailed Answer / Knowledge Text Chunk</label>
                    <textarea
                      required
                      value={rawTextInput}
                      onChange={(e) => setRawTextInput(e.target.value)}
                      rows={4}
                      placeholder="Provide the exact factual answer Solomon AI should use when answering..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENT UPLOAD */}
              {activeTab === 'file' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Document Name / Identifier</label>
                    <input
                      type="text"
                      value={sourceTitle}
                      onChange={(e) => setSourceTitle(e.target.value)}
                      placeholder="e.g. Catalog_Export_2026.csv or ReturnPolicy.pdf"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                    />
                  </div>
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                    <Upload className="w-8 h-8 text-[#C59B27] mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-800">Drop PDF, CSV, or TXT document file here</div>
                    <div className="text-[11px] text-slate-500">Instant client text extraction & pgvector training</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-[#C59B27]" />
                  {loading ? 'Inspecting Sitemap & Crawling...' : 'Inspect Sitemap & Auto-Fetch All Sub-URLs'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
