'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  createShortURL, getUserURLs, deleteURL, getUserStats,
  getDashboardAnalytics, URLResponse, AnalyticsSummary,
} from '@/lib/api';
import {
  Zap, Link2, BarChart3, Plus, Copy, Check, Trash2,
  ExternalLink, QrCode, LogOut, MousePointerClick,
  TrendingUp, Globe, Monitor, Calendar,
  Search, Key, RefreshCw, X, ArrowUpRight, ShieldCheck, Download
} from 'lucide-react';

// Simple chart components (inline to avoid extra dependencies issues)
function MiniBarChart({ data }: { data: { name: string; count: number }[] }) {
  if (!data || data.length === 0) return <p className="text-neutral-500 dark:text-white/30 text-sm py-4">No data yet</p>;
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="space-y-3.5">
      {data.slice(0, 5).map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400 w-24 truncate">{item.name || 'Unknown'}</span>
          <div className="flex-1 h-6 bg-slate-100 dark:bg-white/[0.02] rounded-lg overflow-hidden border border-black/[0.04] dark:border-white/[0.05] relative">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-amber-400 rounded-lg transition-all duration-700 ease-out flex items-center px-2 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%`, minWidth: '28px' }}
            >
              <span className="text-[10px] text-black font-extrabold">{item.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClicksChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) return <p className="text-neutral-500 dark:text-white/30 text-sm py-12 text-center">No click data yet</p>;
  
  const max = Math.max(...data.map(d => d.count), 1);
  const width = 800;
  const height = 160;
  const paddingX = 10;
  
  // Generate coordinate points
  let pts = data.map((d, i) => ({
    x: paddingX + (i * (width - paddingX * 2)) / Math.max(data.length - 1, 1),
    y: height - (d.count / max) * (height - 20) - 10
  }));

  // Handle edge case where there is only 1 data point (creates an invisible 0-width path otherwise)
  if (pts.length === 1) {
    pts = [
      { x: paddingX, y: pts[0].y },
      { x: width / 2, y: pts[0].y },
      { x: width - paddingX, y: pts[0].y }
    ];
  }

  // Create smooth bezier curve path (horizontal tangents)
  let pathStr = '';
  if (pts.length > 0) {
    pathStr = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cx = (pts[i].x + pts[i + 1].x) / 2;
      pathStr += ` C ${cx},${pts[i].y} ${cx},${pts[i+1].y} ${pts[i+1].x},${pts[i+1].y}`;
    }
  }

  // Create area path by adding bottom corners
  const areaPath = pts.length > 0 ? `${pathStr} L ${pts[pts.length-1].x},${height} L ${pts[0].x},${height} Z` : '';

  return (
    <div className="relative h-[200px] w-full mt-4 animate-fade-in">
      <div className="absolute inset-0 pb-6">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid lines */}
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(0,0,0,0.04)" strokeWidth="1" strokeDasharray="4" className="dark:stroke-white/[0.04]" />
          
          {/* Area Fill */}
          <path d={areaPath} fill="url(#chartGradient)" />
          
          {/* Smooth Line */}
          <path 
            d={pathStr} 
            fill="none" 
            stroke="#f59e0b" 
            strokeWidth="4"
            filter="url(#glow)"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* Interactive points */}
          {data.map((d, i) => {
            const x = paddingX + (i * (width - paddingX * 2)) / Math.max(data.length - 1, 1);
            const y = height - (d.count / max) * (height - 20) - 10;
            return (
              <g key={i} className="group">
                <circle cx={x} cy={y} r="12" fill="transparent" className="cursor-pointer" />
                <circle 
                  cx={x} 
                  cy={y} 
                  r="5" 
                  fill="#fbbf24" 
                  stroke="#050507" 
                  strokeWidth="2.5" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer shadow-lg"
                />
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* X axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        {data.length > 0 && (
          <>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{data[0].date}</span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{data[Math.floor(data.length / 2)].date}</span>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{data[data.length - 1].date}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  const [urls, setUrls] = useState<URLResponse[]>([]);
  const [totalURLs, setTotalURLs] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create URL modal
  const [showCreate, setShowCreate] = useState(false);
  const [newURL, setNewURL] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresIn, setExpiresIn] = useState('365');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdURL, setCreatedURL] = useState<URLResponse | null>(null);

  // Search/filter
  const [search, setSearch] = useState('');
  const [analyticsDays, setAnalyticsDays] = useState(30);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [urlsData, statsData, analyticsData] = await Promise.all([
        getUserURLs(token, page),
        getUserStats(token),
        getDashboardAnalytics(token, analyticsDays),
      ]);
      setUrls(urlsData.data || []);
      setTotalPages(urlsData.total_pages);
      setTotalURLs(statsData.total_urls);
      setTotalClicks(statsData.total_clicks);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, page, analyticsDays]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, token, authLoading, router, fetchData]);

  const handleCreateURL = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newURL.trim() || !token) return;

    setCreateLoading(true);
    setCreateError('');

    try {
      const data = await createShortURL(newURL, customAlias || undefined, parseInt(expiresIn), token);
      setCreatedURL(data);
      setNewURL('');
      setCustomAlias('');
      fetchData(); // refresh list
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create URL');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (urlId: string) => {
    if (!token || !confirm('Are you sure you want to delete this URL?')) return;
    try {
      await deleteURL(token, urlId);
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const copyLink = async (shortUrl: string, id: string) => {
    await navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUrls = urls.filter(u =>
    u.original_url.toLowerCase().includes(search.toLowerCase()) ||
    u.short_code.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || (!user && !authLoading)) {
    return null; // layout handles loading/auth redirects
  }

  return (
    <div className="w-full relative z-10 px-4 py-6 sm:p-8 space-y-8 max-w-7xl mx-auto text-current">
      
      {/* Sticky Header Page Title & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Monitor, organize, and analyze your shortened links.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            onClick={fetchData} 
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] text-neutral-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:border-black/[0.12] dark:hover:border-white/[0.1] active:scale-95 transition-all duration-300"
            title="Refresh analytics data"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={() => { setShowCreate(true); setCreatedURL(null); }} 
            className="btn-primary text-sm flex items-center gap-2 py-2.5 shadow-lg shadow-brand-500/10"
          >
            <Plus className="w-4.5 h-4.5" /> New Short Link
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Links Card */}
        <div className="stat-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/[0.03] dark:bg-brand-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-brand-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <Link2 className="w-5 h-5 text-brand-500 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tight">{totalURLs}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 font-bold uppercase tracking-wider">Total Short Links</p>
            </div>
          </div>
        </div>

        {/* Total Clicks Card */}
        <div className="stat-card group relative overflow-hidden border-l-emerald-400 hover:border-l-emerald-500">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/[0.03] dark:bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <MousePointerClick className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tight">{totalClicks.toLocaleString()}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 font-bold uppercase tracking-wider">Total Link Clicks</p>
            </div>
          </div>
        </div>

        {/* Unique Visitors Card */}
        <div className="stat-card group relative overflow-hidden border-l-purple-400 hover:border-l-purple-500">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/[0.03] dark:bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <TrendingUp className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tight">{(analytics?.unique_visitors || 0).toLocaleString()}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 font-bold uppercase tracking-wider">Unique Visitors</p>
            </div>
          </div>
        </div>

        {/* Countries Card */}
        <div className="stat-card group relative overflow-hidden border-l-cyan-400 hover:border-l-cyan-500">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/[0.03] dark:bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <Globe className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tight">{analytics?.top_countries?.length || 0}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 font-bold uppercase tracking-wider">Global Audiences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics Line Chart */}
        <div className="lg:col-span-2 glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2.5 text-lg">
              <BarChart3 className="w-5 h-5 text-brand-500 dark:text-brand-400" />
              Clicks Over Time
            </h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <select
                value={analyticsDays}
                onChange={(e) => setAnalyticsDays(Number(e.target.value))}
                className="text-xs bg-slate-100 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.18] dark:hover:border-white/[0.18] rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-neutral-300 font-semibold focus:outline-none transition-colors"
              >
                <option value={7} className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Last 7 days</option>
                <option value={30} className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Last 30 days</option>
                <option value={90} className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Last 90 days</option>
                <option value={365} className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">Last 1 year</option>
              </select>
            </div>
          </div>
          <ClicksChart data={analytics?.clicks_by_date || []} />
        </div>

        {/* Top Countries Side Card */}
        <div className="glass-card p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2.5 text-lg mb-6">
              <Globe className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
              Top Demographics
            </h2>
            <MiniBarChart data={analytics?.top_countries || []} />
          </div>
          <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.04] text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            Updated live based on redirect headers.
          </div>
        </div>
      </div>

      {/* Browser, OS, and Device Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5 sm:p-6">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2.5 text-lg mb-6">
            <Globe className="w-5 h-5 text-brand-500 dark:text-brand-400" />
            Top Browsers
          </h2>
          <MiniBarChart data={analytics?.top_browsers || []} />
        </div>
        <div className="glass-card p-5 sm:p-6">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2.5 text-lg mb-6">
            <Monitor className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            Devices Used
          </h2>
          <MiniBarChart data={analytics?.top_devices || []} />
        </div>
        <div className="glass-card p-5 sm:p-6">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2.5 text-lg mb-6">
            <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            Operating Systems
          </h2>
          <MiniBarChart data={analytics?.top_os || []} />
        </div>
      </div>

      {/* Links List Panel */}
      <div className="glass-card overflow-hidden">
        {/* Panel Header & Search Filter */}
        <div className="p-5 sm:p-6 border-b border-black/[0.04] dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/[0.3] dark:bg-white/[0.01]">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2.5 text-lg">
            <Link2 className="w-5 h-5 text-brand-500 dark:text-brand-400" />
            Your Shortened Links
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by alias or destination..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-[#050507]/60 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-sm text-current placeholder-neutral-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>

        {/* Content list */}
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider animate-pulse">Syncing links</p>
          </div>
        ) : filteredUrls.length === 0 ? (
          <div className="p-16 text-center max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-7 h-7 text-neutral-400 dark:text-neutral-600" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white text-base">No links found</h3>
            <p className="text-neutral-500 text-sm mt-1.5">You haven&apos;t created any links or your search returned no matching results.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04] bg-slate-50/[0.2] dark:bg-[#07070b]/20">
            {filteredUrls.map((url) => (
              <div key={url.id} className="p-5 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors duration-300 group">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left Link Info block */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/5 border border-brand-500/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <Link2 className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={url.short_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-bold text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors break-all flex items-center gap-1.5"
                        >
                          {url.short_url}
                          <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
                        </a>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-2xl font-mono hover:text-neutral-700 dark:hover:text-neutral-300" title={url.original_url}>
                        {url.original_url}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions & Clicks stats block */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 flex-shrink-0 pt-3 sm:pt-0 border-t border-black/[0.04] dark:border-white/[0.04] sm:border-none">
                    
                    {/* Clicks badge */}
                    <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-black/[0.04] dark:border-white/[0.04] text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <MousePointerClick className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      {url.click_count} clicks
                    </span>

                    {/* Button groups */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyLink(url.short_url, url.id)}
                        className={`p-2 rounded-xl border transition-all duration-300 ${
                          copiedId === url.id
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.18] dark:hover:border-white/[0.18] text-neutral-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title="Copy short link"
                      >
                        {copiedId === url.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(url.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-red-500/10 dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06] hover:border-red-500/20 hover:border-red-500/20 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300"
                        title="Delete short link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-center gap-2 bg-slate-50/[0.3] dark:bg-white/[0.01]">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8.5 h-8.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                  page === i + 1
                    ? 'bg-brand-500 text-black shadow-lg shadow-brand-500/10'
                    : 'bg-slate-100 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] text-neutral-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create URL Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-md animate-fade-in" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg glass-card p-6 sm:p-8 animate-slide-up border-t-4 border-t-brand-500 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Link2 className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                Create New Short Link
              </h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-neutral-500 hover:text-slate-900 dark:hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdURL ? (
              <div className="animate-slide-up space-y-6">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-3">
                  <Check className="w-5 h-5 fill-emerald-500/20" />
                  <span>Link shortened successfully!</span>
                </div>
                
                {/* Result field */}
                <div className="bg-slate-50 dark:bg-[#09090d]/60 border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4 relative group">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">Short URL</p>
                  <div className="flex items-center justify-between gap-3">
                    <a href={createdURL.short_url} target="_blank" rel="noopener noreferrer"
                       className="text-brand-500 dark:text-brand-400 font-extrabold text-lg hover:text-brand-600 dark:hover:text-brand-300 transition-colors break-all">
                      {createdURL.short_url}
                    </a>
                    <button 
                      onClick={() => copyLink(createdURL.short_url, 'modal')}
                      className={`p-2 rounded-xl border transition-all duration-300 ${
                        copiedId === 'modal'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-neutral-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {copiedId === 'modal' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* QR Code visual segment */}
                {createdURL.qr_code && (
                  <div className="flex items-center gap-5 bg-slate-50/50 dark:bg-white/[0.01] border border-black/[0.04] dark:border-white/[0.04] rounded-2xl p-4">
                    <div className="p-2.5 bg-white rounded-xl flex-shrink-0 shadow-lg border border-neutral-200">
                      <img src={createdURL.qr_code} alt="QR Code" className="w-24 h-24" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-brand-500 dark:text-brand-400" />
                        Dynamic QR Code
                      </p>
                      <p className="text-xs text-neutral-500">Scan to redirect instantly. Right click the image to save or print.</p>
                    </div>
                  </div>
                )}

                <button onClick={() => { setCreatedURL(null); }} className="btn-secondary w-full text-sm font-bold py-3.5">
                  Create Another Link
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateURL} className="space-y-5">
                {createError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                    {createError}
                  </div>
                )}
                
                {/* Destination field */}
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mb-2 block">Destination URL *</label>
                  <input
                    id="create-url"
                    type="url"
                    value={newURL}
                    onChange={(e) => setNewURL(e.target.value)}
                    className="input-field"
                    placeholder="https://example.com/very/long/path/to/destination"
                    required
                  />
                </div>

                {/* Custom Alias field */}
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mb-2 block">Custom Alias (optional)</label>
                  <input
                    id="create-alias"
                    type="text"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="input-field"
                    placeholder="e.g. spring-sale"
                    minLength={3}
                    maxLength={50}
                  />
                  <p className="text-[10px] text-neutral-500 mt-1.5">3-50 characters. Letters, numbers, and hyphens only.</p>
                </div>

                {/* Expires field */}
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-neutral-400" /> 
                    Link Lifespan Duration
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="input-field font-semibold"
                  >
                    <option value="7" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">7 Days</option>
                    <option value="30" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">30 Days</option>
                    <option value="90" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">90 Days</option>
                    <option value="365" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">1 Year</option>
                    <option value="1825" className="bg-white dark:bg-neutral-900 text-slate-800 dark:text-white">5 Years (Permanent)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    id="create-submit"
                    type="submit"
                    disabled={createLoading}
                    className="btn-primary w-full shadow-lg"
                  >
                    {createLoading ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4.5 h-4.5 fill-black" /> Create Short Link
                      </>
                    )}
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
