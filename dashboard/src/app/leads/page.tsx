'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Download, 
  Sparkles, 
  Phone, 
  Mail, 
  MessageSquare, 
  Linkedin, 
  Globe, 
  MapPin, 
  Building2, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  Kanban, 
  ListFilter, 
  Eye, 
  Send, 
  PhoneCall, 
  History, 
  Award, 
  Tag, 
  RefreshCw, 
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Flame,
  Check
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export interface Lead {
  id: string;
  org_id: string;
  prospect_id?: string;
  business_id?: string;
  row_num?: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  contact_number: string;
  country_name: string;
  region_name: string;
  city: string;
  linkedin_url: string;
  experience: string[];
  skills: string[];
  interests: string[];
  company_name: string;
  company_website: string;
  company_linkedin: string;
  job_department: string;
  job_seniority_level: string[];
  job_title: string;
  status: 'new' | 'contacted' | 'meeting_scheduled' | 'qualified' | 'proposal' | 'won' | 'unqualified';
  score: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivityLog {
  id: string;
  lead_id: string;
  org_id: string;
  type: 'import' | 'field_update' | 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'status_change';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  summary: string;
  content?: string;
  outcome?: string;
  duration_seconds?: number;
  performed_by: string;
  created_at: string;
}

const PIPELINE_STAGES = [
  { id: 'new', label: 'New Leads', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'contacted', label: 'Contacted', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'qualified', label: 'Qualified', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'proposal', label: 'Proposal Sent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'won', label: 'Won / Closed', color: 'bg-emerald-600 text-white border-emerald-700' },
  { id: 'unqualified', label: 'Unqualified', color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const kanbanScrollRef = useRef<HTMLDivElement>(null);

  const scrollKanban = (direction: 'left' | 'right') => {
    if (kanbanScrollRef.current) {
      const scrollAmount = 350;
      kanbanScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [seniorityFilter, setSeniorityFilter] = useState<string>('all');
  const [missingFilter, setMissingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Drawers
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'details' | 'activities' | 'outreach'>('details');

  // Communication Action Modal
  const [commModal, setCommModal] = useState<{
    isOpen: boolean;
    type: 'call' | 'email' | 'whatsapp';
    lead: Lead | null;
  }>({ isOpen: false, type: 'call', lead: null });

  // Call form state
  const [callOutcome, setCallOutcome] = useState<string>('connected');
  const [callDuration, setCallDuration] = useState<string>('180');
  const [callNotes, setCallNotes] = useState<string>('');

  // Email form state
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState<boolean>(false);

  // WhatsApp form state
  const [whatsappMsg, setWhatsappMsg] = useState<string>('');

  // Import Modal State
  const [importTab, setImportTab] = useState<'upload' | 'paste' | 'sample'>('sample');
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [importStrategy, setImportStrategy] = useState<'merge' | 'skip' | 'overwrite'>('merge');
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Edit Lead Form State
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [activityLogs, setActivityLogs] = useState<LeadActivityLog[]>([]);
  const [copiedId, setCopiedId] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // Load Leads & Stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/leads?limit=200&sort_by=${sortBy}&order=${sortOrder}`, {
          headers: { 'x-org-id': 'org-demo-123' }
        }),
        fetch(`${API_BASE}/api/leads/stats`, {
          headers: { 'x-org-id': 'org-demo-123' }
        })
      ]);

      const leadsData = await leadsRes.json();
      const statsData = await statsRes.json();

      if (leadsData.success) {
        setLeads(leadsData.leads);
      }
      if (statsData.success) {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sortBy, sortOrder]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = lead.full_name.toLowerCase().includes(q);
        const matchesComp = lead.company_name.toLowerCase().includes(q);
        const matchesTitle = lead.job_title.toLowerCase().includes(q);
        const matchesCity = lead.city.toLowerCase().includes(q);
        const matchesCountry = lead.country_name.toLowerCase().includes(q);
        const matchesPhone = lead.contact_number.includes(q);
        const matchesEmail = lead.email.toLowerCase().includes(q);
        const matchesSkill = lead.skills.some(s => s.toLowerCase().includes(q));
        if (!matchesName && !matchesComp && !matchesTitle && !matchesCity && !matchesCountry && !matchesPhone && !matchesEmail && !matchesSkill) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false;
      }

      // Seniority
      if (seniorityFilter !== 'all') {
        const sen = lead.job_seniority_level.map(s => s.toLowerCase()).join(' ');
        const title = lead.job_title.toLowerCase();
        if (seniorityFilter === 'cxo') {
          if (!sen.includes('cxo') && !sen.includes('owner') && !title.includes('ceo') && !title.includes('chief') && !title.includes('founder') && !title.includes('president')) return false;
        } else if (seniorityFilter === 'director') {
          if (!sen.includes('director') && !sen.includes('vp') && !sen.includes('partner') && !title.includes('director')) return false;
        } else if (seniorityFilter === 'manager') {
          if (!sen.includes('manager') && !title.includes('manager')) return false;
        }
      }

      // Missing detail filter
      if (missingFilter === 'missing_phone') {
        if (lead.contact_number && lead.contact_number.trim() !== '') return false;
      } else if (missingFilter === 'missing_email') {
        if (lead.email && lead.email.trim() !== '') return false;
      } else if (missingFilter === 'missing_both') {
        if ((lead.contact_number && lead.contact_number.trim() !== '') || (lead.email && lead.email.trim() !== '')) return false;
      }

      return true;
    });
  }, [leads, searchQuery, statusFilter, seniorityFilter, missingFilter]);

  // Open Lead Details Drawer & fetch activities
  const handleOpenLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm({ ...lead });
    setIsDetailDrawerOpen(true);
    setDrawerTab('details');

    try {
      const res = await fetch(`${API_BASE}/api/leads/${lead.id}/activities`);
      const data = await res.json();
      if (data.success) {
        setActivityLogs(data.activities);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    }
  };

  // Quick Stage Update
  const handleStageChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({ status: newStatus, performed_by: 'Pipeline Agent' })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === leadId ? data.lead : l));
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead(data.lead);
          setEditForm(data.lead);
          if (data.logged_changes) {
            setActivityLogs(prev => [...data.logged_changes, ...prev]);
          }
        }
        showToast(`Lead moved to ${newStatus.replace('_', ' ').toUpperCase()}`);
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  // Save manual field updates on lead
  const handleSaveLeadEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({ ...editForm, performed_by: 'Alex (Owner)' })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLead(data.lead);
        setEditForm(data.lead);
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? data.lead : l));
        if (data.logged_changes && data.logged_changes.length > 0) {
          setActivityLogs(prev => [...data.logged_changes, ...prev]);
          showToast(`Saved! ${data.logged_changes.length} field corrections logged in audit timeline.`);
        } else {
          showToast('Lead details updated successfully.');
        }
      }
    } catch (err) {
      console.error('Failed to save lead:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Trigger Solomon AI pitch generator
  const handleGenerateAIPitch = async (channel: 'email' | 'whatsapp' | 'linkedin') => {
    if (!selectedLead) return;
    setIsGeneratingPitch(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/${selectedLead.id}/ai-pitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });
      const data = await res.json();
      if (data.success) {
        if (channel === 'email') {
          setEmailSubject(data.subject);
          setEmailBody(data.pitch);
        } else if (channel === 'whatsapp') {
          setWhatsappMsg(data.pitch);
        }
        showToast('Solomon AI crafted customized outreach pitch!');
      }
    } catch (err) {
      console.error('Failed to generate pitch:', err);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  // Log Call activity
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commModal.lead) return;

    try {
      const res = await fetch(`${API_BASE}/api/leads/${commModal.lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({
          type: 'call',
          summary: `Outbound Call (${callOutcome.replace('_', ' ').toUpperCase()}, ${Math.floor(parseInt(callDuration) / 60)}m ${parseInt(callDuration) % 60}s)`,
          content: callNotes || `Call completed with prospect ${commModal.lead.full_name}. Outcome: ${callOutcome}.`,
          outcome: callOutcome,
          duration_seconds: parseInt(callDuration) || 60,
          performed_by: 'Sales Representative'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Call logged to lead activity timeline.');
        setCommModal({ isOpen: false, type: 'call', lead: null });
        setCallNotes('');
        fetchData();
        if (selectedLead && selectedLead.id === commModal.lead.id) {
          setActivityLogs(prev => [data.activity, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to log call:', err);
    }
  };

  // Log Email activity
  const handleLogEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commModal.lead) return;

    try {
      const res = await fetch(`${API_BASE}/api/leads/${commModal.lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({
          type: 'email',
          summary: `Email Sent: "${emailSubject || 'Cold Outreach Pitch'}"`,
          content: emailBody || `Outreach email delivered to ${commModal.lead.email || 'lead'}.`,
          outcome: 'email_sent',
          performed_by: 'Sales Representative'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Email interaction logged to activity timeline.');
        setCommModal({ isOpen: false, type: 'email', lead: null });
        setEmailSubject('');
        setEmailBody('');
        fetchData();
        if (selectedLead && selectedLead.id === commModal.lead.id) {
          setActivityLogs(prev => [data.activity, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to log email:', err);
    }
  };

  // Log WhatsApp activity and launch WhatsApp Web
  const handleLogWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commModal.lead) return;

    try {
      const res = await fetch(`${API_BASE}/api/leads/${commModal.lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify({
          type: 'whatsapp',
          summary: 'WhatsApp Message Sent',
          content: whatsappMsg || 'WhatsApp introductory demo pitch sent.',
          outcome: 'whatsapp_sent',
          performed_by: 'Sales Representative'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('WhatsApp logged! Opening WhatsApp chat...');
        const cleanPhone = commModal.lead.contact_number.replace(/[^0-9]/g, '');
        if (cleanPhone) {
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
        }
        setCommModal({ isOpen: false, type: 'whatsapp', lead: null });
        setWhatsappMsg('');
        fetchData();
        if (selectedLead && selectedLead.id === commModal.lead.id) {
          setActivityLogs(prev => [data.activity, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to log WhatsApp:', err);
    }
  };

  // Handle CSV Import
  const handleExecuteImport = async () => {
    setImporting(true);
    setImportResult(null);

    try {
      let payload: any = { strategy: importStrategy };

      if (importTab === 'sample') {
        const res = await fetch(`${API_BASE}/api/leads/seed-sample`, {
          method: 'POST',
          headers: { 'x-org-id': 'org-demo-123' }
        });
        const data = await res.json();
        setImportResult(data);
        showToast(data.message || '100 Prospects imported successfully!');
        fetchData();
        return;
      }

      if (importTab === 'paste') {
        if (!rawCsvText.trim()) {
          alert('Please paste CSV text first.');
          return;
        }
        payload.csv_content = rawCsvText;
        payload.source_name = 'Raw CSV Text Paste';
      }

      const res = await fetch(`${API_BASE}/api/leads/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': 'org-demo-123' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        showToast(`Import Success: ${data.imported_count} leads added, ${data.updated_count} merged, ${data.skipped_count} skipped.`);
        fetchData();
      }
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setRawCsvText(text);
      setImportTab('paste');
    };
    reader.readAsText(file);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = [
      'prospect_full_name',
      'prospect_company_name',
      'prospect_job_title',
      'email',
      'contact_number',
      'prospect_city',
      'prospect_country_name',
      'prospect_linkedin',
      'status',
      'score'
    ];
    const rows = leads.map(l => [
      `"${l.full_name}"`,
      `"${l.company_name}"`,
      `"${l.job_title}"`,
      `"${l.email}"`,
      `"${l.contact_number}"`,
      `"${l.city}"`,
      `"${l.country_name}"`,
      `"${l.linkedin_url}"`,
      `"${l.status}"`,
      l.score
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quadrace_Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported leads to CSV file.');
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  return (
    <div className={`space-y-6 ${viewMode === 'kanban' ? 'w-full max-w-[1750px]' : 'max-w-7xl'} mx-auto py-2 transition-all`}>

      {/* TOAST ALERT */}
      {successToast && (
        <div className="fixed top-20 right-8 z-50 bg-[#0F2B1D] text-white border-2 border-[#C59B27] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-[#C59B27] shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* 1. TOP HEADER & CRM KPI METRICS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F2B1D] text-[#C59B27] flex items-center justify-center font-bold shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leads & Pipeline CRM</h1>
              <p className="text-xs text-slate-500 font-medium">
                CSV Lead Ingestion, Deduplication Engine, Field Correction Audit & Omnichannel Call/Email/WhatsApp Logging
              </p>
            </div>
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 transition border border-[#C59B27]"
          >
            <Upload className="w-4 h-4 text-[#C59B27]" /> Import CSV File
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>

          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300/70">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> List View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban Board
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-[#0F2B1D]" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.total_leads || leads.length}</div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Deduplicated In Database
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>CXO & Decision Makers</span>
            <Award className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div className="text-2xl font-black text-[#0F2B1D]">{stats?.seniority_counts?.cxo_owner || 0}</div>
          <div className="text-[11px] text-slate-500 font-medium">Founders, CEOs, Presidents</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Contact Enrichment</span>
            <Phone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.has_phone_count || 0} <span className="text-xs font-normal text-slate-400">/ {leads.length} Phone</span>
          </div>
          <div className="text-[11px] text-amber-600 font-bold">
            {stats?.needs_manual_enrichment || 0} Ready for Manual Input
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Avg Quality Score</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.avg_quality_score || 78}<span className="text-sm font-normal text-slate-400">/100</span></div>
          <div className="text-[11px] text-slate-500 font-medium">Weighted Experience & Seniority</div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lead name, company, job title, skills, city, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D] font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Stage Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Stages ({leads.length})</option>
            {PIPELINE_STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* Seniority Filter */}
          <select
            value={seniorityFilter}
            onChange={(e) => setSeniorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Seniority</option>
            <option value="cxo">CXO & Owners</option>
            <option value="director">Directors & VPs</option>
            <option value="manager">Managers</option>
          </select>

          {/* Missing Details Filter */}
          <select
            value={missingFilter}
            onChange={(e) => setMissingFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Records</option>
            <option value="missing_phone">Needs Phone Number</option>
            <option value="missing_email">Needs Email Address</option>
            <option value="missing_both">Needs Phone & Email</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="score">Sort by Quality Score</option>
            <option value="name">Sort by Name A-Z</option>
            <option value="company">Sort by Company A-Z</option>
            <option value="created_at">Sort by Import Time</option>
          </select>
        </div>
      </div>

      {/* 4. MAIN VIEW (LIST OR KANBAN) */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#C59B27] animate-spin mx-auto" />
          <div className="text-xs font-bold text-slate-700">Loading Lead Records & Activities...</div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No matching leads found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search filters or import new prospects from CSV.</p>
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-[#0F2B1D] text-white text-xs font-extrabold rounded-xl"
          >
            Open CSV Importer
          </button>
        </div>
      ) : viewMode === 'list' ? (

        /* ==================== LIST / TABLE VIEW ==================== */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Prospect & Seniority</th>
                  <th className="py-3.5 px-4">Company & Website</th>
                  <th className="py-3.5 px-4">Contact Number</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4">Pipeline Stage</th>
                  <th className="py-3.5 px-4 text-right">Omnichannel Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLeads.map((lead) => {
                  const stageInfo = PIPELINE_STAGES.find(s => s.id === lead.status) || PIPELINE_STAGES[0];
                  const initials = lead.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'LP';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition group">
                      
                      {/* 1. Prospect Full Name, Job Title & LinkedIn */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0F2B1D] text-[#C59B27] flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenLead(lead)}
                                className="font-bold text-slate-900 hover:text-[#0F2B1D] transition text-left"
                              >
                                {lead.full_name}
                              </button>
                              {lead.linkedin_url && (
                                <a
                                  href={lead.linkedin_url.startsWith('http') ? lead.linkedin_url : `https://${lead.linkedin_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                  title="View LinkedIn Profile"
                                >
                                  <Linkedin className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={lead.job_title}>
                              {lead.job_title || 'Executive'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Business / Company */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{lead.company_name || 'N/A'}</span>
                        </div>
                        {lead.company_website && (
                          <a
                            href={lead.company_website.startsWith('http') ? lead.company_website : `https://${lead.company_website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#0F2B1D] hover:underline flex items-center gap-1 font-mono"
                          >
                            <Globe className="w-3 h-3 text-[#C59B27]" />
                            {lead.company_website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </td>

                      {/* 3. Contact Number (with click-to-edit if blank) */}
                      <td className="py-3 px-4">
                        {lead.contact_number ? (
                          <div className="flex items-center gap-1.5 font-mono text-slate-900">
                            <span>{lead.contact_number}</span>
                            <button
                              onClick={() => copyToClipboard(lead.contact_number, `ph-${lead.id}`)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                              title="Copy Phone"
                            >
                              {copiedId === `ph-${lead.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenLead(lead)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 hover:bg-amber-100 transition"
                          >
                            <Plus className="w-3 h-3" /> Add Phone
                          </button>
                        )}
                      </td>

                      {/* 4. Email Address */}
                      <td className="py-3 px-4">
                        {lead.email ? (
                          <div className="flex items-center gap-1.5 font-mono text-slate-900">
                            <span className="truncate max-w-[140px]" title={lead.email}>{lead.email}</span>
                            <button
                              onClick={() => copyToClipboard(lead.email, `em-${lead.id}`)}
                              className="text-slate-400 hover:text-slate-600 p-0.5"
                              title="Copy Email"
                            >
                              {copiedId === `em-${lead.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenLead(lead)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 hover:bg-blue-100 transition"
                          >
                            <Plus className="w-3 h-3" /> Add Email
                          </button>
                        )}
                      </td>

                      {/* 5. Location */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-[11px] capitalize">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{[lead.city, lead.region_name, lead.country_name].filter(Boolean).join(', ') || 'Global'}</span>
                        </div>
                      </td>

                      {/* 6. Score */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          lead.score >= 80 ? 'bg-emerald-100 text-emerald-800' : lead.score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {lead.score}
                        </span>
                      </td>

                      {/* 7. Pipeline Stage Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStageChange(lead.id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${stageInfo.color}`}
                        >
                          {PIPELINE_STAGES.map(s => (
                            <option key={s.id} value={s.id} className="bg-white text-slate-800">
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 8. Quick Omnichannel Communication Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Call Button */}
                          <button
                            onClick={() => {
                              setCommModal({ isOpen: true, type: 'call', lead });
                              setCallNotes('');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Log Call"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          {/* Email Button */}
                          <button
                            onClick={() => {
                              setCommModal({ isOpen: true, type: 'email', lead });
                              handleGenerateAIPitch('email');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                            title="Draft / Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Button */}
                          <button
                            onClick={() => {
                              setCommModal({ isOpen: true, type: 'whatsapp', lead });
                              handleGenerateAIPitch('whatsapp');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                            title="WhatsApp Chat & Log"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Detail Profile Drawer Button */}
                          <button
                            onClick={() => handleOpenLead(lead)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0F2B1D] hover:bg-slate-100 transition ml-1"
                            title="Open Profile & History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Count Summary */}
          <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <div>Showing {filteredLeads.length} of {leads.length} total leads</div>
            <div className="flex items-center gap-1.5">
              <span>All 100 sample records fully indexed and deduplicated</span>
            </div>
          </div>
        </div>

      ) : (

        /* ==================== KANBAN BOARD VIEW (RESPONSIVE HORIZONTAL SCROLL) ==================== */
        <div className="space-y-3">
          
          {/* Kanban Toolbar with Horizontal Scroll Controls */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Kanban className="w-4 h-4 text-[#0F2B1D]" /> 7 Pipeline Stages
              </span>
              <span>•</span>
              <span>Scroll horizontally <span className="font-mono text-slate-700 font-bold">← →</span> or use buttons to navigate all columns</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollKanban('left')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition"
                title="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Left
              </button>
              <button
                type="button"
                onClick={() => scrollKanban('right')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition"
                title="Scroll Right"
              >
                Right <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Kanban Columns Horizontal Track */}
          <div 
            ref={kanbanScrollRef}
            className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start w-full scroll-smooth scrollbar-thin scrollbar-thumb-slate-300"
          >
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = filteredLeads.filter(l => l.status === stage.id);

              return (
                <div 
                  key={stage.id} 
                  className="bg-slate-100/80 rounded-2xl p-3.5 border border-slate-200/90 flex flex-col w-[320px] min-w-[320px] max-w-[320px] shrink-0 shadow-xs"
                >
                  
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        stage.id === 'won' ? 'bg-emerald-500' : stage.id === 'qualified' ? 'bg-purple-500' : stage.id === 'contacted' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}></span>
                      <span className="text-xs font-extrabold text-slate-900">{stage.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white text-slate-800 text-[11px] font-black border border-slate-200 shadow-2xs">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-0.5">
                    {stageLeads.length === 0 ? (
                      <div className="p-6 bg-white/70 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400 font-medium">
                        No leads in {stage.label}
                      </div>
                    ) : (
                      stageLeads.map(lead => {
                        const initials = lead.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'LP';

                        return (
                          <div
                            key={lead.id}
                            className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:border-[#0F2B1D] hover:shadow-md transition space-y-3 group"
                          >
                            {/* Card Top: Avatar, Name, LinkedIn & Score */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#0F2B1D] text-[#C59B27] flex items-center justify-center font-bold text-xs shrink-0">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenLead(lead)}
                                      className="text-xs font-bold text-slate-900 hover:text-[#0F2B1D] truncate block text-left"
                                      title={lead.full_name}
                                    >
                                      {lead.full_name}
                                    </button>
                                    {lead.linkedin_url && (
                                      <a
                                        href={lead.linkedin_url.startsWith('http') ? lead.linkedin_url : `https://${lead.linkedin_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 shrink-0 p-0.5"
                                        title="Open LinkedIn profile"
                                      >
                                        <Linkedin className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{lead.company_name || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-black text-[11px] border border-emerald-200 shrink-0">
                                {lead.score}
                              </span>
                            </div>

                            {/* Job Title */}
                            <div className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed" title={lead.job_title}>
                              {lead.job_title || 'Executive'}
                            </div>

                            {/* Contact Badges preview */}
                            <div className="flex items-center gap-2 text-[11px]">
                              {lead.contact_number ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-mono font-bold flex items-center gap-1 border border-emerald-200">
                                  <Phone className="w-3 h-3 text-emerald-600" /> Phone
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 border border-slate-200">No Phone</span>
                              )}

                              {lead.email ? (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-mono font-bold flex items-center gap-1 border border-blue-200">
                                  <Mail className="w-3 h-3 text-blue-600" /> Email
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 border border-slate-200">No Email</span>
                              )}
                            </div>

                            {/* Quick Actions & Move Button Strip */}
                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setCommModal({ isOpen: true, type: 'call', lead });
                                    setCallNotes('');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition border border-slate-100"
                                  title="Log Call"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setCommModal({ isOpen: true, type: 'email', lead });
                                    handleGenerateAIPitch('email');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition border border-slate-100"
                                  title="Draft / Send Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setCommModal({ isOpen: true, type: 'whatsapp', lead });
                                    handleGenerateAIPitch('whatsapp');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition border border-slate-100"
                                  title="WhatsApp Chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Stage Move Dropdown */}
                              <select
                                value={lead.status}
                                onChange={(e) => handleStageChange(lead.id, e.target.value)}
                                className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
                              >
                                {PIPELINE_STAGES.map(s => (
                                  <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                              </select>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CSV IMPORT & DEDUPLICATION MODAL */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#0F2B1D] to-[#153B27] text-white flex items-center justify-between border-b border-[#C59B27]">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-[#C59B27]" />
                <div>
                  <h3 className="text-base font-bold">Import Leads & Deduplication Engine</h3>
                  <p className="text-[11px] text-slate-300">Parse CSV prospects, remove duplicates, and maintain audit logs</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportResult(null); }}
                className="text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Type Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
              {[
                { id: 'sample', label: '1-Click 100 Prospects File', icon: Sparkles },
                { id: 'upload', label: 'Upload CSV File', icon: Upload },
                { id: 'paste', label: 'Paste Raw CSV Text', icon: Edit3 }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = importTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setImportTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#0F2B1D] text-[#D4AF37] shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* TAB 1: 1-CLICK SAMPLE FILE */}
              {importTab === 'sample' && (
                <div className="p-4 bg-[#FDF8EC] rounded-2xl border border-[#C59B27]/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0F2B1D]">
                    <Sparkles className="w-4 h-4 text-[#C59B27]" /> Provided 100 Prospect Dataset Ready
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    This file contains 100 executive prospects across Bixal, EAI Technologies, Happyrobot, Nonstop IO, Vivaldi, Sprouts AI, styleseat, etc.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                    <div>✓ 100 Executive Records</div>
                    <div>✓ Careers & Skills JSON Arrays</div>
                    <div>✓ Company Details & URLs</div>
                    <div>✓ Blank Phone/Email for Manual Input</div>
                  </div>
                </div>
              )}

              {/* TAB 2: UPLOAD CSV FILE */}
              {importTab === 'upload' && (
                <div className="space-y-3">
                  <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                    <Upload className="w-8 h-8 text-[#C59B27] mx-auto" />
                    <div className="text-xs font-bold text-slate-900">Select or drop your prospect CSV file</div>
                    <div className="text-[11px] text-slate-500">Supports standard RFC 4180 CSV with quotes and commas</div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="text-xs mt-2"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PASTE RAW CSV */}
              {importTab === 'paste' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">Raw CSV Text Content</label>
                  <textarea
                    rows={6}
                    value={rawCsvText}
                    onChange={(e) => setRawCsvText(e.target.value)}
                    placeholder="row_num,created_at,prospect_first_name,prospect_last_name,prospect_company_name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                  />
                </div>
              )}

              {/* Deduplication Strategy Selector */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Deduplication Resolution Rule
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'merge', title: 'Merge Details', desc: 'Update existing matching leads with new data' },
                    { id: 'skip', title: 'Skip Duplicates', desc: 'Ignore leads that already exist' },
                    { id: 'overwrite', title: 'Overwrite All', desc: 'Completely replace existing records' }
                  ].map(rule => (
                    <label
                      key={rule.id}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        importStrategy === rule.id 
                          ? 'bg-white border-[#0F2B1D] shadow-xs' 
                          : 'border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importStrategy"
                        value={rule.id}
                        checked={importStrategy === rule.id}
                        onChange={() => setImportStrategy(rule.id as any)}
                        className="mr-1.5"
                      />
                      <span className="font-bold text-slate-900">{rule.title}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{rule.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Import Result Feedback */}
              {importResult && (
                <div className={`p-4 rounded-2xl border text-xs font-medium ${
                  importResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {importResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                    {importResult.message || 'Import process concluded'}
                  </div>
                  {importResult.imported_count !== undefined && (
                    <div className="flex gap-4 pt-1 font-mono text-[11px]">
                      <span>Imported: <strong>{importResult.imported_count}</strong></span>
                      <span>Merged/Updated: <strong>{importResult.updated_count}</strong></span>
                      <span>Duplicates Skipped: <strong>{importResult.skipped_count}</strong></span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => { setIsImportModalOpen(false); setImportResult(null); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={handleExecuteImport}
                className="px-5 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 transition border border-[#C59B27]"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingesting & Deduplicating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C59B27]" /> Execute Lead Import
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PROSPECT DETAIL & MANUAL EDIT DRAWER (WITH AUDIT TIMELINE) */}
      {/* ========================================================================= */}
      {isDetailDrawerOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-6 bg-gradient-to-r from-[#0F2B1D] to-[#153B27] text-white flex items-center justify-between border-b border-[#C59B27]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 text-[#C59B27] border border-[#C59B27]/40 flex items-center justify-center font-bold text-sm">
                  {selectedLead.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold">{selectedLead.full_name}</h2>
                  <div className="text-xs text-slate-300">{selectedLead.job_title} @ {selectedLead.company_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedLead.linkedin_url && (
                  <a
                    href={selectedLead.linkedin_url.startsWith('http') ? selectedLead.linkedin_url : `https://${selectedLead.linkedin_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                    title="Open LinkedIn in new tab"
                  >
                    <Linkedin className="w-3.5 h-3.5" /> Open LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                <span className="px-2.5 py-1 rounded-full bg-[#C59B27] text-[#0F2B1D] font-extrabold text-xs">
                  Score: {selectedLead.score}/100
                </span>
                <button
                  onClick={() => setIsDetailDrawerOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-1">
              {[
                { id: 'details', label: 'Lead Details & Edit', icon: Edit3 },
                { id: 'activities', label: `Audit & History (${activityLogs.length})`, icon: History },
                { id: 'outreach', label: 'Solomon AI Outreach', icon: Sparkles }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = drawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#0F2B1D] text-[#D4AF37] shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">

              {/* TAB 1: MANUAL DETAILS EDIT FORM */}
              {drawerTab === 'details' && (
                <form onSubmit={handleSaveLeadEdit} className="space-y-4">
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Any field update or correction here will be automatically audited and logged with old vs new value timestamps.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">First Name</label>
                      <input
                        type="text"
                        value={editForm.first_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editForm.last_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                      />
                    </div>
                  </div>

                  {/* Contact Enrichment Inputs */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-xs font-bold text-[#0F2B1D] block mb-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#C59B27]" /> Contact Phone Number
                      </label>
                      <input
                        type="text"
                        value={editForm.contact_number || ''}
                        onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                        placeholder="e.g. +1 (555) 019-2831"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                      />
                      <span className="text-[10px] text-slate-400">Manual input field</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#0F2B1D] block mb-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#C59B27]" /> Direct Email Address
                      </label>
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="e.g. prospect@company.com"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0F2B1D]"
                      />
                      <span className="text-[10px] text-slate-400">Manual input field</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Company / Business Name</label>
                      <input
                        type="text"
                        value={editForm.company_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">Company Website</label>
                        {editForm.company_website && (
                          <a
                            href={editForm.company_website.startsWith('http') ? editForm.company_website : `https://${editForm.company_website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#0F2B1D] font-bold hover:underline flex items-center gap-1 bg-[#FDF8EC] px-2 py-0.5 rounded-md border border-[#C59B27]/30"
                          >
                            <Globe className="w-3 h-3 text-[#C59B27]" /> Visit Website <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={editForm.company_website || ''}
                          onChange={(e) => setEditForm({ ...editForm, company_website: e.target.value })}
                          placeholder="e.g. company.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-900 focus:outline-none font-mono"
                        />
                        {editForm.company_website && (
                          <a
                            href={editForm.company_website.startsWith('http') ? editForm.company_website : `https://${editForm.company_website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 p-1 text-[#0F2B1D] hover:bg-slate-200 rounded-lg transition"
                            title="Open website in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Job Title</label>
                    <input
                      type="text"
                      value={editForm.job_title || ''}
                      onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  {/* LinkedIn Profile URL - Fully Clickable & Editable */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-blue-600" /> Prospect LinkedIn Profile URL
                      </label>
                      {editForm.linkedin_url && (
                        <a
                          href={editForm.linkedin_url.startsWith('http') ? editForm.linkedin_url : `https://${editForm.linkedin_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition"
                        >
                          <Linkedin className="w-3 h-3" /> Open LinkedIn Profile <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={editForm.linkedin_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                        placeholder="e.g. linkedin.com/in/username"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-20 py-2 text-xs text-slate-900 focus:outline-none font-mono"
                      />
                      {editForm.linkedin_url && (
                        <a
                          href={editForm.linkedin_url.startsWith('http') ? editForm.linkedin_url : `https://${editForm.linkedin_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-1.5 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition"
                          title="Open LinkedIn in new tab"
                        >
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Company LinkedIn URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" /> Company LinkedIn Page
                      </label>
                      {editForm.company_linkedin && (
                        <a
                          href={editForm.company_linkedin.startsWith('http') ? editForm.company_linkedin : `https://${editForm.company_linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition"
                        >
                          <Linkedin className="w-3 h-3 text-blue-600" /> Company Page <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={editForm.company_linkedin || ''}
                        onChange={(e) => setEditForm({ ...editForm, company_linkedin: e.target.value })}
                        placeholder="e.g. linkedin.com/company/companyname"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-20 py-2 text-xs text-slate-900 focus:outline-none font-mono"
                      />
                      {editForm.company_linkedin && (
                        <a
                          href={editForm.company_linkedin.startsWith('http') ? editForm.company_linkedin : `https://${editForm.company_linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition"
                          title="Open Company LinkedIn in new tab"
                        >
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">City</label>
                      <input
                        type="text"
                        value={editForm.city || ''}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Region / State</label>
                      <input
                        type="text"
                        value={editForm.region_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, region_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">Country</label>
                      <input
                        type="text"
                        value={editForm.country_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, country_name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Pipeline Stage</label>
                    <select
                      value={editForm.status || 'new'}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Notes & Research Summary</label>
                    <textarea
                      rows={3}
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Add key insights, qualification notes, or action items..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  {/* Skills Cloud */}
                  {selectedLead.skills && selectedLead.skills.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-[#C59B27]" /> Core Skills ({selectedLead.skills.length})
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {selectedLead.skills.map((skill, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[10px] font-bold border border-slate-200 shadow-2xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Career Experience Chips */}
                  {selectedLead.experience && selectedLead.experience.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-purple-600" /> Career History ({selectedLead.experience.length})
                      </label>
                      <div className="space-y-1 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700">
                        {selectedLead.experience.map((exp, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-[#C59B27]">●</span> {exp}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="px-5 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 transition border border-[#C59B27]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#C59B27]" />
                      {savingEdit ? 'Auditing & Saving...' : 'Save & Record Corrections in Audit'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: AUDIT TRAIL & ACTIVITY HISTORY */}
              {drawerTab === 'activities' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-4 h-4 text-[#0F2B1D]" /> Comprehensive Audit & Communication Trail
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">{activityLogs.length} Events</span>
                  </div>

                  {activityLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                      No logged activities yet. Make a call or update details to record history.
                    </div>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {activityLogs.map((log) => {
                        const isImport = log.type === 'import';
                        const isUpdate = log.type === 'field_update';
                        const isStatus = log.type === 'status_change';
                        const isCall = log.type === 'call';
                        const isEmail = log.type === 'email';
                        const isWhatsApp = log.type === 'whatsapp';

                        return (
                          <div key={log.id} className="relative pl-9 space-y-1">
                            {/* Icon Marker */}
                            <div className={`w-8 h-8 rounded-full absolute left-0 top-0 flex items-center justify-center text-xs font-bold shadow-xs border ${
                              isImport ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              isUpdate ? 'bg-amber-100 text-amber-800 border-amber-300' :
                              isStatus ? 'bg-purple-100 text-purple-800 border-purple-300' :
                              isCall ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              isEmail ? 'bg-sky-100 text-sky-800 border-sky-300' :
                              'bg-green-100 text-green-800 border-green-300'
                            }`}>
                              {isImport && <Upload className="w-3.5 h-3.5" />}
                              {isUpdate && <Edit3 className="w-3.5 h-3.5" />}
                              {isStatus && <ArrowUpDown className="w-3.5 h-3.5" />}
                              {isCall && <PhoneCall className="w-3.5 h-3.5" />}
                              {isEmail && <Mail className="w-3.5 h-3.5" />}
                              {isWhatsApp && <MessageSquare className="w-3.5 h-3.5" />}
                            </div>

                            {/* Content Card */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                                <span className="font-bold text-slate-800">{log.summary}</span>
                                <span>{new Date(log.created_at).toLocaleString()}</span>
                              </div>

                              {log.content && (
                                <p className="text-slate-600 font-mono text-[11px] bg-white p-2 rounded border border-slate-100">
                                  {log.content}
                                </p>
                              )}

                              {log.field_name && (
                                <div className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-100 space-y-0.5">
                                  <div>Field: <strong className="text-slate-900">{log.field_name}</strong></div>
                                  <div className="text-red-600">Old: "{log.old_value}"</div>
                                  <div className="text-emerald-700 font-bold">New: "{log.new_value}"</div>
                                </div>
                              )}

                              <div className="text-[10px] text-slate-400 font-medium">
                                Performed by: <strong className="text-slate-600">{log.performed_by || 'Agent'}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SOLOMON AI OUTREACH ASSISTANT */}
              {drawerTab === 'outreach' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-[#FDF8EC] to-[#F7F3E3] rounded-2xl border border-[#C59B27]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-[#0F2B1D] text-xs">
                        <Sparkles className="w-4 h-4 text-[#C59B27]" /> Solomon AI Cold Outreach Generator
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0F2B1D] text-[#C59B27] font-bold">
                        Claude 3.5 Sonnet RAG
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      Automatically creates high-converting outreach pitches tailored to {selectedLead.full_name}'s job as {selectedLead.job_title} at {selectedLead.company_name}.
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateAIPitch('email')}
                        disabled={isGeneratingPitch}
                        className="flex-1 py-2 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#C59B27]" /> Generate Email
                      </button>
                      <button
                        onClick={() => handleGenerateAIPitch('whatsapp')}
                        disabled={isGeneratingPitch}
                        className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Generate WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Generated Subject & Body */}
                  {emailSubject && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Generated Subject Line</label>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900">
                          <span className="flex-1">{emailSubject}</span>
                          <button onClick={() => copyToClipboard(emailSubject, 'subj')} className="text-slate-400 hover:text-slate-700">
                            {copiedId === 'subj' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Generated Email Pitch</label>
                        <div className="relative">
                          <textarea
                            rows={8}
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-sans leading-relaxed focus:outline-none"
                          />
                          <button
                            onClick={() => copyToClipboard(emailBody, 'body')}
                            className="absolute top-2.5 right-2.5 p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 shadow-xs"
                            title="Copy Pitch"
                          >
                            {copiedId === 'body' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setCommModal({ isOpen: true, type: 'email', lead: selectedLead });
                        }}
                        className="w-full py-2.5 bg-[#0F2B1D] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
                      >
                        <Send className="w-3.5 h-3.5 text-[#C59B27]" /> Log and Deliver Email Interaction
                      </button>
                    </div>
                  )}

                  {whatsappMsg && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Generated WhatsApp Message</label>
                        <div className="relative">
                          <textarea
                            rows={5}
                            value={whatsappMsg}
                            onChange={(e) => setWhatsappMsg(e.target.value)}
                            className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 text-xs text-slate-900 font-sans leading-relaxed focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setCommModal({ isOpen: true, type: 'whatsapp', lead: selectedLead });
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Launch WhatsApp & Log Interaction
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. OMNICHANNEL LOGGING MODAL (CALL / EMAIL / WHATSAPP) */}
      {/* ========================================================================= */}
      {commModal.isOpen && commModal.lead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#0F2B1D] to-[#153B27] text-white flex items-center justify-between border-b border-[#C59B27]">
              <div className="flex items-center gap-2.5">
                {commModal.type === 'call' && <PhoneCall className="w-5 h-5 text-[#C59B27]" />}
                {commModal.type === 'email' && <Mail className="w-5 h-5 text-[#C59B27]" />}
                {commModal.type === 'whatsapp' && <MessageSquare className="w-5 h-5 text-[#C59B27]" />}
                <div>
                  <h3 className="text-base font-bold capitalize">Log {commModal.type} Communication</h3>
                  <div className="text-xs text-slate-300">With {commModal.lead.full_name} ({commModal.lead.company_name})</div>
                </div>
              </div>
              <button 
                onClick={() => setCommModal({ isOpen: false, type: 'call', lead: null })}
                className="text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CALL FORM */}
            {commModal.type === 'call' && (
              <form onSubmit={handleLogCall} className="p-6 space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Target Phone:</span>
                  <strong className="font-mono text-slate-900">{commModal.lead.contact_number || 'Missing Phone (Log call manually)'}</strong>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Call Outcome</label>
                    <select
                      value={callOutcome}
                      onChange={(e) => setCallOutcome(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="connected">Connected / Spoke</option>
                      <option value="left_voicemail">Left Voicemail</option>
                      <option value="no_answer">No Answer</option>
                      <option value="busy">Line Busy</option>
                      <option value="wrong_number">Wrong Number</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      value={callDuration}
                      onChange={(e) => setCallDuration(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Call Discussion Summary</label>
                  <textarea
                    rows={3}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Discussed requirements, objection handling, demo booked for next Tuesday..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCommModal({ isOpen: false, type: 'call', lead: null })}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0F2B1D] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C59B27]" /> Save Call Record
                  </button>
                </div>
              </form>
            )}

            {/* EMAIL FORM */}
            {commModal.type === 'email' && (
              <form onSubmit={handleLogEmail} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={commModal.lead.email || ''}
                    placeholder="lead@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject line..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Email Body Content</label>
                  <textarea
                    rows={6}
                    required
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 leading-relaxed focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCommModal({ isOpen: false, type: 'email', lead: null })}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0F2B1D] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4 text-[#C59B27]" /> Log Email Sent
                  </button>
                </div>
              </form>
            )}

            {/* WHATSAPP FORM */}
            {commModal.type === 'whatsapp' && (
              <form onSubmit={handleLogWhatsApp} className="p-6 space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-900">WhatsApp Phone:</span>
                  <strong className="font-mono text-emerald-950">{commModal.lead.contact_number || 'Missing Phone'}</strong>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">WhatsApp Message</label>
                  <textarea
                    rows={5}
                    required
                    value={whatsappMsg}
                    onChange={(e) => setWhatsappMsg(e.target.value)}
                    placeholder="Hi! I wanted to reach out regarding..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 leading-relaxed focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCommModal({ isOpen: false, type: 'whatsapp', lead: null })}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" /> Open WhatsApp & Log
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
