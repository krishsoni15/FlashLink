'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  Zap, Link2, Copy, Check, BarChart3, ArrowRight, ShieldCheck, 
  Globe, Activity, QrCode, Code, Server, Database, ChevronRight, Play, Terminal 
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [result, setResult] = useState<{ short_code: string; short_url: string; qr_code?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Live Metric Tickers
  const [linksCount, setLinksCount] = useState(148203);
  const [redirectsCount, setRedirectsCount] = useState(4829105);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  
  // Developer Terminal Tab & Run Simulation States
  const [codeTab, setCodeTab] = useState<'curl' | 'js' | 'go'>('curl');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunningCode, setIsRunningCode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLinksCount((prev) => prev + Math.floor(Math.random() * 2) + 1);
      setRedirectsCount((prev) => prev + Math.floor(Math.random() * 4) + 2);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:8080/api/v1/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, custom_alias: customAlias || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to shorten URL');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result?.short_url) return;
    await navigator.clipboard.writeText(result.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Code API Simulation inside terminal
  const runCodeSimulation = () => {
    setIsRunningCode(true);
    setTerminalOutput(['Sending POST request to /api/v1/urls...', 'Authenticating client...']);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, '✓ 201 Created in 0.42ms']);
    }, 800);

    setTimeout(() => {
      setTerminalOutput(prev => [
        ...prev,
        JSON.stringify({
          status: 'success',
          data: {
            short_code: 'flash',
            short_url: 'http://localhost:8080/flash',
            destination_url: 'https://github.com/krishsoni15/FlashLink',
            created_at: new Date().toISOString()
          }
        }, null, 2)
      ]);
      setIsRunningCode(false);
    }, 1500);
  };

  // Global Edge Node Data
  const edgeNodes = [
    { id: 'jfk', name: 'US-EAST (New York)', coords: { x: 30, y: 35 }, latency: '0.38ms', status: 'optimal' },
    { id: 'lhr', name: 'EU-WEST (London)', coords: { x: 52, y: 25 }, latency: '0.41ms', status: 'optimal' },
    { id: 'fra', name: 'EU-CENTRAL (Frankfurt)', coords: { x: 57, y: 28 }, latency: '0.42ms', status: 'optimal' },
    { id: 'nrt', name: 'AP-NORTHEAST (Tokyo)', coords: { x: 82, y: 32 }, latency: '0.45ms', status: 'optimal' },
    { id: 'sin', name: 'AP-SOUTHEAST (Singapore)', coords: { x: 74, y: 55 }, latency: '0.44ms', status: 'optimal' },
    { id: 'syd', name: 'OC-EAST (Sydney)', coords: { x: 88, y: 78 }, latency: '0.48ms', status: 'optimal' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-current selection:bg-brand-500 selection:text-black relative flex flex-col justify-between overflow-x-hidden">
      
      {/* Background Grids & Radial Glow Effects */}
      <div className="absolute inset-0 grid-bg opacity-40 dark:opacity-30 z-0 pointer-events-none animate-pulse-glow" style={{ animationDuration: '8s' }} />
      <div className="absolute top-[-10%] left-[20%] w-[90%] md:w-[600px] h-[400px] bg-brand-500/[0.08] dark:bg-brand-500/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[300px] md:w-[500px] h-[400px] bg-purple-500/[0.07] dark:bg-purple-500/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-cyan-500/[0.06] dark:bg-cyan-500/5 rounded-full blur-[100px] z-0 pointer-events-none" />

      {/* Glassmorphic Landing Top Navigation Bar */}
      <header className="sticky top-0 w-full h-20 border-b border-black/[0.04] dark:border-white/[0.04] bg-slate-50/70 dark:bg-[#050507]/70 backdrop-blur-xl z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-brand-500/10 group-hover:scale-105 group-hover:shadow-brand-500/25 transition-all duration-300">
              <Zap className="w-5 h-5 text-black font-extrabold fill-black" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-neutral-400 tracking-tight">
              FlashLink
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="btn-primary text-xs py-2 px-4 shadow-md flex items-center gap-1.5">
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors py-2 px-3">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-xs py-2 px-4 shadow-md flex items-center gap-1.5">
                  Create Account <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 sm:py-16 relative z-10 max-w-7xl mx-auto w-full space-y-24">
        
        {/* Split Hero Section */}
        <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4 sm:pt-8">
          
          {/* Left Column: Headline and Form */}
          <div className="lg:col-span-7 space-y-8 text-left animate-slide-up">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] text-brand-500 dark:text-brand-400 shadow-sm">
              <Zap className="w-4 h-4 fill-brand-400/10 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-widest">Lightning Fast Link Operations</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Lightning Fast <br />
              <span className="gradient-text bg-gradient-to-r from-brand-400 via-amber-400 to-orange-500">Short Links</span>
            </h1>
            
            <p className="text-slate-600 dark:text-neutral-400 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
              Sub-millisecond redirects powered by a Go Fiber router and Redis cache. Built for global scale with Cloudflare edge routing, PostgreSQL persistence, and developer APIs.
            </p>

            {/* Shortener Core Form Container */}
            <div className="w-full max-w-2xl glass-card p-5 sm:p-6 shadow-2xl relative overflow-hidden border-t-2 border-t-brand-500/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/[0.02] dark:bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <form onSubmit={handleShorten} className="space-y-4">
                <div>
                  <div className="relative group">
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500 group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste your long destination URL here..."
                      className="input-field pl-12 text-sm sm:text-base py-3 sm:py-3.5"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    placeholder="Custom alias (optional)"
                    className="input-field flex-1 text-sm sm:text-base py-2.5 sm:py-3"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary min-w-full sm:min-w-[150px] shadow-lg py-2.5 sm:py-3"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-black animate-pulse" />
                        Shorten Link
                      </>
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-slide-up">
                  {error}
                </div>
              )}

              {/* Success Short URL results block */}
              {result && (
                <div className="mt-6 pt-6 border-t border-black/[0.06] dark:border-white/[0.06] animate-fade-in space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {result.qr_code && (
                      <div className="p-2.5 bg-white rounded-xl shadow-2xl shrink-0 flex items-center justify-center border border-neutral-200">
                        <img src={result.qr_code} alt="QR Code" className="w-24 h-24" />
                      </div>
                    )}
                    <div className="flex-1 w-full space-y-3 text-center sm:text-left">
                      <div>
                        <p className="text-[10px] text-brand-500 dark:text-brand-400 font-extrabold uppercase tracking-widest mb-1">Your link is ready!</p>
                        <a href={result.short_url} target="_blank" rel="noopener noreferrer" className="text-xl font-black text-slate-800 dark:text-white hover:text-brand-500 transition-colors break-all flex items-center justify-center sm:justify-start gap-1">
                          {result.short_url}
                          <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0 rotate-[-45deg]" />
                        </a>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button onClick={copyToClipboard} className="btn-secondary py-2 flex-1 shadow-md text-xs">
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 animate-fade-in" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                          {copied ? 'Copied Link' : 'Copy Link'}
                        </button>
                        <Link href={`/login`} className="btn-secondary py-2 flex-1 border-brand-500/25 text-brand-500 hover:bg-brand-500/5 dark:hover:bg-brand-500/10 hover:border-brand-500/50 shadow-md text-xs">
                          <BarChart3 className="w-3.5 h-3.5" />
                          View Analytics
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Edge Nodes Live Uptime status indicator */}
            <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>All Edge Routing Nodes Operational</span>
              <span className="text-neutral-300 dark:text-neutral-800">|</span>
              <span className="text-brand-500 dark:text-brand-400">Avg Uptime 99.99%</span>
            </div>
          </div>

          {/* Right Column: Dynamic SVG Network Visualizer */}
          <div className="lg:col-span-5 w-full flex items-center justify-center relative animate-fade-in">
            {/* Mesh container card */}
            <div className="w-full max-w-[420px] aspect-square rounded-3xl glass-card p-6 border border-black/5 dark:border-white/[0.05] relative overflow-hidden flex flex-col justify-between">
              
              {/* Header inside visualization card */}
              <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] pb-4 z-10">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-500 animate-spin" style={{ animationDuration: '20s' }} />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Cloudflare Edge Grid</span>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[9px] font-bold">
                  284 POPs Active
                </div>
              </div>

              {/* Graphic Network Map SVG Canvas */}
              <div className="flex-1 w-full relative my-4 flex items-center justify-center">
                
                {/* SVG canvas layer */}
                <svg className="absolute inset-0 w-full h-full z-0" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="link-grad" x1="0" y1="0" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#a855f7" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  
                  {/* Dynamic packet link lines */}
                  <path d="M 30 35 Q 52 25, 57 28" fill="none" stroke="url(#link-grad)" strokeWidth="0.75" strokeDasharray="3 3" />
                  <path d="M 52 25 Q 60 10, 82 32" fill="none" stroke="url(#link-grad)" strokeWidth="0.75" />
                  <path d="M 57 28 Q 70 40, 74 55" fill="none" stroke="url(#link-grad)" strokeWidth="0.75" />
                  <path d="M 74 55 Q 80 65, 88 78" fill="none" stroke="url(#link-grad)" strokeWidth="0.75" strokeDasharray="3 3" />
                  <path d="M 30 35 Q 50 60, 74 55" fill="none" stroke="url(#link-grad)" strokeWidth="0.75" />

                  {/* Animated Data Packets (flying circles) */}
                  <circle r="1" fill="#facc15" className="animate-pulse">
                    <animateMotion dur="4s" repeatCount="indefinite" path="M 30 35 Q 52 25, 57 28" />
                  </circle>
                  <circle r="1" fill="#22d3ee" className="animate-pulse">
                    <animateMotion dur="5s" repeatCount="indefinite" path="M 52 25 Q 60 10, 82 32" />
                  </circle>
                  <circle r="1" fill="#a855f7" className="animate-pulse">
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 57 28 Q 70 40, 74 55" />
                  </circle>
                  <circle r="1.2" fill="#fb923c" className="animate-pulse">
                    <animateMotion dur="6s" repeatCount="indefinite" path="M 30 35 Q 50 60, 74 55" />
                  </circle>
                </svg>

                {/* Plot Node Elements */}
                {edgeNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setActiveNode(activeNode === node.id ? null : node.id)}
                    className="absolute group z-10"
                    style={{ left: `${node.coords.x}%`, top: `${node.coords.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    {/* Ring Pulse */}
                    <span className="absolute -inset-2 bg-cyan-500/10 rounded-full blur-sm scale-0 group-hover:scale-100 transition-all duration-300" />
                    
                    {/* Pulsing visual element */}
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 border ${
                      activeNode === node.id 
                        ? 'bg-cyan-500 border-white shadow-[0_0_15px_rgba(34,211,238,0.6)]' 
                        : 'bg-white dark:bg-[#050507] border-cyan-500/40 group-hover:border-cyan-400 group-hover:scale-110'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        activeNode === node.id ? 'bg-white' : 'bg-cyan-400 group-hover:bg-cyan-300 animate-pulse'
                      }`} />
                    </div>

                    {/* Premium micro tooltip on hover */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 group-focus:scale-100 transition-all duration-200 origin-top bg-slate-900/95 dark:bg-neutral-900/95 text-white p-2.5 rounded-xl border border-white/[0.08] shadow-2xl whitespace-nowrap text-left z-20 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-white">{node.name}</p>
                      <div className="flex items-center gap-3 text-[9px] text-neutral-400 font-bold">
                        <span className="flex items-center gap-1"><Activity className="w-2.5 h-2.5 text-cyan-400" /> Latency: <strong className="text-cyan-400">{node.latency}</strong></span>
                        <span className="text-emerald-500">● {node.status}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Description below network graphic */}
              <div className="border-t border-black/[0.04] dark:border-white/[0.04] pt-4 text-center z-10">
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  {activeNode 
                    ? `Edge POP Node: ${edgeNodes.find(n => n.id === activeNode)?.name} latency ${edgeNodes.find(n => n.id === activeNode)?.latency}`
                    : 'Hover over nodes to inspect live regional request routing latency.'
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Analytics Preview Block */}
        <section className="w-full space-y-8 pt-8">
          {/* Section title */}
          <div className="w-full text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Platform Metrics
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
              Enterprise Operations Tracker
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 text-sm max-w-md mx-auto font-medium">
              Incoming redirections and click metadata are analyzed in real-time at the edge, scaling analytics globally.
            </p>
          </div>

          <div className="w-full max-w-5xl mx-auto glass-card p-6 sm:p-8 shadow-2xl relative overflow-hidden border-t-2 border-t-purple-500/20 animate-fade-in">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/[0.02] dark:bg-purple-500/[0.03] rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
              <div className="flex-1 space-y-6 w-full text-left">
                {/* Metric grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex flex-col justify-between">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Links Shortened</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-1">
                      {linksCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold flex items-center gap-1 mt-1">
                      ↑ 12m ago
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex flex-col justify-between">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Redirects Served</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mt-1 animate-pulse">
                      {redirectsCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-brand-600 dark:text-brand-500 font-bold flex items-center gap-1 mt-1">
                      ● serving live
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex flex-col justify-between">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">Avg Latency</span>
                    <span className="text-2xl font-black text-brand-500 dark:text-brand-400 tracking-tight mt-1">
                      0.42ms
                    </span>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-500 font-bold flex items-center gap-1 mt-1">
                      Redis Edge
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    Every click on a FlashLink short code captures rich telemetry: country headers, browser agent strings, operating systems, and referral domains, providing immediate graphical breakdowns on your account dashboard.
                  </p>
                </div>
              </div>

              {/* Glowing Analytics Line Chart Preview */}
              <div className="w-full lg:w-[380px] p-5 rounded-2xl bg-black/[0.01] dark:bg-black/40 border border-black/[0.05] dark:border-white/[0.04] shadow-inner relative overflow-hidden flex flex-col justify-between shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-left">
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-extrabold uppercase tracking-wider">Short Code Clicks</span>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5">2,840 clicks/hr</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/20">
                    +18.4%
                  </span>
                </div>

                {/* Glowing SVG Line Chart */}
                <div className="h-28 w-full relative">
                  <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart-glow-glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(0,0,0,0.03)" dark-stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(0,0,0,0.03)" dark-stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(0,0,0,0.03)" dark-stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                    
                    <path
                      d="M 0 40 L 0 25 Q 15 15, 30 28 T 60 12 T 90 18 L 100 15 L 100 40 Z"
                      fill="url(#chart-glow-glow)"
                    />
                    <path
                      d="M 0 25 Q 15 15, 30 28 T 60 12 T 90 18 L 100 15"
                      fill="none"
                      stroke="rgb(168, 85, 247)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="30" cy="28" r="1.5" fill="rgb(168, 85, 247)" stroke="white" strokeWidth="0.5" />
                    <circle cx="60" cy="12" r="1.5" fill="rgb(245, 158, 11)" stroke="white" strokeWidth="0.5" />
                    <circle cx="100" cy="15" r="1.5" fill="rgb(168, 85, 247)" stroke="white" strokeWidth="0.5" />
                  </svg>
                </div>

                {/* Simulated Geo Requests Tag Carousel */}
                <div className="flex items-center gap-2 mt-4 overflow-hidden py-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider shrink-0">Live Edge:</span>
                  <div className="flex gap-1.5 overflow-hidden select-none text-[8px] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 whitespace-nowrap">US-EAST</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">EU-WEST</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 whitespace-nowrap">AP-NORTH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Architecture Pipeline Explorer Section */}
        <section className="w-full space-y-12">
          
          <div className="w-full text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              System Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
              Ultra-Low Latency Pipelines
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 text-sm max-w-md mx-auto font-medium">
              Discover how FlashLink routes global client redirections under 1 millisecond.
            </p>
          </div>

          {/* Architecture Pipeline graphic */}
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* Horizontal connection lines for larger screens */}
            <div className="absolute top-[28px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-cyan-500/20 via-brand-500/20 to-purple-500/20 hidden md:block z-0" />
            
            {/* Step 1: Cloudflare */}
            <div className="glass-card p-6 flex flex-col items-center text-center relative z-10 group hover:border-cyan-500/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 mb-4">
                <Globe className="w-6 h-6 text-cyan-500" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-500 mb-1">01. Edge Cache</span>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Cloudflare</h3>
              <p className="text-xs text-neutral-400 mt-2 font-medium">
                Incoming redirections hit regional POP edge servers. Cached links redirect instantly at edge node boundary.
              </p>
            </div>

            {/* Step 2: Go router */}
            <div className="glass-card p-6 flex flex-col items-center text-center relative z-10 group hover:border-brand-500/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 mb-4">
                <Server className="w-6 h-6 text-brand-500" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-500 mb-1">02. Router Server</span>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Go Fiber Engine</h3>
              <p className="text-xs text-neutral-400 mt-2 font-medium">
                Uncached traffic routes to a lightweight Go HTTP backend running high-concurrency fiber multiplexers.
              </p>
            </div>

            {/* Step 3: Redis */}
            <div className="glass-card p-6 flex flex-col items-center text-center relative z-10 group hover:border-purple-500/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 mb-4">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-500 mb-1">03. In-Memory Cache</span>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Redis Cluster</h3>
              <p className="text-xs text-neutral-400 mt-2 font-medium">
                Go validates and pulls destinations in microseconds from in-memory key-value caches, bypassing databases.
              </p>
            </div>

            {/* Step 4: PostgreSQL */}
            <div className="glass-card p-6 flex flex-col items-center text-center relative z-10 group hover:border-pink-500/30 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 mb-4">
                <Database className="w-6 h-6 text-pink-500" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-500 mb-1">04. Persistent DB</span>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">PostgreSQL</h3>
              <p className="text-xs text-neutral-400 mt-2 font-medium">
                Analytics telemetry queues async and persists inside highly structured relational SQL databases safely.
              </p>
            </div>

          </div>
        </section>

        {/* Dynamic Developer API Code Console Section */}
        <section className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: API details */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
              Developer APIs
            </span>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Shorten links programmatically
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed font-medium">
              Create and manage short URLs programmatically. Integrate robust telemetry, custom alias queries, and QR code generations directly inside your code using our secure authorization REST API tokens.
            </p>
            
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-neutral-200">Bearer Token Security</h4>
                  <p className="text-[11px] text-neutral-400">Pass developer API keys cleanly within standard HTTP auth headers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-neutral-200">JSON API Request Payloads</h4>
                  <p className="text-[11px] text-neutral-400">Robust request schemas supporting destination urls and optional custom aliases.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link 
                href={user ? "/dashboard" : "/register"} 
                className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 group hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                Get API Key
                <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Code Terminal Card */}
          <div className="lg:col-span-7 w-full">
            <div className="w-full rounded-2xl bg-[#09090c] border border-white/[0.06] shadow-2xl overflow-hidden flex flex-col">
              
              {/* Terminal Window Header (Sleek Mac Buttons + Tab selections) */}
              <div className="px-4 py-3 bg-[#0d0d11] border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                  <span className="text-[10px] text-neutral-400 font-bold font-mono ml-3 uppercase tracking-wider flex items-center gap-1"><Terminal className="w-3 h-3" /> API Sandbox</span>
                </div>

                {/* Tab selections */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setCodeTab('curl'); setTerminalOutput([]); }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                      codeTab === 'curl' ? 'bg-white/10 text-white border border-white/10' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => { setCodeTab('js'); setTerminalOutput([]); }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                      codeTab === 'js' ? 'bg-white/10 text-white border border-white/10' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    onClick={() => { setCodeTab('go'); setTerminalOutput([]); }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all ${
                      codeTab === 'go' ? 'bg-white/10 text-white border border-white/10' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    Go
                  </button>
                </div>
              </div>

              {/* Code blocks and compiler sandbox */}
              <div className="p-4 sm:p-5 flex-1 font-mono text-left relative min-h-[220px] flex flex-col justify-between">
                
                {/* Code snippets */}
                <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed overflow-x-auto">
                  {codeTab === 'curl' && (
                    <code className="block whitespace-pre">
                      <span className="text-purple-400">curl</span> -X POST http://localhost:8080/api/v1/urls \<br />
                      &nbsp;&nbsp;-H <span className="text-emerald-400">"Content-Type: application/json"</span> \<br />
                      &nbsp;&nbsp;-H <span className="text-emerald-400">"Authorization: Bearer fl_api_key_demo"</span> \<br />
                      &nbsp;&nbsp;-d <span className="text-cyan-400">'{`{"url": "https://github.com", "custom_alias": "hub"}`}'</span>
                    </code>
                  )}
                  {codeTab === 'js' && (
                    <code className="block whitespace-pre">
                      <span className="text-purple-400">await</span> <span className="text-cyan-400">fetch</span>(<span className="text-emerald-400">'http://localhost:8080/api/v1/urls'</span>, &#123;<br />
                      &nbsp;&nbsp;method: <span className="text-emerald-400">'POST'</span>,<br />
                      &nbsp;&nbsp;headers: &#123;<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">'Content-Type'</span>: <span className="text-emerald-400">'application/json'</span>,<br />
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400">'Authorization'</span>: <span className="text-emerald-400">'Bearer fl_api_key_demo'</span><br />
                      &nbsp;&nbsp;&#125;,<br />
                      &nbsp;&nbsp;body: JSON.<span className="text-cyan-400">stringify</span>(&#123; url: <span className="text-emerald-400">'https://github.com'</span> &#125;)<br />
                      &#125;);
                    </code>
                  )}
                  {codeTab === 'go' && (
                    <code className="block whitespace-pre">
                      payload := strings.<span className="text-cyan-400">NewReader</span>(<span className="text-cyan-400">{`\`{"url": "https://github.com"}\``}</span>)<br />
                      req, _ := http.<span className="text-cyan-400">NewRequest</span>(<span className="text-emerald-400">"POST"</span>, <span className="text-emerald-400">"http://localhost:8080/api/v1/urls"</span>, payload)<br />
                      req.Header.<span className="text-cyan-400">Add</span>(<span className="text-emerald-400">"Content-Type"</span>, <span className="text-emerald-400">"application/json"</span>)<br />
                      req.Header.<span className="text-cyan-400">Add</span>(<span className="text-emerald-400">"Authorization"</span>, <span className="text-emerald-400">"Bearer fl_api_key_demo"</span>)<br />
                      res, _ := http.DefaultClient.<span className="text-cyan-400">Do</span>(req)
                    </code>
                  )}
                </div>

                {/* Simulated sandbox interactive trigger console */}
                <div className="mt-6 pt-4 border-t border-white/[0.04] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Terminal Output Sandbox</span>
                    <button
                      onClick={runCodeSimulation}
                      disabled={isRunningCode}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-500 text-black font-extrabold text-[10px] uppercase tracking-wider hover:bg-brand-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {isRunningCode ? (
                        <div className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-black text-black" />
                          Run Request
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sandbox code compilation output logs */}
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.03] text-xs font-mono min-h-[85px] flex flex-col justify-start gap-1 overflow-x-auto">
                    {terminalOutput.length === 0 ? (
                      <span className="text-neutral-500 italic">Click "Run Request" to compile API sandbox...</span>
                    ) : (
                      terminalOutput.map((line, idx) => (
                        <pre key={idx} className={`whitespace-pre-wrap ${
                          line.startsWith('✓') 
                            ? 'text-emerald-400 font-bold' 
                            : line.startsWith('{') || line.startsWith(' ') || line.startsWith('}')
                            ? 'text-neutral-400 text-[11px]'
                            : 'text-neutral-400'
                        }`}>
                          {line}
                        </pre>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Cinematic Footer Section */}
      <footer className="w-full border-t border-black/[0.04] dark:border-white/[0.04] py-8 text-center text-xs text-neutral-500 font-medium bg-slate-100 dark:bg-[#030305] z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} FlashLink Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-800 dark:hover:text-neutral-300 transition-colors cursor-pointer">Security</span>
            <span className="hover:text-slate-800 dark:hover:text-neutral-300 transition-colors cursor-pointer">API Docs</span>
            <span className="hover:text-slate-800 dark:hover:text-neutral-300 transition-colors cursor-pointer">Status</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
