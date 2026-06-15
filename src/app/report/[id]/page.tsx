'use client';

import React, { useState, useEffect, startTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  ChevronLeft, 
  Loader2, 
  Copy, 
  Check, 
  Mail, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Briefcase,
  Layers,
  MapPin,
  Calendar,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { generateGmailReportHtml } from '../../utils/emailTemplate';
import { ReportPayload } from '../../utils/reportEngine';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  // Load States
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'interactive' | 'gmail'>('interactive');
  
  // Interactive Modal / Drawer State
  const [selectedFeature, setSelectedFeature] = useState<any>(null);

  // Copy states
  const [copiedRich, setCopiedRich] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Fetch Report Data from Supabase
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setReport(data);
      } catch (err) {
        console.error('Error fetching report details:', err);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReportData();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#090d16] text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <span className="text-sm">Fetching report data...</span>
      </div>
    );
  }

  if (!report) return null;

  const payload: ReportPayload = report.data;
  const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate Email HTML
  const emailHtml = generateGmailReportHtml(id, report.title, formattedDate, payload);

  // Copy Rich text for Gmail/Outlook
  const handleCopyRich = async () => {
    try {
      const htmlBlob = new Blob([emailHtml], { type: 'text/html' });
      const textBlob = new Blob([emailHtml], { type: 'text/plain' });

      const clipboardData = [
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ];

      await navigator.clipboard.write(clipboardData);
      setCopiedRich(true);
      setTimeout(() => setCopiedRich(false), 2500);
    } catch (err) {
      console.error('Rich copy failed:', err);
      // Fallback
      await navigator.clipboard.writeText(emailHtml);
      setCopiedRich(true);
      setTimeout(() => setCopiedRich(false), 2500);
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(emailHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch (err) {
      console.error('HTML code copy failed:', err);
    }
  };

  // Pre-configured custom chart colors
  const CHART_COLORS = ['#6366f1', '#ec4899', '#38bdf8', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto relative">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-900/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Back to Dashboard"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-pink-400 to-sky-400 bg-clip-text text-transparent">
              {report.title}
            </h1>
            <p className="text-slate-400 text-xs mt-1">Compiled on {formattedDate}</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button 
            onClick={() => setActiveTab('interactive')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'interactive' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Interactive view
          </button>
          <button 
            onClick={() => setActiveTab('gmail')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'gmail' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Gmail Export View
          </button>
        </div>
      </header>

      {/* Conditional Tab Rendering */}
      {activeTab === 'interactive' ? (
        <div className="flex flex-col gap-6 z-10">
          
          {/* 1. Summary Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Features Completed</div>
              <div className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">{payload.stats.completionPercentage}%</div>
              <div className="text-xs text-slate-400 mt-1">{payload.stats.completedFeatures} of {payload.stats.totalFeatures} Features</div>
            </div>

            {/* KPI 2 */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">In Progress</div>
              <div className="text-2xl md:text-3xl font-black text-indigo-400 mt-1">{payload.stats.inProgressFeatures}</div>
              <div className="text-xs text-slate-400 mt-1">Capabilities Active</div>
            </div>

            {/* KPI 3 */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Not Started</div>
              <div className="text-2xl md:text-3xl font-black text-yellow-500 mt-1">{payload.stats.notPickedUpFeatures}</div>
              <div className="text-xs text-slate-400 mt-1">Capabilities Not Picked Up</div>
            </div>

            {/* KPI 4 */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800/80 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Risks</div>
              <div className="text-2xl md:text-3xl font-black text-rose-500 mt-1">{payload.openRisks.length}</div>
              <div className="text-xs text-slate-400 mt-1">Mitigated: {payload.mitigatedRisks.length} Items</div>
            </div>
          </div>

          {/* 2. Charts & Sprints Column Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Web Recharts & Sprints (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Outcome Bar Chart */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
                  Capabilities by Business Outcome
                </h3>
                
                <div className="h-64 w-full">
                  {payload.goalChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={payload.goalChartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis 
                          type="category" 
                          dataKey="goal" 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickLine={false} 
                          width={110} 
                        />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                          labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                          {payload.goalChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">No Goal parameters aggregated.</div>
                  )}
                </div>
              </div>

              {/* Sprint Progress trackers */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-pink-400" />
                  Sprint Completion Progress
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payload.sprintProgress.map(s => (
                    <div key={s.sprint} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                        <span>{s.sprint}</span>
                        <span className="text-indigo-400">{s.percentage}% ({s.completed}/{s.total})</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-850">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${s.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {payload.sprintProgress.length === 0 && (
                    <div className="col-span-2 text-center text-slate-500 text-xs italic py-4">No Sprint information tagged.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Highlights & Risks sidebar (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Highlights */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800/80 bg-indigo-600/[0.02]">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-yellow-400" />
                  Executive Highlights
                </h3>
                <ul className="list-disc pl-4 flex flex-col gap-2.5 text-xs text-slate-300">
                  {payload.highlights.map((h, i) => (
                    <li key={i} className="line-clamp-4 leading-relaxed">{h}</li>
                  ))}
                  {payload.highlights.length === 0 && (
                    <li className="italic text-slate-500 list-none">No highlights added.</li>
                  )}
                </ul>
              </div>

              {/* Risks Panel */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                  Risks & Issues Logs
                </h3>

                <div className="flex flex-col gap-4">
                  {/* Open Risks */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-rose-400 mb-2">Top Open Risks</h4>
                    <div className="flex flex-col gap-2">
                      {payload.openRisks.map(r => (
                        <div key={r.Nbr} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                          <div className="flex justify-between items-start text-xs font-bold text-white mb-1">
                            <span>#{r.Nbr} - {r.Scope}</span>
                            <span className="text-[9px] uppercase bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-md border border-rose-500/20">Open</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">{r.Description}</p>
                        </div>
                      ))}
                      {payload.openRisks.length === 0 && (
                        <span className="text-xs text-slate-500 italic">No active open risks.</span>
                      )}
                    </div>
                  </div>

                  {/* Mitigated Risks */}
                  <div className="border-t border-slate-800/80 pt-4">
                    <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 mb-2">Top Mitigated Risks</h4>
                    <div className="flex flex-col gap-2">
                      {payload.openRisks.map(r => (
                        <div key={r.Nbr} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                          <div className="flex justify-between items-start text-xs font-bold text-white mb-1">
                            <span>#{r.Nbr} - {r.Scope}</span>
                            <span className="text-[9px] uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/20">Mitigated</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">{r.Comments || 'Mitigated successfully.'}</p>
                        </div>
                      ))}
                      {payload.mitigatedRisks.length === 0 && (
                        <span className="text-xs text-slate-500 italic">No mitigated risks.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* 3. Mapped Features Grid Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-indigo-400" />
                Capabilities & Status Details
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
                <Info className="h-3.5 w-3.5 text-indigo-400" />
                <span>Double-click any capability row to inspect nested task items.</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="py-3 px-4 font-semibold text-slate-400">ID</th>
                    <th className="py-3 px-4 font-semibold text-slate-400">Feature Name</th>
                    <th className="py-3 px-4 font-semibold text-slate-400">Owner</th>
                    <th className="py-3 px-4 font-semibold text-slate-400">Goal Outcome</th>
                    <th className="py-3 px-4 font-semibold text-slate-400">Sprint</th>
                    <th className="py-3 px-4 font-semibold text-slate-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.features.map((f) => (
                    <tr 
                      key={f['Part id']} 
                      onDoubleClick={() => setSelectedFeature(f)}
                      className="border-b border-slate-900 hover:bg-indigo-900/10 hover:border-indigo-900/30 transition-all cursor-pointer group select-none"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-400 group-hover:text-indigo-400 transition-colors">{f['Part id']}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{f.Name}</td>
                      <td className="py-3.5 px-4 text-slate-400">{f['Owner[0]']}</td>
                      <td className="py-3.5 px-4 text-slate-400">{f['Goal[0]'] || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-400">{f['Tags[0]'] || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-right">
                        {f.status === 'Completed' && (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/25">Completed</span>
                        )}
                        {f.status === 'In Progress' && (
                          <span className="inline-flex items-center text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full border border-indigo-400/25">In Progress</span>
                        )}
                        {f.status === 'Not Picked Up' && (
                          <span className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded-full border border-slate-500/20">Not Started</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* GMAIL EXPORT VIEW TAB */
        <div className="flex flex-col gap-4 z-10">
          
          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Mail className="h-4.5 w-4.5 text-pink-400" />
              <span>Copy report as a formatted table directly into your email composer.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRich}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 rounded-lg shadow-lg hover:shadow-indigo-500/10 active:scale-95 transition-all cursor-pointer"
              >
                {copiedRich ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Mail className="h-3.5 w-3.5" />}
                {copiedRich ? 'Copied! Ready to Paste' : 'Copy Rich Report'}
              </button>

              <button
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                {copiedHtml ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedHtml ? 'HTML Copied!' : 'Copy Raw HTML'}
              </button>
            </div>
          </div>

          {copiedRich && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 animate-pulse">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span><strong>Ready to Paste:</strong> Go to your email composer (Gmail, Outlook, Mac Mail) and press <strong>Cmd+V / Ctrl+V</strong>.</span>
            </div>
          )}

          {/* Iframe Viewport Sandbox for HTML Email */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 relative min-h-[600px] flex flex-col">
            <div className="w-full flex-grow bg-[#0b0f19] p-4 flex justify-center items-stretch">
              <iframe 
                srcDoc={emailHtml}
                title="Email Dashboard Live View"
                className="w-full max-w-[600px] border border-slate-850/80 rounded-xl bg-[#0f172a] shadow-inner min-h-[600px] flex-grow"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

        </div>
      )}

      {/* 4. MODAL DRAWER: Nested Tasks List (Active on double-clicking feature) */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end animate-fade-in">
          
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setSelectedFeature(null)}></div>

          {/* Sliding Panel */}
          <div className="bg-[#0f172a] border-l border-slate-800 w-full max-w-2xl h-full shadow-2xl z-10 flex flex-col p-6 relative animate-slide-in-right overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">
                  Capability Detail: {selectedFeature['Part id']}
                </span>
                <h3 className="text-lg font-black text-white mt-1 leading-normal">
                  {selectedFeature.Name}
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-400 text-xs mt-1">
                  <span>Owner: <strong>{selectedFeature['Owner[0]']}</strong></span>
                  <span>Goal: <strong>{selectedFeature['Goal[0]'] || 'N/A'}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-1.5 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Task list table */}
            <div className="flex-grow overflow-y-auto min-h-0">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-400" />
                Nested Sub-tasks ({selectedFeature.tasks?.length || 0} items)
              </h4>

              {selectedFeature.tasks && selectedFeature.tasks.length > 0 ? (
                <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-900/30">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/50">
                        <th className="py-2.5 px-4 font-semibold text-slate-400">ID</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-400">Task Title</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-400">Owner</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-400">Target Date</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-400 text-right">Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFeature.tasks.map((task: any) => {
                        const isClosed = task.Stage?.toLowerCase() === 'closed' || task.Stage?.toLowerCase() === 'approved';
                        const isOpen = task.Stage?.toLowerCase() === 'open';

                        return (
                          <tr key={task.Items} className="border-b border-slate-850/60 hover:bg-slate-850/20 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-400">{task.Items}</td>
                            <td className="py-3 px-4 font-medium text-slate-200">{task.Title}</td>
                            <td className="py-3 px-4 text-slate-400">{task['Owner[0]']}</td>
                            <td className="py-3 px-4 text-slate-400">{task['Target Close Date'] || 'N/A'}</td>
                            <td className="py-3 px-4 text-right">
                              {isClosed && (
                                <span className="inline-flex items-center text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">Closed</span>
                              )}
                              {isOpen && (
                                <span className="inline-flex items-center text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">Open</span>
                              )}
                              {!isClosed && !isOpen && (
                                <span className="inline-flex items-center text-[9px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-md border border-indigo-400/20">{task.Stage || 'In Progress'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs italic border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                  No nested sub-tasks found mapping to this capability ID.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 border-t border-slate-800 pt-4 text-right">
              <button
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
