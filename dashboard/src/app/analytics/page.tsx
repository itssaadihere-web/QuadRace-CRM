'use client';

import { 
  BarChart3, 
  TrendingUp, 
  Bot, 
  Users, 
  CheckCircle2, 
  Zap 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const chartData = [
  { day: 'Mon', aiChats: 120, humanTransfers: 14, gapsResolved: 8 },
  { day: 'Tue', aiChats: 185, humanTransfers: 18, gapsResolved: 12 },
  { day: 'Wed', aiChats: 240, humanTransfers: 22, gapsResolved: 15 },
  { day: 'Thu', aiChats: 290, humanTransfers: 19, gapsResolved: 18 },
  { day: 'Fri', aiChats: 380, humanTransfers: 25, gapsResolved: 24 },
  { day: 'Sat', aiChats: 420, humanTransfers: 29, gapsResolved: 30 },
  { day: 'Sun', aiChats: 510, humanTransfers: 31, gapsResolved: 35 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#0F2B1D]" /> Solomon AI Growth & Resolution Analytics
        </h1>
        <p className="text-xs text-slate-500 font-medium">Real-time performance metrics, resolution rates, and automated gap feedback loop stats.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { title: 'AI Resolution Rate', value: '94.2%', change: '+3.1%', icon: Bot, color: 'text-[#0F2B1D]' },
          { title: 'Avg Response Time', value: '0.42s', change: 'Instant RAG', icon: Zap, color: 'text-emerald-700' },
          { title: 'Human Transfers', value: '5.8%', change: '-2.4%', icon: Users, color: 'text-[#B8860B]' },
          { title: 'Gaps Auto-Resolved', value: '142', change: '1-Click Vector', icon: CheckCircle2, color: 'text-[#C59B27]' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{m.title}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div className="text-xl font-extrabold text-slate-900">{m.value}</div>
              <div className="text-[11px] font-bold text-emerald-700">{m.change}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0F2B1D]" /> Weekly Conversation Volume
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F2B1D" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0F2B1D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', fontSize: '12px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="aiChats" stroke="#0F2B1D" strokeWidth={2} fillOpacity={1} fill="url(#colorAi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C59B27]" /> Unanswered Gap Resolutions
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="gapsResolved" fill="#C59B27" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
