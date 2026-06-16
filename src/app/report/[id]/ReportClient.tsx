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
  AlertTriangle, 
  ShieldCheck, 
  Briefcase,
  Layers,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { generateGmailReportHtml } from '../../utils/emailTemplate';
import { ReportPayload, processReport } from '../../utils/reportEngine';

export default function ReportClient() {
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
        <span className="text-sm">Fetching report data...</span>
      </div>
    );
  }

  if (!report) return null;

  const reportTitle = report.features_data?.title || 'Executive Status Report';
  const features = Array.isArray(report.features_data) 
    ? report.features_data 
    : (report.features_data?.features || []);

  const payload = processReport(
    features,
    report.tasks_data || [],
    [...(report.risks_data || []), ...(report.issues_data || [])],
    report.highlights || []
  );
  const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate Email HTML
  const emailHtml = generateGmailReportHtml(id, reportTitle, formattedDate, payload);

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

  const CHART_COLORS = ['#1e3a8a', '#2563eb', '#0284c7', '#0d9488', '#059669', '#4f46e5'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
            title="Back to Dashboard"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {reportTitle}
            </h1>
            <p className="text-slate-500 text-xs mt-1">Compiled on {formattedDate}</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl border border-slate-200 shrink-0">
          <button 
            onClick={() => setActiveTab('interactive')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'interactive' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Interactive view
          </button>
          <button 
            onClick={() => setActiveTab('gmail')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'gmail' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Gmail Export View
          </button>
        </div>
      </header>

      {/* Conditional Tab Rendering */}
      {activeTab === 'interactive' ? (
        <div className="flex flex-col gap-6">
          
          {/* 1. Summary Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="corporate-card bg-white rounded-xl p-5 border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Features Completed</div>
              <div className="text-2xl md:text-3xl font-black text-green-600 mt-1">{payload.stats.completionPercentage}%</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{payload.stats.completedFeatures} of {payload.stats.totalFeatures} Features</div>
            </div>

            {/* KPI 2 */}
            <div className="corporate-card bg-white rounded-xl p-5 border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">In Progress</div>
              <div className="text-2xl md:text-3xl font-black text-blue-900 mt-1">{payload.stats.inProgressFeatures}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Capabilities Active</div>
            </div>

            {/* KPI 3 */}
            <div className="corporate-card bg-white rounded-xl p-5 border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Not Started</div>
              <div className="text-2xl md:text-3xl font-black text-slate-655 mt-1">{payload.stats.notPickedUpFeatures}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Capabilities Pending</div>
            </div>

            {/* KPI 4 */}
            <div className="corporate-card bg-white rounded-xl p-5 border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Risks</div>
              <div className="text-2xl md:text-3xl font-black text-red-655 mt-1">{payload.openRisks.length}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Mitigated: {payload.mitigatedRisks.length} Items</div>
            </div>
          </div>

          {/* 2. Charts & Sprints Column Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Web Recharts & Sprints (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Outcome Bar Chart */}
              <div className="corporate-card bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                  <Briefcase className="h-4.5 w-4.5 text-blue-900" />
                  Capabilities by Business Outcome
                </h3>
                
                <div className="h-64 w-full">
                  {payload.goalChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={payload.goalChartData}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} />
                        <YAxis 
                          type="category" 
                          dataKey="goal" 
                          stroke="#475569" 
                          fontSize={11} 
                          tickLine={false} 
                          width={110} 
                        />
                        <Tooltip
                          contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                          labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                          {payload.goalChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No Goal parameters aggregated.</div>
                  )}
                </div>
              </div>

              {/* Sprint Progress trackers */}
              <div className="corporate-card bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-blue-900" />
                  Sprint Completion Progress
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payload.sprintProgress.map(s => (
                    <div key={s.sprint} className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>{s.sprint}</span>
                        <span className="text-blue-900">{s.percentage}% ({s.completed}/{s.total})</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300">
                        <div 
                          className="bg-blue-900 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${s.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {payload.sprintProgress.length === 0 && (
                    <div className="col-span-2 text-center text-slate-400 text-xs italic py-4">No Sprint information tagged.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Highlights & Risks sidebar (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Highlights */}
              <div className="corporate-card bg-blue-50/20 rounded-xl p-6 border border-blue-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-blue-900" />
                  Executive Highlights
                </h3>
                <ul className="list-disc pl-4 flex flex-col gap-2.5 text-xs text-slate-700 font-medium">
                  {payload.highlights.map((h, i) => (
                    <li key={i} className="line-clamp-4 leading-relaxed">{h}</li>
                  ))}
                  {payload.highlights.length === 0 && (
                    <li className="italic text-slate-400 list-none">No highlights added.</li>
                  )}
                </ul>
              </div>

              {/* Risks Panel */}
              <div className="corporate-card bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                  Risks & Issues Logs
                </h3>

                <div className="flex flex-col gap-4">
                  {/* Open Risks */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-red-650 mb-2">Top Open Risks</h4>
                    <div className="flex flex-col gap-2">
                      {payload.openRisks.map(r => {
                        const descText = r.description || r.Description || '';
                        return (
                          <div key={r.Nbr} className="p-3 bg-red-50/50 border border-red-100 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start text-xs font-bold text-slate-900 mb-1">
                              <span>#{r.Nbr} - {descText.length > 25 ? descText.substring(0, 25) + '...' : descText}</span>
                              <span className="text-[9px] uppercase bg-red-100 text-red-800 px-1.5 py-0.5 rounded-md border border-red-200 font-bold">Open</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-normal line-clamp-2">{descText}</p>
                          </div>
                        );
                      })}
                      {payload.openRisks.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No active open risks.</span>
                      )}
                    </div>
                  </div>

                  {/* Mitigated Risks */}
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-green-650 mb-2">Top Mitigated Risks</h4>
                    <div className="flex flex-col gap-2">
                      {payload.mitigatedRisks.map(r => {
                        const descText = r.description || r.Description || '';
                        return (
                          <div key={r.Nbr} className="p-3 bg-green-50/50 border border-green-100 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start text-xs font-bold text-slate-900 mb-1">
                              <span>#{r.Nbr} - {descText.length > 25 ? descText.substring(0, 25) + '...' : descText}</span>
                              <span className="text-[9px] uppercase bg-green-100 text-green-800 px-1.5 py-0.5 rounded-md border border-green-200 font-bold">Mitigated</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-normal line-clamp-2">{r.Comments || 'Mitigated successfully.'}</p>
                          </div>
                        );
                      })}
                      {payload.mitigatedRisks.length === 0 && (
                        <span className="text-xs text-slate-400 italic">No mitigated risks.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* 3. Mapped Features Grid Table */}
          <div className="corporate-card bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-blue-900" />
                Capabilities & Status Details
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                <Info className="h-3.5 w-3.5 text-blue-900" />
                <span>Double-click any capability row to inspect nested task items.</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">DevRev ID</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Feature Name</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Goal Outcome</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider">Sprint</th>
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.features.map((f) => (
                    <tr 
                      key={f['Part id']} 
                      onDoubleClick={() => setSelectedFeature(f)}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-all cursor-pointer group select-none"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-500 group-hover:text-blue-900 transition-colors">{f.devRevId || f['Part id']}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-900 transition-colors">{f.Name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{f['Owner[0]']}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{f['Goal[0]'] || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{f['Tags[0]'] || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-right">
                        {f.status === 'Completed' && (
                          <span className="inline-flex items-center text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Completed</span>
                        )}
                        {f.status === 'In Progress' && (
                          <span className="inline-flex items-center text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">In Progress</span>
                        )}
                        {f.status === 'Not Picked Up' && (
                          <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">Not Started</span>
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
        <div className="flex flex-col gap-4">
          
          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-650 flex items-center gap-1.5">
              <Mail className="h-4.5 w-4.5 text-blue-900" />
              <span>Copy report as a formatted table directly into your email composer.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRich}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {copiedRich ? <Check className="h-3.5 w-3.5 text-green-300" /> : <Mail className="h-3.5 w-3.5" />}
                {copiedRich ? 'Copied! Ready to Paste' : 'Copy Rich Report'}
              </button>

              <button
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-650 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                {copiedHtml ? <Check className="h-3.5 w-3.5 text-green-700" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedHtml ? 'HTML Copied!' : 'Copy Raw HTML'}
              </button>
            </div>
          </div>

          {copiedRich && (
            <div className="bg-green-50 border border-green-250 text-green-800 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span><strong>Ready to Paste:</strong> Go to your email composer (Gmail, Outlook, Mac Mail) and press <strong>Cmd+V / Ctrl+V</strong>.</span>
            </div>
          )}

          {/* Iframe Viewport Sandbox for HTML Email */}
          <div className="corporate-card bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative min-h-[600px] flex flex-col shadow-inner">
            <div className="w-full flex-grow p-4 flex justify-center items-stretch">
              <iframe 
                srcDoc={emailHtml}
                title="Email Dashboard Live View"
                className="w-full max-w-[600px] border border-slate-200 rounded-lg bg-white shadow-md min-h-[600px] flex-grow"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

        </div>
      )}

      {/* 4. MODAL DRAWER: Nested Tasks List (Active on double-clicking feature) */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end animate-fade-in">
          
          <div className="absolute inset-0" onClick={() => setSelectedFeature(null)}></div>

          {/* Sliding Panel */}
          <div className="bg-white border-l border-slate-200 w-full max-w-2xl h-full shadow-2xl z-10 flex flex-col p-6 relative animate-slide-in-right overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-250 pb-4 mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  Capability Detail: {selectedFeature.devRevId || selectedFeature['Part id']}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1 leading-snug tracking-tight">
                  {selectedFeature.Name}
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-xs mt-1 font-medium">
                  <span>Owner: <strong>{selectedFeature['Owner[0]']}</strong></span>
                  <span>Goal: <strong>{selectedFeature['Goal[0]'] || 'N/A'}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-1.5 hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Task list table */}
            <div className="flex-grow overflow-y-auto min-h-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-900" />
                Nested Sub-tasks ({selectedFeature.tasks?.length || 0} items)
              </h4>

              {selectedFeature.tasks && selectedFeature.tasks.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-slate-50/50 shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider">ID</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider">Task Title</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider">Owner</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider">Target Date</th>
                        <th className="py-2.5 px-4 font-bold text-slate-500 uppercase tracking-wider text-right">Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFeature.tasks.map((task: any) => {
                        const isClosed = task.Stage?.toLowerCase() === 'closed' || task.Stage?.toLowerCase() === 'approved';
                        const isOpen = task.Stage?.toLowerCase() === 'open';

                        return (
                          <tr key={task.Items} className="border-b border-slate-100 hover:bg-white transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500">{task.Items}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{task.Title}</td>
                            <td className="py-3 px-4 text-slate-600 font-medium">{task['Owner[0]']}</td>
                            <td className="py-3 px-4 text-slate-500">{task['Target Close Date'] || 'N/A'}</td>
                            <td className="py-3 px-4 text-right">
                              {isClosed && (
                                <span className="inline-flex items-center text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">Closed</span>
                              )}
                              {isOpen && (
                                <span className="inline-flex items-center text-[9px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200 font-bold">Open</span>
                              )}
                              {!isClosed && !isOpen && (
                                <span className="inline-flex items-center text-[9px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{task.Stage || 'In Progress'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-lg bg-slate-50">
                  No nested sub-tasks found mapping to this capability ID.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 border-t border-slate-200 pt-4 text-right">
              <button
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg transition-all cursor-pointer shadow-sm"
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
