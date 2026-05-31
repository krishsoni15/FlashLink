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
  Search, Key, RefreshCw, X
} from 'lucide-react';

// Simple chart components (inline to avoid extra dependencies issues)
function MiniBarChart({ data }: { data: { name: string; count: number }[] }) {
  if (!data || data.length === 0) return <p className="text-white/30 text-sm">No data yet</p>;
  const max = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-xs text-white/50 w-20 truncate">{item.name || 'Unknown'}</span>
          <div className="flex-1 h-6 bg-white/[0.04] rounded-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-purple-600 rounded-lg transition-all duration-500 flex items-center px-2"
              style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%`, minWidth: '24px' }}
            >
              <span className="text-[10px] text-white font-medium">{item.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClicksChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length === 0) return <p className="text-white/30 text-sm py-8 text-center">No click data yet</p>;
  const max = Math.max(...data.map(d => d.count));
  const chartHeight = 160;

  return (
    <div className="relative h-[200px]">
      <div className="absolute inset-0 flex items-end gap-1 px-2 pb-6">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity
                          bg-surface-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap z-10">
              {item.count} clicks
            </div>
            <div
              className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-md transition-all duration-300
                       hover:from-brand-500 hover:to-purple-400 cursor-pointer"
              style={{
                height: `${max > 0 ? (item.count / max) * chartHeight : 2}px`,
                minHeight: '2px',
              }}
            />
          </div>
        ))}
      </div>
      {/* X axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
        {data.length > 0 && (
          <>
            <span className="text-[10px] text-white/30">{data[0].date.slice(5)}</span>
            <span className="text-[10px] text-white/30">{data[data.length - 1].date.slice(5)}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, logout } = useAuth();

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

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredUrls = urls.filter(u =>
    u.original_url.toLowerCase().includes(search.toLowerCase()) ||
    u.short_code.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black grid-bg">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/[0.06] bg-black/80 backdrop-blur-xl z-40
                       hidden lg:flex flex-col">
        <div className="p-6 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">FlashLink</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-brand-600/10 text-brand-400 text-sm font-medium">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.04] text-sm transition-colors">
            <Link2 className="w-4 h-4" /> My Links
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.04] text-sm transition-colors">
            <Key className="w-4 h-4" /> API Keys
          </button>
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-xl">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-white/40">Welcome back, {user?.name?.split(' ')[0]}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={fetchData} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-all" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => { setShowCreate(true); setCreatedURL(null); }} className="btn-primary text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Link
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalURLs}</p>
                  <p className="text-xs text-white/40">Total Links</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{totalClicks.toLocaleString()}</p>
                  <p className="text-xs text-white/40">Total Clicks</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{analytics?.unique_visitors?.toLocaleString() || 0}</p>
                  <p className="text-xs text-white/40">Unique Visitors</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{analytics?.top_countries?.length || 0}</p>
                  <p className="text-xs text-white/40">Countries</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Clicks Over Time */}
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-400" />
                  Clicks Over Time
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={analyticsDays}
                    onChange={(e) => setAnalyticsDays(Number(e.target.value))}
                    className="text-xs bg-white/[0.06] border border-white/[0.1] rounded-lg px-2 py-1.5 text-white/70 focus:outline-none"
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>
              </div>
              <ClicksChart data={analytics?.clicks_by_date || []} />
            </div>

            {/* Top Countries */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-cyan-400" />
                Top Countries
              </h2>
              <MiniBarChart data={analytics?.top_countries || []} />
            </div>
          </div>

          {/* Browser & Device Analytics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-brand-400" />
                Browsers
              </h2>
              <MiniBarChart data={analytics?.top_browsers || []} />
            </div>
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
                <Monitor className="w-4 h-4 text-purple-400" />
                Devices
              </h2>
              <MiniBarChart data={analytics?.top_devices || []} />
            </div>
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
                <Monitor className="w-4 h-4 text-emerald-400" />
                Operating Systems
              </h2>
              <MiniBarChart data={analytics?.top_os || []} />
            </div>
          </div>

          {/* URLs List */}
          <div className="glass-card">
            <div className="p-6 border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-brand-400" />
                Your Links
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search links..."
                  className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white
                           placeholder:text-white/30 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              </div>
            ) : filteredUrls.length === 0 ? (
              <div className="p-12 text-center">
                <Link2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No links yet. Create your first one!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {filteredUrls.map((url) => (
                  <div key={url.id} className="p-4 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                        <Link2 className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <a
                            href={url.short_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors truncate"
                          >
                            {url.short_url}
                          </a>
                          <ExternalLink className="w-3 h-3 text-white/20 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-white/40 truncate">{url.original_url}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <MousePointerClick className="w-3 h-3" />
                          {url.click_count}
                        </span>
                        <button
                          onClick={() => copyLink(url.short_url, url.id)}
                          className={`p-2 rounded-lg transition-all ${
                            copiedId === url.id
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'hover:bg-white/[0.06] text-white/40 hover:text-white'
                          }`}
                          title="Copy link"
                        >
                          {copiedId === url.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(url.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/[0.06] flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      page === i + 1
                        ? 'bg-brand-600 text-white'
                        : 'bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create URL Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg glass-card p-6 animate-slide-up border-t-4 border-t-brand-500 shadow-[0_0_40px_rgba(234,179,8,0.15)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Create New Link</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdURL ? (
              <div className="animate-slide-up">
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Link created successfully!</span>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-4">
                  <p className="text-xs text-white/40 mb-1">Short URL</p>
                  <div className="flex items-center gap-2">
                    <a href={createdURL.short_url} target="_blank" rel="noopener noreferrer"
                       className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
                      {createdURL.short_url}
                    </a>
                    <button onClick={() => copyLink(createdURL.short_url, 'modal')}
                            className="p-1 rounded hover:bg-white/[0.1] transition-all">
                      {copiedId === 'modal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                    </button>
                  </div>
                </div>
                {createdURL.qr_code && (
                  <div className="flex items-center gap-4 mb-4">
                    <img src={createdURL.qr_code} alt="QR Code" className="w-24 h-24 rounded-xl bg-white p-1" />
                    <div>
                      <p className="text-sm font-medium text-white/70 flex items-center gap-1"><QrCode className="w-4 h-4" /> QR Code</p>
                      <p className="text-xs text-white/40">Right-click to save</p>
                    </div>
                  </div>
                )}
                <button onClick={() => { setCreatedURL(null); }} className="btn-secondary w-full text-sm">
                  Create Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateURL} className="space-y-4">
                {createError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {createError}
                  </div>
                )}
                <div>
                  <label className="text-sm text-white/50 mb-1.5 block">Destination URL *</label>
                  <input
                    id="create-url"
                    type="url"
                    value={newURL}
                    onChange={(e) => setNewURL(e.target.value)}
                    className="input-field"
                    placeholder="https://example.com/very/long/url"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-1.5 block">Custom Alias (optional)</label>
                  <input
                    id="create-alias"
                    type="text"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="input-field"
                    placeholder="my-brand"
                    minLength={3}
                    maxLength={50}
                  />
                  <p className="text-xs text-white/30 mt-1">3-50 characters, letters and numbers only</p>
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-1.5 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Expires In
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="input-field"
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">1 year</option>
                    <option value="1825">5 years</option>
                  </select>
                </div>
                <button
                  id="create-submit"
                  type="submit"
                  disabled={createLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {createLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Create Short Link
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
