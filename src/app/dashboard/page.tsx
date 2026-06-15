'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { 
  FileSpreadsheet, 
  Trash2, 
  Plus, 
  Minus, 
  BarChart3, 
  ShieldAlert, 
  Loader2, 
  LogOut,
  Settings,
  History,
  FileUp,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { logout } from '../login/actions';
import { fetchReports, saveReport } from '../actions/reportActions';
import { processReport, FeatureData, TaskData, RiskIssueData } from '../utils/reportEngine';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Navigation / Auth States
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form inputs
  const [reportTitle, setReportTitle] = useState('Executive Weekly Status Update');
  const [highlights, setHighlights] = useState<string[]>(['']);
  
  // File References
  const [files, setFiles] = useState<{
    features: File | null;
    tasks: File | null;
    risks: File | null;
    issues: File | null;
  }>({
    features: null,
    tasks: null,
    risks: null,
    issues: null,
  });

  // Drag states
  const [dragActive, setDragActive] = useState<{ [key: string]: boolean }>({});

  // Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initial Load: Check Auth and Fetch History
  useEffect(() => {
    const initDashboard = async () => {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email || '');

      // Check Admin flag
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.is_admin) {
        setIsAdmin(true);
      }

      // Load last 10 reports
      const reports = await fetchReports();
      setHistoryList(reports);
      setLoadingHistory(false);
    };

    initDashboard();
  }, [router]);

  // 2. Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent, zone: string, active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [zone]: active }));
  };

  const handleDrop = (e: React.DragEvent, zone: keyof typeof files) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [zone]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setFiles(prev => ({ ...prev, [zone]: file }));
        setErrorMessage(null);
      } else {
        setErrorMessage('Only CSV files are supported.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, zone: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
        setFiles(prev => ({ ...prev, [zone]: file }));
        setErrorMessage(null);
      } else {
        setErrorMessage('Only CSV files are supported.');
      }
    }
  };

  const removeFile = (zone: keyof typeof files) => {
    setFiles(prev => ({ ...prev, [zone]: null }));
  };

  // 3. Highlights Inputs Handlers
  const addHighlight = () => {
    if (highlights.length < 5) {
      setHighlights(prev => [...prev, '']);
    }
  };

  const removeHighlight = (index: number) => {
    if (highlights.length > 1) {
      setHighlights(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateHighlight = (index: number, val: string) => {
    setHighlights(prev => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  // 4. CSV Client-side Parsers & Sanitizers
  const parseCsvFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
      });
    });
  };

  const sanitizeFeatures = (raw: any[]): FeatureData[] => {
    return raw.map(row => ({
      'Part id': String(row['Part id'] || row['part_id'] || '').trim(),
      Name: String(row['Name'] || row['name'] || '').slice(0, 50).trim(),
      'Owner[0]': String(row['Owner[0]'] || row['owner'] || '').trim(),
      'Theme[0]': String(row['Theme[0]'] || row['theme'] || '').trim(),
      'Goal[0]': String(row['Goal[0]'] || row['goal'] || '').trim(),
      'Service (Temp)[0]': String(row['Service (Temp)[0]'] || row['service'] || '').trim(),
      'Created date': String(row['Created date'] || row['created_date'] || '').trim(),
      'Tags[0]': String(row['Tags[0]'] || row['tags'] || '').trim(),
    }));
  };

  const sanitizeTasks = (raw: any[]): TaskData[] => {
    return raw.map(row => ({
      Items: String(row['Items'] || row['items'] || '').trim(),
      Title: String(row['Title'] || row['title'] || '').slice(0, 50).trim(),
      Stage: String(row['Stage'] || row['stage'] || '').trim(),
      'Owner[0]': String(row['Owner[0]'] || row['owner'] || '').trim(),
      'Target Close Date': String(row['Target Close Date'] || row['target_close_date'] || '').trim(),
      'Close date': String(row['Close date'] || row['close_date'] || '').trim(),
      'Part-ID': String(row['Part-ID'] || row['part_id'] || row['Part id'] || '').trim(),
    }));
  };

  const sanitizeRisksIssues = (raw: any[]): RiskIssueData[] => {
    return raw.map(row => ({
      Nbr: String(row['Nbr'] || row['nbr'] || '').trim(),
      'Date Opened': String(row['Date Opened'] || row['date_opened'] || '').trim(),
      Scope: String(row['Scope'] || row['scope'] || '').trim(),
      Description: String(row['Description'] || row['description'] || '').trim(),
      'Feature Name': String(row['Feature Name'] || row['feature_name'] || '').trim(),
      'DevRev ID': String(row['DevRev ID'] || row['devrev_id'] || '').trim(),
      Status: String(row['Status'] || row['status'] || '').trim(),
      'Status Date': String(row['Status Date'] || row['status_date'] || '').trim(),
      Comments: String(row['Comments'] || row['comments'] || '').trim(),
    }));
  };

  // 5. Submit Processing
  const handleGenerate = async () => {
    if (!reportTitle.trim()) {
      setErrorMessage('Report title is required.');
      return;
    }
    if (!files.features || !files.tasks) {
      setErrorMessage('Mandatory CSV files (Features & Tasks) must be uploaded.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Parse CSV files
      const rawFeatures = await parseCsvFile(files.features);
      const rawTasks = await parseCsvFile(files.tasks);
      
      let rawRisks: any[] = [];
      let rawIssues: any[] = [];

      if (files.risks) rawRisks = await parseCsvFile(files.risks);
      if (files.issues) rawIssues = await parseCsvFile(files.issues);

      // Sanitize fields
      const cleanFeatures = sanitizeFeatures(rawFeatures);
      const cleanTasks = sanitizeTasks(rawTasks);
      
      const cleanRisks = sanitizeRisksIssues(rawRisks);
      const cleanIssues = sanitizeRisksIssues(rawIssues);
      const combinedRisksIssues = [...cleanRisks, ...cleanIssues];

      // Run business logic calculations
      const reportPayload = processReport(
        cleanFeatures,
        cleanTasks,
        combinedRisksIssues,
        highlights
      );

      // Save report payload to DB
      const result = await saveReport(reportTitle, reportPayload);

      if (result.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
      } else if (result.id) {
        // Route directly to the report detail page
        router.push(`/report/${result.id}`);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error processing CSV datasets.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-200">
      
      {/* 1. SIDEBAR (Left 1/4) */}
      <aside className="w-80 border-r border-slate-800 bg-[#0b0f19]/80 backdrop-blur-md p-6 flex flex-col gap-6 shrink-0 h-screen sticky top-0">
        
        {/* User profile section */}
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-6">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <h3 className="font-extrabold text-sm text-white truncate">rptdashboard</h3>
            <span className="text-[10px] text-slate-400 truncate block">{userEmail}</span>
          </div>
        </div>

        {/* Navigation actions */}
        <div className="flex flex-col gap-2">
          {isAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-pink-400 bg-pink-400/5 hover:bg-pink-400/10 border border-pink-400/15 rounded-lg transition-all text-left cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              Admin Management
            </button>
          )}
        </div>

        {/* Historical report logs */}
        <div className="flex-grow flex flex-col gap-2 min-h-0">
          <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1.5 mb-1">
            <History className="h-3 w-3" />
            Historical Reports
          </h4>
          
          {loadingHistory ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
              <Loader2 className="h-4.5 w-4.5 animate-spin text-indigo-500" />
              <span>Fetching logs...</span>
            </div>
          ) : (
            <div className="overflow-y-auto flex flex-col gap-1.5 pr-1 flex-grow">
              {historyList.map(report => (
                <button
                  key={report.id}
                  onClick={() => router.push(`/report/${report.id}`)}
                  className="text-left p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 transition-all text-xs group cursor-pointer"
                >
                  <span className="text-slate-200 font-bold block truncate group-hover:text-indigo-400 transition-colors">
                    {report.title}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
              {historyList.length === 0 && (
                <span className="text-xs text-slate-500 py-4 italic">No reports generated yet.</span>
              )}
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-lg transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </aside>

      {/* 2. MAIN WORKSPACE AREA (Right 3/4) */}
      <main className="flex-grow p-8 max-w-5xl mx-auto flex flex-col gap-6 overflow-y-auto">
        <header>
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-pink-400 to-sky-400 bg-clip-text text-transparent">
            Compile Status Report
          </h1>
          <p className="text-slate-400 text-xs mt-1">Upload CSV datasets, add highlights, and compile dynamic reports</p>
        </header>

        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3.5 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Section 1: Title */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Report Title</label>
              <input 
                type="text" 
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Executive Weekly Status Report"
                className="custom-input w-full"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Section 2: CSV Upload Stage */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Staging Datasets (CSV)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Zone 1: Features (Mandatory) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Features / Capabilities <span className="text-indigo-400 font-bold">*Mandatory</span>
                </span>
                {renderUploadZone('features', 'features')}
              </div>

              {/* Zone 2: Tasks (Mandatory) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Tasks / Items <span className="text-indigo-400 font-bold">*Mandatory</span>
                </span>
                {renderUploadZone('tasks', 'tasks')}
              </div>

              {/* Zone 3: Risks (Optional) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Risks Log <span className="text-slate-500 font-medium">(Optional)</span>
                </span>
                {renderUploadZone('risks', 'risks')}
              </div>

              {/* Zone 4: Issues (Optional) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Issues Log <span className="text-slate-500 font-medium">(Optional)</span>
                </span>
                {renderUploadZone('issues', 'issues')}
              </div>

            </div>
          </div>

          {/* Section 3: Manual Highlights */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                Major Highlights / Achievements
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">Add between 1 and 5 bullets</span>
            </div>

            <div className="flex flex-col gap-3">
              {highlights.map((bullet, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-xs text-indigo-400 font-bold w-5 text-right shrink-0">{index + 1}.</span>
                  <input 
                    type="text" 
                    value={bullet}
                    onChange={(e) => updateHighlight(index, e.target.value)}
                    placeholder="Describe a key progress achievement..."
                    className="custom-input flex-grow"
                    disabled={isSubmitting}
                  />
                  <button
                    onClick={() => removeHighlight(index)}
                    disabled={highlights.length <= 1 || isSubmitting}
                    className="p-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Remove Highlight"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addHighlight}
                disabled={highlights.length >= 5 || isSubmitting}
                className="mt-2 self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:text-white bg-indigo-500/5 hover:bg-indigo-600 border border-indigo-500/10 hover:border-indigo-500 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Highlight Point
              </button>
            </div>
          </div>

          {/* Compile triggers */}
          <button
            onClick={handleGenerate}
            disabled={!files.features || !files.tasks || !reportTitle.trim() || isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:from-indigo-800 disabled:to-pink-800 text-white text-base font-bold rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing & Compiling Status Report...
              </>
            ) : (
              'Generate & Save Report'
            )}
          </button>
        </div>
      </main>
    </div>
  );

  // Helper renderer for drag-drop zones
  function renderUploadZone(zone: keyof typeof files, id: string) {
    const file = files[zone];
    const active = dragActive[zone];
    
    if (file) {
      return (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 transition-all">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FileCheck className="h-5 w-5 text-indigo-400 shrink-0" />
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-slate-200 block truncate">{file.name}</span>
              <span className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>
          <button
            onClick={() => removeFile(zone)}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg transition-all cursor-pointer disabled:opacity-40"
            title="Remove File"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </div>
      );
    }

    return (
      <div 
        onDragOver={(e) => handleDrag(e, zone, true)}
        onDragLeave={(e) => handleDrag(e, zone, false)}
        onDrop={(e) => handleDrop(e, zone)}
        className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
          active 
            ? 'border-indigo-500 bg-indigo-600/5' 
            : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50'
        }`}
      >
        <FileUp className={`h-6 w-6 ${active ? 'text-indigo-400 animate-bounce' : 'text-slate-500'}`} />
        <div>
          <label className="text-xs font-semibold text-slate-200 hover:text-indigo-400 cursor-pointer transition-colors block">
            Click to upload 
            <input 
              type="file" 
              accept=".csv"
              onChange={(e) => handleFileSelect(e, zone)}
              className="hidden"
              disabled={isSubmitting}
            />
          </label>
          <span className="text-[10px] text-slate-500 mt-1 block">or drag and drop CSV file here</span>
        </div>
      </div>
    );
  }
}
