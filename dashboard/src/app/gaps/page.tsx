'use client';

import { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  Database,
  Check
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function GapsPage() {
  const [gaps, setGaps] = useState<any[]>([]);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  const fetchGaps = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gaps?org_id=org-demo-123`);
      const data = await res.json();
      if (data.success) {
        setGaps(data.gaps);
        if (data.gaps.length > 0 && !selectedGap) {
          setSelectedGap(data.gaps[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  const handleApprove = async () => {
    if (!selectedGap || !answerInput.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/gaps/${selectedGap.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({ answer: answerInput })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessNotice(`Answer approved! Vector chunk injected into pgvector engine.`);
        setAnswerInput('');
        fetchGaps();
        setTimeout(() => setSuccessNotice(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#C59B27]" /> Unanswered Gaps Hub & 1-Click RAG Approver
          </h1>
          <p className="text-xs text-slate-500 font-medium">Low-confidence customer questions automatically clustered for site owner 1-click answer injection.</p>
        </div>
        <div className="px-3 py-1 bg-[#FDF8EC] border border-[#C59B27]/30 text-[#B8860B] rounded-full text-xs font-bold">
          {gaps.filter(g => !g.resolved_status).length} Open Knowledge Gaps
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successNotice}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Low-Confidence Queries</span>
          
          <div className="space-y-2">
            {gaps.map(gap => {
              const isSelected = selectedGap?.id === gap.id;
              return (
                <div
                  key={gap.id}
                  onClick={() => setSelectedGap(gap)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FDF8EC] border-[#C59B27]'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{gap.customer_query}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      gap.resolved_status ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {gap.resolved_status ? 'Resolved' : `Asked ${gap.frequency_count}x`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{gap.context || 'Customer asked during chat session'}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-7 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
          {selectedGap ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-[#0F2B1D] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C59B27]" /> Selected Customer Question
                </span>
                <span className="text-[11px] text-slate-400">ID: {selectedGap.id}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-1">"{selectedGap.customer_query}"</h3>
                <p className="text-xs text-slate-500">Context: {selectedGap.context}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">Enter 1-Sentence Answer</label>
                <textarea
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="e.g. Yes, we ship internationally to Tokyo Japan via DHL Express for a flat $25 fee."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0F2B1D]"
                />
              </div>

              <div className="p-3 bg-[#FDF8EC] rounded-xl border border-[#C59B27]/30 text-[11px] text-slate-700 font-medium flex items-center gap-2">
                <Database className="w-4 h-4 shrink-0 text-[#C59B27]" />
                Clicking approve instantly converts this Q&A into a vector embedding and injects it into pgvector context.
              </div>

              <button
                onClick={handleApprove}
                disabled={!answerInput.trim() || selectedGap.resolved_status}
                className="w-full py-3 bg-[#0F2B1D] hover:bg-[#153B27] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
              >
                <Check className="w-4 h-4 text-[#C59B27]" /> 1-Click Approve & Train Solomon AI
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Select a gap from the left to approve an answer.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
