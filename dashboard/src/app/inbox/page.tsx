'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { OnboardingModal } from '@/components/OnboardingModal';
import { 
  MessageSquare, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  ShieldAlert, 
  Check,
  Zap,
  CheckCheck
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [inputText, setInputText] = useState<string>('');
  const [typingPreview, setTypingPreview] = useState<string>('');
  const [copilotDraft, setCopilotDraft] = useState<string>('');
  const [draftMetadata, setDraftMetadata] = useState<any>(null);
  const [citations, setCitations] = useState<string[]>([]);
  const [isCopilotApprovalMode, setIsCopilotApprovalMode] = useState<boolean>(true);

  // Post-Signup Onboarding Popup State
  const [showOnboardingPopup, setShowOnboardingPopup] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if coming from sign up portal to show onboarding popup
    const popupFlag = localStorage.getItem('quadrace_show_onboarding_popup');
    if (popupFlag === 'true') {
      setShowOnboardingPopup(true);
    }
  }, []);

  const handleCloseOnboardingPopup = () => {
    localStorage.removeItem('quadrace_show_onboarding_popup');
    setShowOnboardingPopup(false);
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations?org_id=org-demo-123`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !selectedConv) {
          setSelectedConv(data.conversations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();

    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.emit('join_conversation', { orgId: 'org-demo-123' });

    socket.on('new_message', (msg: any) => {
      if (selectedConv && msg.conversation_id === selectedConv.id) {
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        setCopilotDraft('');
      }
      fetchConversations();
    });

    socket.on('copilot_draft_ready', ({ conversationId, copilotDraft, metadata, sourceCitations }: any) => {
      if (selectedConv && conversationId === selectedConv.id) {
        setCopilotDraft(copilotDraft);
        setDraftMetadata(metadata);
        setCitations(sourceCitations || []);
      }
    });

    socket.on('typing:preview', ({ conversationId, senderType, previewText, isTyping }: any) => {
      if (selectedConv && conversationId === selectedConv.id && senderType === 'visitor') {
        if (isTyping && previewText) {
          setTypingPreview(previewText);
        } else {
          setTypingPreview('');
        }
      }
    });

    socket.on('copilot_mode:updated', ({ conversationId, copilotMode }: any) => {
      if (selectedConv && conversationId === selectedConv.id) {
        setIsCopilotApprovalMode(copilotMode);
      }
    });

    socket.on('conversation_updated', () => {
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedConv]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      if (selectedConv.copilot_mode !== undefined) {
        setIsCopilotApprovalMode(selectedConv.copilot_mode);
      }
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', { conversationId: selectedConv.id, orgId: 'org-demo-123' });
      }
    }
  }, [selectedConv]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleCopilotMode = (mode: boolean) => {
    setIsCopilotApprovalMode(mode);
    if (selectedConv && socketRef.current) {
      socketRef.current.emit('copilot_mode:toggle', {
        conversationId: selectedConv.id,
        orgId: 'org-demo-123',
        copilotMode: mode
      });
    }
  };

  const handleTakeoverToggle = (action: 'takeover' | 'release' | 'close') => {
    if (!selectedConv || !socketRef.current) return;

    socketRef.current.emit('human_takeover', {
      conversationId: selectedConv.id,
      orgId: 'org-demo-123',
      agentId: 'usr-agent-1',
      action
    });

    setSelectedConv((prev: any) => ({
      ...prev,
      status: action === 'takeover' ? 'human_active' : action === 'release' ? 'ai_handled' : 'closed'
    }));
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedConv || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      conversationId: selectedConv.id,
      orgId: 'org-demo-123',
      senderType: 'human_agent',
      text: inputText
    });

    setInputText('');
  };

  const handleApproveAndSendDraft = () => {
    if (!copilotDraft || !selectedConv || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      conversationId: selectedConv.id,
      orgId: 'org-demo-123',
      senderType: 'solomon_ai',
      text: copilotDraft,
      metadata: draftMetadata
    });

    setCopilotDraft('');
    setDraftMetadata(null);
  };

  const applyCopilotDraftToInput = () => {
    if (copilotDraft) {
      setInputText(copilotDraft);
    }
  };

  const filteredConvs = conversations.filter(c => {
    if (activeFilter === 'all') return true;
    return c.status === activeFilter;
  });

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col relative">
      
      {/* Onboarding Popup Modal */}
      <OnboardingModal isOpen={showOnboardingPopup} onClose={handleCloseOnboardingPopup} />

      {/* Top Bar with Responsive Wrap & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {[
            { id: 'all', label: 'All Conversations', icon: MessageSquare },
            { id: 'ai_handled', label: 'Handled by Solomon AI', icon: Bot },
            { id: 'pending_transfer', label: 'Needs Transfer', icon: AlertCircle, color: 'text-amber-600' },
            { id: 'human_active', label: 'Assigned to Me', icon: UserCheck, color: 'text-emerald-700' },
            { id: 'closed', label: 'Closed', icon: CheckCircle2 }
          ].map(f => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#0F2B1D] text-white shadow-md shadow-[#0F2B1D]/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${f.color || ''}`} />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* SOLOMON COPILOT MODE TOGGLE SWITCH */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 shrink-0">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-[#C59B27] shrink-0" /> Mode:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => handleToggleCopilotMode(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition ${
                isCopilotApprovalMode
                  ? 'bg-[#0F2B1D] text-[#D4AF37] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5 shrink-0" /> Approval Mode
            </button>
            <button
              onClick={() => handleToggleCopilotMode(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 whitespace-nowrap transition ${
                !isCopilotApprovalMode
                  ? 'bg-[#0F2B1D] text-emerald-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" /> Automated
            </button>
          </div>
        </div>
      </div>

      {/* Main Omnichannel Workspace */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* Left Column: Conversations List (350px width) */}
        <div className="w-[340px] bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shrink-0 shadow-xs">
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Conversations ({filteredConvs.length})</span>
            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span> Live Sync
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No conversations match filter.</div>
            ) : (
              filteredConvs.map(conv => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#FDF8EC] border-l-4 border-[#C59B27]'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{conv.visitor_name || 'Anonymous Visitor'}</span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 truncate">
                        ID: {conv.visitor_id}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase shrink-0 whitespace-nowrap ${
                        conv.status === 'ai_handled' ? 'bg-[#0F2B1D]/10 text-[#0F2B1D] border border-[#0F2B1D]/20' :
                        conv.status === 'pending_transfer' ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
                        conv.status === 'human_active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {conv.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Feed & Copilot Approval Bar */}
        {selectedConv ? (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-xs min-w-0">
            
            {/* Conversation Header */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#0F2B1D] text-white flex items-center justify-center font-bold text-xs border border-[#C59B27] shrink-0">
                  {selectedConv.visitor_name ? selectedConv.visitor_name.substring(0, 2).toUpperCase() : 'VIS'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 truncate">{selectedConv.visitor_name}</h2>
                    <span className="text-xs font-semibold text-slate-400 shrink-0">({selectedConv.channel})</span>
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 font-medium">
                    <span>ID: {selectedConv.visitor_id}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      Mode: {isCopilotApprovalMode ? '✍️ Approval Based' : '🤖 Fully Automated'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {selectedConv.status === 'human_active' ? (
                  <button
                    onClick={() => handleTakeoverToggle('release')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition whitespace-nowrap"
                  >
                    <Bot className="w-3.5 h-3.5 text-[#0F2B1D] shrink-0" /> Resume Solomon AI
                  </button>
                ) : (
                  <button
                    onClick={() => handleTakeoverToggle('takeover')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0F2B1D] hover:bg-[#153B27] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition border border-[#C59B27] whitespace-nowrap"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-[#C59B27] shrink-0" /> Interrupt & Takeover
                  </button>
                )}

                <button
                  onClick={() => handleTakeoverToggle('close')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-xs font-bold border border-slate-200 transition whitespace-nowrap"
                >
                  Close Chat
                </button>
              </div>
            </div>

            {/* Message Feed Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAF8]">
              {messages.map((msg) => {
                const isVisitor = msg.sender_type === 'visitor';
                const isSolomon = msg.sender_type === 'solomon_ai';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isVisitor ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 font-medium">
                      {isSolomon ? (
                        <>
                          <Bot className="w-3 h-3 text-[#C59B27] shrink-0" />
                          <span className="font-bold text-[#0F2B1D]">Solomon AI</span>
                        </>
                      ) : isVisitor ? (
                        <>
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-600">{selectedConv.visitor_name}</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-bold text-emerald-800">Human Agent (You)</span>
                        </>
                      )}
                      <span>• {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed break-words ${
                        isVisitor
                          ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200 shadow-xs'
                          : isSolomon
                          ? 'bg-[#0F2B1D] text-white rounded-tr-sm border border-[#C59B27]/40 shadow-xs'
                          : 'bg-emerald-700 text-white rounded-tr-sm border border-emerald-800 shadow-xs'
                      }`}
                    >
                      {msg.text}

                      {msg.metadata?.type === 'product_recommendations' && (
                        <div className="mt-2.5 pt-2 border-t border-white/20 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Attached Product Recommendations</span>
                          {msg.metadata.products.map((p: any) => (
                            <div key={p.id} className="flex items-center gap-2 bg-white/10 backdrop-blur-xs p-2 rounded-lg border border-white/10">
                              <img src={p.image_url} className="w-10 h-10 rounded object-cover shrink-0" />
                              <div className="min-w-0">
                                <div className="font-bold text-white text-[11px] truncate">{p.title}</div>
                                <div className="text-[#E6C280] font-extrabold text-[10px]">{p.price}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.metadata?.type === 'order_status_card' && (
                        <div className="mt-2.5 pt-2 border-t border-white/20 bg-white/10 p-2.5 rounded-lg border border-white/10 space-y-1">
                          <span className="text-[10px] font-extrabold text-[#D4AF37]">ORDER TRACKING PAYLOAD</span>
                          <div className="font-bold text-white text-[11px]">Order #{msg.metadata.order_number}</div>
                          <div className="text-slate-200 text-[10px]">{msg.metadata.carrier} ({msg.metadata.tracking_code})</div>
                          <div className="text-[#E6C280] font-semibold text-[10px]">Est. Delivery: {msg.metadata.estimated_delivery}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* LIVE TYPING PREVIEW BANNER */}
            {typingPreview && (
              <div className="px-4 py-2 bg-[#FDF8EC] border-t border-[#C59B27]/40 flex items-center gap-2 text-xs text-[#0F2B1D] animate-pulse font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                <span className="font-bold shrink-0">Live Visitor Typing:</span>
                <span className="italic font-mono text-slate-800 text-[11px] truncate">"{typingPreview}"</span>
              </div>
            )}

            {/* SOLOMON COPILOT APPROVAL DRAFT BAR */}
            {copilotDraft && isCopilotApprovalMode && (
              <div className="px-4 py-3 bg-[#FDF8EC] border-t border-[#C59B27] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <Sparkles className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0F2B1D] flex flex-wrap items-center gap-2">
                      <span>Solomon Copilot Draft Ready for Approval</span>
                      {citations.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C59B27]/20 text-[#0F2B1D] border border-[#C59B27]/40 font-bold shrink-0">
                          Source: {citations[0]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-800 font-medium line-clamp-2 mt-0.5 bg-white p-2 rounded border border-[#C59B27]/30 break-words">"{copilotDraft}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={applyCopilotDraftToInput}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 transition whitespace-nowrap"
                  >
                    Edit Draft
                  </button>
                  <button
                    onClick={handleApproveAndSendDraft}
                    className="px-3.5 py-1.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-lg text-xs font-extrabold shadow-md flex items-center gap-1 transition whitespace-nowrap"
                  >
                    <Check className="w-3.5 h-3.5 text-[#C59B27] shrink-0" /> Approve & Send
                  </button>
                </div>
              </div>
            )}

            {/* Operator Input Box */}
            <div className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response or use Copilot auto-draft..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0F2B1D]"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2.5 bg-[#0F2B1D] hover:bg-[#153B27] text-white rounded-xl text-xs font-bold shadow-md shadow-[#0F2B1D]/20 flex items-center gap-1.5 transition shrink-0 whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5 text-[#C59B27] shrink-0" /> Send
              </button>
            </div>

          </div>
        ) : (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 text-xs shadow-xs">
            Select a conversation from the left to start live support.
          </div>
        )}

      </div>
    </div>
  );
}
