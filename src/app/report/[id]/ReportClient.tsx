'use client';

import React, { useState, useEffect } from 'react';
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
  Briefcase,
  Layers,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { generateGmailReportHtml } from '../../utils/emailTemplate';
import { processReport, MappedFeature } from '../../utils/reportEngine';
import { Report, deleteReportAction } from '@/app/actions/reportActions';

export default function ReportClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  // Load States
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'interactive' | 'gmail'>('interactive');
  
  // Interactive Modal / Drawer State
  const [selectedFeature, setSelectedFeature] = useState<MappedFeature | null>(null);

  // Copy states
  const [copiedRich, setCopiedRich] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Adjacent Report IDs
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);

  // Delete / Success Modals States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Risks / Issues modal visibility states
  const [showAllRisksModal, setShowAllRisksModal] = useState(false);
  const [showAllIssuesModal, setShowAllIssuesModal] = useState(false);

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
        const type = data.report_type || 'Product Grow report';
        setReport({ ...data, report_type: type });

        // Fetch previous report ID (older)
        const { data: prevData } = await supabase
          .from('reports')
          .select('id')
          .lt('created_at', data.created_at)
          .order('created_at', { ascending: false })
          .limit(1);
        
        // Fetch next report ID (newer)
        const { data: nextData } = await supabase
          .from('reports')
          .select('id')
          .gt('created_at', data.created_at)
          .order('created_at', { ascending: true })
          .limit(1);

        setPrevId(prevData && prevData.length > 0 ? prevData[0].id : null);
        setNextId(nextData && nextData.length > 0 ? nextData[0].id : null);
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F9FAFC] text-[#6F7C95]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3B42C4]" />
        <span className="text-sm">Fetching report data...</span>
      </div>
    );
  }

  if (!report) return null;

  const reportTitle = report.features_data?.title || 'Executive Status Report';
  const rawFeatures = Array.isArray(report.features_data) 
    ? report.features_data 
    : (report.features_data?.features || []);

  const getRagPriority = (status?: string) => {
    if (!status) return 4;
    const lower = status.toLowerCase();
    if (lower.includes('red')) return 1;
    if (lower.includes('amber')) return 2;
    if (lower.includes('green')) return 3;
    return 4;
  };

  const sortedFeatures = [...rawFeatures].sort((a, b) => {
    const priorityA = getRagPriority(a.ragStatus);
    const priorityB = getRagPriority(b.ragStatus);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return (a.Name || '').localeCompare(b.Name || '');
  });

  const payload = processReport(
    sortedFeatures,
    report.tasks_data || [],
    [
      ...(report.risks_data || []).map((r) => ({ ...r, type: r.type || 'Risk' })),
      ...(report.issues_data || []).map((i) => ({ ...i, type: i.type || 'Issue' }))
    ],
    report.highlights || []
  );
  const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate Email HTML
  const emailHtml = generateGmailReportHtml(id, reportTitle, formattedDate, payload, report);

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

  const confirmDeleteReport = async () => {
    try {
      const result = await deleteReportAction(id);
      if (result.error) throw new Error(result.error);

      // 2. Upon successful deletion
      setShowDeleteModal(false);
      setShowSuccessModal(true);

      // 3. Wait 2000ms, refresh router cache, and redirect to dashboard
      setTimeout(() => {
        router.refresh();
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error("Deletion failed:", err);
      setShowDeleteModal(false);
    }
  };

  const CHART_COLORS = ['#1e3a8a', '#2563eb', '#0284c7', '#0d9488', '#059669', '#4f46e5'];

  return (
    <div className="min-h-screen bg-[#F9FAFC] text-[#030522] p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E6E9EF] pb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-white border border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] rounded-md transition-all cursor-pointer shadow-sm"
            title="Back to Dashboard"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#030522] tracking-tight">
              {reportTitle}
            </h1>
            <p className="text-[#6F7C95] text-xs mt-1">Compiled on {formattedDate}</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex gap-1.5 bg-[#F9FAFC] p-1 rounded-md border border-[#E6E9EF] shrink-0">
          <button 
            onClick={() => setActiveTab('interactive')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${activeTab === 'interactive' ? 'bg-white text-[#030522] border border-[#E6E9EF] shadow-sm' : 'text-[#6F7C95] hover:text-[#030522]'}`}
          >
            Interactive view
          </button>
          <button 
            onClick={() => setActiveTab('gmail')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${activeTab === 'gmail' ? 'bg-white text-[#030522] border border-[#E6E9EF] shadow-sm' : 'text-[#6F7C95] hover:text-[#030522]'}`}
          >
            Gmail Export View
          </button>
        </div>
      </header>

      {/* Report Navigation Bar */}
      <div className="flex justify-between items-center bg-white border border-[#E6E9EF] px-4 py-3 rounded-lg shadow-sm -mt-2">
        <button
          onClick={() => prevId && router.push(`/report/${prevId}`)}
          disabled={!prevId}
          className={`px-4 py-2 text-xs font-bold border transition-all shadow-sm ${
            prevId 
              ? 'border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] cursor-pointer rounded-md' 
              : 'border-[#E6E9EF] text-[#6F7C95] opacity-50 bg-[#F9FAFC] cursor-not-allowed rounded-md'
          }`}
        >
          &larr; Previous Report
        </button>
        <button
          onClick={() => nextId && router.push(`/report/${nextId}`)}
          disabled={!nextId}
          className={`px-4 py-2 text-xs font-bold border transition-all shadow-sm ${
            nextId 
              ? 'border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] cursor-pointer rounded-md' 
              : 'border-[#E6E9EF] text-[#6F7C95] opacity-50 bg-[#F9FAFC] cursor-not-allowed rounded-md'
          }`}
        >
          Next Report &rarr;
        </button>
      </div>

      {activeTab === 'interactive' ? (
        <div className="flex flex-col gap-6">
          
          {/* 2. Executive Highlights (Full Width) */}
          <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-sm p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F7C95] mb-4 flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5 text-[#3B42C4]" />
              Executive Highlights
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-[#6F7C95] text-sm mt-4">
              {payload.highlights.map((h, i) => (
                <li key={i} className="leading-relaxed">{h}</li>
              ))}
              {payload.highlights.length === 0 && (
                <li className="italic text-[#6F7C95] list-none">No highlights added.</li>
              )}
            </ol>
          </div>

          {/* 1. Summary Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-sm p-5 text-center">
              <div className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">Sprint Progress</div>
              <div className="text-2xl md:text-3xl font-black text-green-600 mt-1">{payload.stats.completionPercentage}%</div>
              <div className="text-xs text-[#6F7C95] mt-1 font-medium">Average of {payload.stats.totalFeatures} Features</div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-sm p-5 text-center">
              <div className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">In Progress</div>
              <div className="text-2xl md:text-3xl font-black text-[#3B42C4] mt-1">{payload.stats.inProgressFeatures}</div>
              <div className="text-xs text-[#6F7C95] mt-1 font-medium">Capabilities Active</div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-sm p-5 text-center">
              <div className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">Not Started</div>
              <div className="text-2xl md:text-3xl font-black text-[#6F7C95] mt-1">{payload.stats.notPickedUpFeatures}</div>
              <div className="text-xs text-[#6F7C95] mt-1 font-medium">Capabilities Pending</div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-sm p-5 text-center">
              <div className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">Active Risks</div>
              <div className="text-2xl md:text-3xl font-black text-red-650 mt-1">{payload.openRisks.length}</div>
              <div className="text-xs text-[#6F7C95] mt-1 font-medium">Mitigated: {payload.mitigatedRisks.length} Items</div>
            </div>
          </div>

          {/* 3. Capabilities by Business Outcome (Full Width) */}
          <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-sm p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F7C95] mb-4 flex items-center gap-1.5">
              <Briefcase className="h-4.5 w-4.5 text-[#3B42C4]" />
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

          {/* 4. Risks & Issues Grid (Side-by-Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risks Panel */}
            <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F7C95] mb-4 flex items-center gap-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                Risks Log
              </h3>
              <div className="overflow-x-auto border border-[#E6E9EF] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E9EF]">
                      <th className="py-2.5 px-3 bg-[#F9FAFC] text-[#6F7C95] text-[10px] font-bold uppercase tracking-wider">Number</th>
                      <th className="py-2.5 px-3 bg-[#F9FAFC] text-[#6F7C95] text-[10px] font-bold uppercase tracking-wider">Description</th>
                      <th className="py-2.5 px-3 bg-[#F9FAFC] text-[#6F7C95] text-[10px] font-bold uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.risks_data || []).slice(0, 3).map((r) => {
                      const desc = r.Description || r.description || '';
                      const truncatedDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
                      return (
                        <tr key={r.Nbr} className="border-b border-[#E6E9EF] hover:bg-[#F9FAFC] transition-colors">
                          <td className="py-3 px-3 font-mono text-[#6F7C95]">#{r.Nbr}</td>
                          <td className="py-3 px-3 text-[#030522] font-medium" title={desc}>{truncatedDesc}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                              r.Status?.toLowerCase() === 'mitigated' || r.Status?.toLowerCase() === 'closed' || r.Status?.toLowerCase() === 'resolved'
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-red-700 bg-red-50 border-red-200'
                            }`}>
                              {r.Status || 'Open'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!report.risks_data || report.risks_data.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-[#6F7C95] italic">No active risks.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {report.risks_data && report.risks_data.length > 0 && (
                <button
                  onClick={() => setShowAllRisksModal(true)}
                  className="border border-[#E6E9EF] text-[#3B42C4] hover:bg-[#F9FAFC] w-full mt-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer text-center"
                >
                  View All Risks
                </button>
              )}
            </div>

            {/* Issues Panel */}
            <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F7C95] mb-4 flex items-center gap-1.5">
                <AlertTriangle className="h-4.5 w-4.5 text-[#3B42C4]" />
                Issues Log
              </h3>
              <div className="overflow-x-auto border border-[#E6E9EF] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E9EF]">
                      <th className="py-2.5 px-3 bg-[#F9FAFC] text-[#6F7C95] text-[10px] font-bold uppercase tracking-wider">Number</th>
                      <th className="py-2.5 px-3 bg-[#F9FAFC] text-[#6F7C95] text-[10px] font-bold uppercase tracking-wider">Description</th>
                      <th className="py-2.5 px-3 bg-[#F9FAFC] text-[#6F7C95] text-[10px] font-bold uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.issues_data || []).slice(0, 3).map((i) => {
                      const desc = i.Description || i.description || '';
                      const truncatedDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
                      return (
                        <tr key={i.Nbr} className="border-b border-[#E6E9EF] hover:bg-[#F9FAFC] transition-colors">
                          <td className="py-3 px-3 font-mono text-[#6F7C95]">#{i.Nbr}</td>
                          <td className="py-3 px-3 text-[#030522] font-medium" title={desc}>{truncatedDesc}</td>
                          <td className="py-3 px-3 text-right">
                            <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                              i.Status?.toLowerCase() === 'mitigated' || i.Status?.toLowerCase() === 'closed' || i.Status?.toLowerCase() === 'resolved'
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-red-700 bg-red-50 border-red-200'
                            }`}>
                              {i.Status || 'Open'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!report.issues_data || report.issues_data.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-[#6F7C95] italic">No active issues.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {report.issues_data && report.issues_data.length > 0 && (
                <button
                  onClick={() => setShowAllIssuesModal(true)}
                  className="border border-[#E6E9EF] text-[#3B42C4] hover:bg-[#F9FAFC] w-full mt-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer text-center"
                >
                  View All Issues
                </button>
              )}
            </div>
          </div>

          {/* 3. Mapped Features Grid Table */}
          <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6F7C95] flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-[#3B42C4]" />
                Capabilities & Status Details
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-[#030522] bg-[#F9FAFC] border border-[#E6E9EF] px-2.5 py-1.5 rounded-md">
                <Info className="h-3.5 w-3.5 text-[#3B42C4]" />
                <span>Double-click any capability row to inspect nested task items.</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E9EF]">
                    <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">DevRev ID</th>
                    <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">Feature Name</th>
                    <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">Owner</th>
                    <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">RAG Status</th>
                    <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">%age Complete</th>
                    <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.features.map((f) => (
                    <tr 
                      key={f['Part id']} 
                      onDoubleClick={() => setSelectedFeature(f)}
                      className="border-b border-[#E6E9EF] hover:bg-[#F9FAFC] transition-all cursor-pointer group select-none"
                    >
                      <td className="py-3.5 px-4 font-mono text-[#6F7C95] group-hover:text-[#3B42C4] transition-colors" onDoubleClick={(e) => e.stopPropagation()}>
                        {(f.devRevId || f['Part id']) ? (
                          <a 
                            href={`https://app.devrev.ai/lentra/parts/${f.devRevId || f['Part id']}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3B42C4] hover:underline font-medium"
                          >
                            {f.devRevId || f['Part id']}
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#030522] group-hover:text-[#3B42C4] transition-colors">{f.Name}</td>
                      <td className="py-3.5 px-4 text-[#6F7C95] font-medium">{f['Owner[0]']}</td>
                      <td className="py-3.5 px-4">
                        {f.ragStatus ? (
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            f.ragStatus.toLowerCase() === 'red' || f.ragStatus.toLowerCase() === 'r' ? 'text-red-700 bg-red-50 border-red-200' :
                            f.ragStatus.toLowerCase() === 'amber' || f.ragStatus.toLowerCase() === 'a' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                            f.ragStatus.toLowerCase() === 'green' || f.ragStatus.toLowerCase() === 'g' ? 'text-green-700 bg-green-50 border-green-200' :
                            'text-slate-700 bg-slate-50 border-slate-200'
                          }`}>
                            {f.ragStatus}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#6F7C95] font-medium">{f.percentageComplete !== undefined ? `${f.percentageComplete}%` : '0%'}</td>
                      <td className="py-3.5 px-4 text-[#6F7C95] font-medium whitespace-normal break-words min-w-[200px]" title={f.reason}>
                        {f.reason || 'N/A'}
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
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-lg border border-[#E6E9EF] shadow-sm">
            <div className="text-xs text-[#6F7C95] flex items-center gap-1.5">
              <Mail className="h-4.5 w-4.5 text-[#3B42C4]" />
              <span>Copy report as a formatted table directly into your email composer.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRich}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#3B42C4] hover:bg-[#3137A3] rounded-md shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {copiedRich ? <Check className="h-3.5 w-3.5 text-green-300" /> : <Mail className="h-3.5 w-3.5" />}
                {copiedRich ? 'Copied! Ready to Paste' : 'Copy Rich Report'}
              </button>

              <button
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] rounded-md active:scale-95 transition-all cursor-pointer bg-white"
              >
                {copiedHtml ? <Check className="h-3.5 w-3.5 text-green-700" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedHtml ? 'HTML Copied!' : 'Copy Raw HTML'}
              </button>
            </div>
          </div>

          {copiedRich && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-4 py-2.5 rounded-md flex items-center gap-2 shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span><strong>Ready to Paste:</strong> Go to your email composer (Gmail, Outlook, Mac Mail) and press <strong>Cmd+V / Ctrl+V</strong>.</span>
            </div>
          )}

          {/* Iframe Viewport Sandbox for HTML Email */}
          <div className="bg-white rounded-lg overflow-hidden border border-[#E6E9EF] relative min-h-[600px] flex flex-col shadow-sm">
            <div className="w-full flex-grow p-4 flex justify-center items-stretch">
              <iframe 
                srcDoc={emailHtml}
                title="Email Dashboard Live View"
                className="w-full max-w-[600px] border border-[#E6E9EF] rounded-md bg-white shadow-sm min-h-[600px] flex-grow"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

        </div>
      )}

      {/* Destructive Deletion Section */}
      <div className="border-t border-[#E6E9EF] pt-6 flex justify-end">
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 border border-red-250 hover:border-red-650 text-red-600 hover:bg-red-50 text-xs font-bold rounded-md transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          Delete Report
        </button>
      </div>

      {/* 4. MODAL DRAWER: Nested Tasks List (Active on double-clicking feature) */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-[#030522]/60 backdrop-blur-sm z-50 flex items-center justify-end animate-fade-in">
          
          <div className="absolute inset-0" onClick={() => setSelectedFeature(null)}></div>

          {/* Sliding Panel */}
          <div className="bg-white border-l border-[#E6E9EF] w-full max-w-2xl h-full shadow-2xl z-10 flex flex-col p-6 relative animate-slide-in-right overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-[#E6E9EF] pb-4 mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider font-mono">
                  Capability Detail: {selectedFeature.devRevId || selectedFeature['Part id']}
                </span>
                <h3 className="text-lg font-extrabold text-[#030522] mt-1 leading-snug tracking-tight">
                  {selectedFeature.Name}
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[#6F7C95] text-xs mt-1 font-medium">
                  <span>Owner: <strong>{selectedFeature['Owner[0]']}</strong></span>
                  <span>Goal: <strong>{selectedFeature['Goal[0]'] || 'N/A'}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="p-1.5 border border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] rounded-md transition-all cursor-pointer shadow-sm bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 border-b border-[#E6E9EF] pb-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">DevRev ID / Part ID</span>
                <span className="text-xs font-mono text-[#030522]">
                  {(selectedFeature.devRevId || selectedFeature['Part id']) ? (
                    <a 
                      href={`https://app.devrev.ai/lentra/parts/${selectedFeature.devRevId || selectedFeature['Part id']}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#3B42C4] hover:underline font-medium"
                    >
                      {selectedFeature.devRevId || selectedFeature['Part id']}
                    </a>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">RAG Status</span>
                <div>
                  {selectedFeature.ragStatus ? (
                    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedFeature.ragStatus.toLowerCase() === 'red' || selectedFeature.ragStatus.toLowerCase() === 'r' ? 'text-red-700 bg-red-50 border-red-200' :
                      selectedFeature.ragStatus.toLowerCase() === 'amber' || selectedFeature.ragStatus.toLowerCase() === 'a' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                      selectedFeature.ragStatus.toLowerCase() === 'green' || selectedFeature.ragStatus.toLowerCase() === 'g' ? 'text-green-700 bg-green-50 border-green-200' :
                      'text-slate-700 bg-slate-50 border-slate-200'
                    }`}>
                      {selectedFeature.ragStatus}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">N/A</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">Percentage Complete</span>
                <span className="text-xs font-bold text-[#030522]">{selectedFeature.percentageComplete !== undefined ? `${selectedFeature.percentageComplete}%` : '0%'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">Status (Calculated)</span>
                <div>
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    selectedFeature.status === 'Completed' ? 'text-green-700 bg-green-50 border-green-200' :
                    selectedFeature.status === 'In Progress' ? 'text-blue-800 bg-blue-50 border-blue-200' :
                    'text-[#6F7C95] bg-[#F9FAFC] border-[#E6E9EF]'
                  }`}>
                    {selectedFeature.status === 'Not Picked Up' ? 'Not Started' : selectedFeature.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">Sprint</span>
                <span className="text-xs text-[#030522] font-semibold">{selectedFeature.sprint || selectedFeature['Tags[0]'] || 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">Goal Outcome</span>
                <span className="text-xs text-[#030522] font-semibold">{selectedFeature.goalOutcome || selectedFeature['Goal[0]'] || 'N/A'}</span>
              </div>
            </div>

            {/* Larger Text Fields */}
            <div className="flex flex-col gap-4 mb-6 border-b border-[#E6E9EF] pb-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">Description / Theme</span>
                <p className="text-xs text-[#030522] leading-relaxed font-medium bg-[#F9FAFC] border border-[#E6E9EF] rounded-lg p-3">
                  {selectedFeature.description || selectedFeature['Theme[0]'] || 'No description provided.'}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-[#6F7C95] tracking-wider">Reason</span>
                <p className="text-xs text-[#030522] leading-relaxed font-medium bg-[#F9FAFC] border border-[#E6E9EF] rounded-lg p-3">
                  {selectedFeature.reason || 'No reasoning details logged.'}
                </p>
              </div>
            </div>

            {/* Task list table */}
            <div className="flex-grow overflow-y-auto min-h-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6F7C95] mb-3 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-[#3B42C4]" />
                Nested Sub-tasks ({selectedFeature.tasks?.length || 0} items)
              </h4>

              {selectedFeature.tasks && selectedFeature.tasks.length > 0 ? (
                <div className="overflow-x-auto border border-[#E6E9EF] rounded-lg bg-white shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E9EF]">
                        <th className="py-2.5 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">ID</th>
                        <th className="py-2.5 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">Part ID</th>
                        <th className="py-2.5 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">Task Title</th>
                        <th className="py-2.5 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">Owner</th>
                        <th className="py-2.5 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider">Target Date</th>
                        <th className="py-2.5 px-4 bg-[#F9FAFC] text-[#6F7C95] text-sm font-medium uppercase tracking-wider text-right">Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFeature.tasks.map((task) => {
                        const isClosed = task.Stage?.toLowerCase() === 'closed' || task.Stage?.toLowerCase() === 'approved';
                        const isOpen = task.Stage?.toLowerCase() === 'open';

                        return (
                          <tr key={task.Items} className="border-b border-[#E6E9EF] hover:bg-[#F9FAFC] transition-colors">
                            <td className="py-3 px-4 font-mono text-[#6F7C95]">
                              {(task.items || task.Items) ? (
                                <a
                                  href={`https://app.devrev.ai/lentra/works/${task.items || task.Items}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#3B42C4] hover:underline font-medium"
                                >
                                  {task.items || task.Items}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[#6F7C95]">
                              {(task.partId || task['Part-ID']) ? (
                                <a
                                  href={`https://app.devrev.ai/lentra/parts/${task.partId || task['Part-ID']}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#3B42C4] hover:underline font-medium"
                                >
                                  {task.partId || task['Part-ID']}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-[#030522]">{task.Title}</td>
                            <td className="py-3 px-4 text-[#6F7C95] font-medium">{task['Owner[0]']}</td>
                            <td className="py-3 px-4 text-[#6F7C95]">{task['Target Close Date'] || 'N/A'}</td>
                            <td className="py-3 px-4 text-right">
                              {isClosed && (
                                <span className="inline-flex items-center text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">Closed</span>
                              )}
                              {isOpen && (
                                <span className="inline-flex items-center text-[9px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200 font-bold">Open</span>
                              )}
                              {!isClosed && !isOpen && (
                                <span className="inline-flex items-center text-[9px] font-bold text-[#3B42C4] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{task.Stage || 'In Progress'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-[#6F7C95] text-xs italic border border-dashed border-[#E6E9EF] rounded-lg bg-[#F9FAFC]">
                  No nested sub-tasks found mapping to this capability ID.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 border-t border-[#E6E9EF] pt-4 text-right">
              <button
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 border border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] text-xs font-bold rounded-md transition-all cursor-pointer shadow-sm bg-white"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#030522]/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-xl p-6 w-full max-w-md mx-4 animate-fade-in">
            <h3 className="text-[#030522] font-semibold text-lg">Delete Report</h3>
            <p className="text-[#6F7C95] text-sm mt-2">
              Are you sure you want to permanently delete this report? All associated data will be removed. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="border border-[#E6E9EF] text-[#030522] bg-white hover:bg-[#F9FAFC] px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteReport}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium text-xs transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-[#030522]/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-xl p-6 w-full max-w-md mx-4 animate-fade-in">
            <h3 className="text-[#030522] font-semibold text-lg">Report Deleted</h3>
            <p className="text-[#6F7C95] text-sm mt-2">
              The report and all associated data have been successfully removed.
            </p>
          </div>
        </div>
      )}

      {/* All Risks Modal */}
      {showAllRisksModal && (
        <div className="fixed inset-0 bg-[#030522]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setShowAllRisksModal(false)}></div>
          <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col relative z-10 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#E6E9EF] p-6 shrink-0">
              <h3 className="text-lg font-extrabold text-[#030522] tracking-tight">
                All Risks ({report.risks_data?.length || 0})
              </h3>
              <button
                onClick={() => setShowAllRisksModal(false)}
                className="p-1.5 border border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] rounded-md transition-all cursor-pointer shadow-sm bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="overflow-y-auto p-6 flex-grow">
              {report.risks_data && report.risks_data.length > 0 ? (
                <div className="overflow-x-auto border border-[#E6E9EF] rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E9EF]">
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Number</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">DevRev ID</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Feature Name</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF] min-w-[250px]">Description</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Scope</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Date Opened</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Status Date</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF] min-w-[200px]">Comments</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Reported By</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.risks_data.map((r) => (
                        <tr key={r.Nbr} className="border-b border-[#E6E9EF] hover:bg-[#F9FAFC] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[#6F7C95] font-semibold border-r border-[#E6E9EF]">#{r.Nbr}</td>
                          <td className="py-3.5 px-4 font-mono text-[#6F7C95] border-r border-[#E6E9EF]">
                            {r['DevRev ID'] ? (
                              <a 
                                href={`https://app.devrev.ai/lentra/parts/${r['DevRev ID']}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#3B42C4] hover:underline font-medium"
                              >
                                {r['DevRev ID']}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#030522] font-semibold border-r border-[#E6E9EF]">{r['Feature Name'] || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#030522] font-medium whitespace-pre-wrap leading-relaxed border-r border-[#E6E9EF]">{r.Description || r.description || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#6F7C95] font-medium border-r border-[#E6E9EF]">{r.Scope || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#6F7C95] font-medium border-r border-[#E6E9EF]">{r['Date Opened'] || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#6F7C95] font-medium border-r border-[#E6E9EF]">{r['Status Date'] || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#6F7C95] font-medium whitespace-pre-wrap border-r border-[#E6E9EF]">{r.Comments || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#030522] font-semibold border-r border-[#E6E9EF]">{r.reportedBy || 'Unassigned'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              r.Status?.toLowerCase() === 'mitigated' || r.Status?.toLowerCase() === 'closed' || r.Status?.toLowerCase() === 'resolved'
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-red-700 bg-red-50 border-red-200'
                            }`}>
                              {r.Status || 'Open'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-[#6F7C95] text-xs italic bg-[#F9FAFC] border border-dashed border-[#E6E9EF] rounded-lg">
                  No risks registered.
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-[#E6E9EF] p-6 flex justify-end shrink-0">
              <button
                onClick={() => setShowAllRisksModal(false)}
                className="px-4 py-2 border border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] text-xs font-bold rounded-md transition-all cursor-pointer shadow-sm bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Issues Modal */}
      {showAllIssuesModal && (
        <div className="fixed inset-0 bg-[#030522]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setShowAllIssuesModal(false)}></div>
          <div className="bg-white border border-[#E6E9EF] rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col relative z-10 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#E6E9EF] p-6 shrink-0">
              <h3 className="text-lg font-extrabold text-[#030522] tracking-tight">
                All Issues ({report.issues_data?.length || 0})
              </h3>
              <button
                onClick={() => setShowAllIssuesModal(false)}
                className="p-1.5 border border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] rounded-md transition-all cursor-pointer shadow-sm bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="overflow-y-auto p-6 flex-grow">
              {report.issues_data && report.issues_data.length > 0 ? (
                <div className="overflow-x-auto border border-[#E6E9EF] rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E9EF]">
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Number</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">DevRev ID</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Feature Name</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF] min-w-[250px]">Description</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Scope</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Date Opened</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Status Date</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF] min-w-[200px]">Comments</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider border-r border-[#E6E9EF]">Reported By</th>
                        <th className="py-3 px-4 bg-[#F9FAFC] text-[#6F7C95] text-xs font-bold uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.issues_data.map((i) => (
                        <tr key={i.Nbr} className="border-b border-[#E6E9EF] hover:bg-[#F9FAFC] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[#6F7C95] font-semibold border-r border-[#E6E9EF]">#{i.Nbr}</td>
                          <td className="py-3.5 px-4 font-mono text-[#6F7C95] border-r border-[#E6E9EF]">
                            {i['DevRev ID'] ? (
                              <a 
                                href={`https://app.devrev.ai/lentra/parts/${i['DevRev ID']}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#3B42C4] hover:underline font-medium"
                              >
                                {i['DevRev ID']}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[#030522] font-semibold border-r border-[#E6E9EF]">{i['Feature Name'] || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#030522] font-medium whitespace-pre-wrap leading-relaxed border-r border-[#E6E9EF]">{i.Description || i.description || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#6F7C95] font-medium border-r border-[#E6E9EF]">{i.Scope || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#6F7C95] font-medium border-r border-[#E6E9EF]">{i['Date Opened'] || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#6F7C95] font-medium border-r border-[#E6E9EF]">{i['Status Date'] || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#6F7C95] font-medium whitespace-pre-wrap border-r border-[#E6E9EF]">{i.Comments || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-[#030522] font-semibold border-r border-[#E6E9EF]">{i.reportedBy || 'Unassigned'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              i.Status?.toLowerCase() === 'mitigated' || i.Status?.toLowerCase() === 'closed' || i.Status?.toLowerCase() === 'resolved'
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-red-700 bg-red-50 border-red-200'
                            }`}>
                              {i.Status || 'Open'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-[#6F7C95] text-xs italic bg-[#F9FAFC] border border-dashed border-[#E6E9EF] rounded-lg">
                  No issues registered.
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-[#E6E9EF] p-6 flex justify-end shrink-0">
              <button
                onClick={() => setShowAllIssuesModal(false)}
                className="px-4 py-2 border border-[#E6E9EF] text-[#030522] hover:bg-[#F9FAFC] text-xs font-bold rounded-md transition-all cursor-pointer shadow-sm bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
