'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Code, 
  Check, 
  RotateCcw, 
  Mail, 
  TrendingUp, 
  Users, 
  DollarSign, 
  MapPin,
  RefreshCw
} from 'lucide-react';
import { generateReportHtml, ReportMetrics } from './utils/reportGenerator';

// Baseline values for the dashboard
const initialMetrics: ReportMetrics = {
  title: 'Executive Weekly Report',
  revenue: 44250,
  revenueGrowth: 12.4,
  activeUsers: 8420,
  userGrowth: 8.7,
  breakdown: [
    { region: 'North America', users: 4120, revenue: 21500, conversion: 3.4 },
    { region: 'Europe', users: 2850, revenue: 14800, conversion: 2.9 },
    { region: 'Asia-Pacific', users: 1150, revenue: 6200, conversion: 2.1 },
    { region: 'Latin America', users: 300, revenue: 1750, conversion: 1.8 },
  ],
};

export default function Home() {
  const [metrics, setMetrics] = useState<ReportMetrics>(initialMetrics);
  const [activeTab, setActiveTab] = useState<'preview' | 'html'>('preview');
  const [copiedRich, setCopiedRich] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // HTML Compiled content
  const htmlContent = generateReportHtml(metrics);

  // Simulate an updating state for the preview whenever metrics change (micro-animation)
  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 200);
    return () => clearTimeout(timer);
  }, [metrics]);

  const handleReset = () => {
    setMetrics(initialMetrics);
  };

  const handleMetricChange = (field: keyof Omit<ReportMetrics, 'breakdown'>, value: string | number) => {
    setMetrics(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBreakdownChange = (index: number, field: 'users' | 'revenue' | 'conversion', value: number) => {
    setMetrics(prev => {
      const newBreakdown = [...prev.breakdown];
      newBreakdown[index] = {
        ...newBreakdown[index],
        [field]: value
      };
      return {
        ...prev,
        breakdown: newBreakdown
      };
    });
  };

  // Copy rich-formatted HTML for email client paste
  const copyRichEmail = async () => {
    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([htmlContent], { type: 'text/plain' });
      
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
      console.error('Failed to copy rich text:', err);
      // Fallback to plain text copy
      await navigator.clipboard.writeText(htmlContent);
      setCopiedRich(true);
      setTimeout(() => setCopiedRich(false), 2500);
    }
  };

  // Copy raw HTML source
  const copyRawHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch (err) {
      console.error('Failed to copy html code:', err);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      
      {/* Top Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-indigo-400 via-pink-400 to-sky-400 bg-clip-text text-transparent">
              rptdashboard Studio
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Build custom dark-theme reporting newsletters. Edit data on the left, copy rich text on the right, and paste directly into Gmail or Outlook!
          </p>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Defaults
        </button>
      </header>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Data Editor Form (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card 1: General Info */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Report General Info
            </h2>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Report Subject / Title</label>
              <input 
                type="text" 
                value={metrics.title} 
                onChange={(e) => handleMetricChange('title', e.target.value)}
                className="custom-input w-full"
                placeholder="Weekly Performance Update"
              />
            </div>
          </div>

          {/* Card 2: Core Metrics */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
              Key Metrics (KPIs)
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              
              {/* Revenue */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-sky-400" /> Revenue ($)
                </label>
                <input 
                  type="number" 
                  value={metrics.revenue} 
                  onChange={(e) => handleMetricChange('revenue', Number(e.target.value))}
                  className="custom-input w-full"
                />
              </div>

              {/* Revenue Growth */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" /> Rev. Growth (%)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  value={metrics.revenueGrowth} 
                  onChange={(e) => handleMetricChange('revenueGrowth', Number(e.target.value))}
                  className="custom-input w-full"
                />
              </div>

              {/* Active Users */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="h-3 w-3 text-indigo-400" /> Active Users
                </label>
                <input 
                  type="number" 
                  value={metrics.activeUsers} 
                  onChange={(e) => handleMetricChange('activeUsers', Number(e.target.value))}
                  className="custom-input w-full"
                />
              </div>

              {/* User Growth */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" /> User Growth (%)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  value={metrics.userGrowth} 
                  onChange={(e) => handleMetricChange('userGrowth', Number(e.target.value))}
                  className="custom-input w-full"
                />
              </div>

            </div>
          </div>

          {/* Card 3: Regional Breakdown */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Regional Breakdown
            </h2>
            <div className="flex flex-col gap-4">
              {metrics.breakdown.map((row, index) => (
                <div key={row.region} className="border-t border-slate-800/80 pt-4 first:border-none first:pt-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-sm font-bold text-slate-200">{row.region}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {/* Users */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Users</label>
                      <input 
                        type="number" 
                        value={row.users} 
                        onChange={(e) => handleBreakdownChange(index, 'users', Number(e.target.value))}
                        className="custom-input text-xs py-1 px-2"
                      />
                    </div>
                    {/* Revenue */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Rev ($)</label>
                      <input 
                        type="number" 
                        value={row.revenue} 
                        onChange={(e) => handleBreakdownChange(index, 'revenue', Number(e.target.value))}
                        className="custom-input text-xs py-1 px-2"
                      />
                    </div>
                    {/* Conversion */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Conv (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={row.conversion} 
                        onChange={(e) => handleBreakdownChange(index, 'conversion', Number(e.target.value))}
                        className="custom-input text-xs py-1 px-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Live View Panel (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Editor Header controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            {/* View Tabs */}
            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Email Preview
              </button>
              <button 
                onClick={() => setActiveTab('html')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'html' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                HTML Code
              </button>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Copy Rich Text button */}
              <button
                onClick={copyRichEmail}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 rounded-lg shadow-lg hover:shadow-indigo-500/10 active:scale-95 transition-all"
              >
                {copiedRich ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Mail className="h-3.5 w-3.5" />}
                {copiedRich ? 'Copied to Clipboard!' : 'Copy Rich Report'}
              </button>

              {/* Copy Raw HTML */}
              <button
                onClick={copyRawHtml}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg active:scale-95 transition-all"
              >
                {copiedHtml ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedHtml ? 'HTML Copied!' : 'Copy Raw HTML'}
              </button>
            </div>
          </div>

          {/* Copy-paste reminder notice */}
          {copiedRich && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 animate-pulse">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span><strong>Ready to Paste:</strong> Go to your email composer (Gmail, Outlook, Mac Mail) and press <strong>Cmd+V / Ctrl+V</strong>.</span>
            </div>
          )}

          {/* Live View Output Frame */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 relative min-h-[600px] flex flex-col">
            
            {/* Loading Indicator Overlay */}
            {isUpdating && (
              <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-950/80 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-md animate-fade-in">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Compiling...
              </div>
            )}

            {/* Conditional Tab Rendering */}
            {activeTab === 'preview' ? (
              <div className="w-full flex-grow bg-[#0b0f19] p-4 flex justify-center items-stretch">
                <iframe 
                  srcDoc={htmlContent}
                  title="Email Dashboard Live View"
                  className="w-full max-w-[600px] border border-slate-850/80 rounded-xl bg-[#0f172a] shadow-inner min-h-[600px] flex-grow"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="flex-grow flex flex-col bg-slate-950 p-4">
                <textarea
                  readOnly
                  value={htmlContent}
                  className="w-full flex-grow min-h-[560px] bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs p-4 rounded-xl focus:outline-none resize-none"
                />
              </div>
            )}
          </div>

        </section>

      </div>
    </main>
  );
}
