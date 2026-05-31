'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserURLs, deleteURL, URLResponse } from '@/lib/api';
import { Link2, Search, Trash2, Copy, Check, ExternalLink, QrCode, X, Calendar, MousePointerClick, ArrowUpRight, Download } from 'lucide-react';

export default function MyLinksPage() {
  const { token } = useAuth();
  const [urls, setUrls] = useState<URLResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // QR modal state
  const [activeQrUrl, setActiveQrUrl] = useState<URLResponse | null>(null);

  useEffect(() => {
    if (token) fetchUrls();
  }, [token]);

  const fetchUrls = async () => {
    try {
      setIsLoading(true);
      const data = await getUserURLs(token!, 1, 100); // Fetch up to 100 links for full listing
      setUrls(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this link?')) return;
    try {
      await deleteURL(token, id);
      fetchUrls();
    } catch (err) {
      console.error(err);
    }
  };

  const copyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUrls = urls.filter(u =>
    u.original_url.toLowerCase().includes(search.toLowerCase()) ||
    u.short_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:p-8 space-y-8 relative z-10 text-current">
      
      {/* Header & Search block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.04] dark:border-white/[0.04]">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Link2 className="w-7 h-7 text-brand-500 dark:text-brand-400" />
            My Short Links
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage and track your shortened URLs</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search links by alias or path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-[#09090d]/60 border border-black/[0.08] dark:border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-current placeholder-neutral-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider animate-pulse">Loading links</p>
        </div>
      ) : filteredUrls.length === 0 ? (
        <div className="glass-card p-16 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Link2 className="w-7 h-7 text-neutral-400 dark:text-neutral-600" />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-white text-base">No links found</h3>
          <p className="text-neutral-500 text-sm mt-1.5">Create your first link on the dashboard to get started!</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE LAYOUT (hidden on mobile, shown on md and larger) */}
          <div className="hidden md:block glass-card overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.04] dark:border-white/[0.04] bg-slate-50/[0.3] dark:bg-white/[0.01]">
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Short Link</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Original Destination</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total Clicks</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Date Created</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.03] bg-slate-50/[0.1] dark:bg-[#07070b]/20">
                  {filteredUrls.map((url) => (
                    <tr key={url.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.015] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <a href={url.short_url} target="_blank" rel="noopener noreferrer" className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 font-bold transition-colors">
                            {url.short_url}
                          </a>
                          <button
                            onClick={() => copyLink(url.short_url, url.id)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.12] dark:hover:border-white/[0.2] rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-brand-400 transition-all opacity-0 group-hover:opacity-100"
                            title="Copy link"
                          >
                            {copiedId === url.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 max-w-sm xl:max-w-md">
                          <span className="text-sm text-slate-700 dark:text-neutral-300 truncate" title={url.original_url}>{url.original_url}</span>
                          <a href={url.original_url} target="_blank" rel="noreferrer" className="text-neutral-400 dark:text-neutral-500 hover:text-slate-900 dark:hover:text-white shrink-0">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-neutral-900 border border-black/[0.04] dark:border-white/[0.04] text-xs font-semibold text-slate-700 dark:text-neutral-300">
                          <MousePointerClick className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          {url.click_count.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                        {new Date(url.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setActiveQrUrl(url)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] hover:border-black/[0.18] dark:hover:border-white/[0.18] text-neutral-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all" 
                            title="View QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(url.id)}
                            className="p-2 bg-slate-100 hover:bg-red-500/10 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] hover:border-red-500/20 hover:border-red-500/20 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all" 
                            title="Delete Link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE RESPONSIVE LAYOUT (shown on mobile, hidden on md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredUrls.map((url) => (
              <div key={url.id} className="glass-card p-5 space-y-4 hover:border-brand-500/20 transition-all">
                
                {/* Short link heading */}
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <a href={url.short_url} target="_blank" rel="noopener noreferrer" className="text-base font-extrabold text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors break-all flex items-center gap-1">
                      {url.short_url}
                      <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600 shrink-0" />
                    </a>
                    <p className="text-xs text-neutral-500 truncate font-mono mt-1" title={url.original_url}>
                      {url.original_url}
                    </p>
                  </div>
                  
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyLink(url.short_url, url.id)}
                      className={`p-2 rounded-lg border transition-all duration-300 ${
                        copiedId === url.id
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06] text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {copiedId === url.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={() => setActiveQrUrl(url)}
                      className="p-2 bg-slate-100 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] text-neutral-500 dark:text-neutral-400 rounded-lg"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(url.id)}
                      className="p-2 bg-slate-100 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] text-neutral-500 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info summary footer inside card */}
                <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-neutral-300">
                    <MousePointerClick className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    {url.click_count.toLocaleString()} clicks
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    {new Date(url.created_at).toLocaleDateString()}
                  </span>
                </div>

              </div>
            ))}
          </div>
        </>
      )}

      {/* QR Code Viewer Modal */}
      {activeQrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-md animate-fade-in" onClick={() => setActiveQrUrl(null)} />
          <div className="relative w-full max-w-sm glass-card p-6 sm:p-8 animate-slide-up border-t-4 border-t-brand-500 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                Link QR Code
              </h2>
              <button onClick={() => setActiveQrUrl(null)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-neutral-500 hover:text-slate-900 dark:hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Content */}
            <div className="space-y-6 flex flex-col items-center">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xl flex-shrink-0 animate-scale-up">
                <img 
                  src={activeQrUrl.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(activeQrUrl.short_url)}&margin=10`} 
                  alt="QR Code" 
                  className="w-48 h-48 object-contain rounded-xl" 
                />
              </div>

              <div className="text-center w-full space-y-1.5">
                <p className="text-sm font-extrabold text-slate-800 dark:text-neutral-200 truncate w-full" title={activeQrUrl.short_url}>
                  {activeQrUrl.short_url}
                </p>
                <p className="text-xs text-neutral-500">Scan this code on any mobile device to immediately navigate to the destination link.</p>
              </div>

              <div className="w-full pt-4 border-t border-black/[0.04] dark:border-white/[0.04]">
                <button
                  onClick={() => {
                    if (activeQrUrl.qr_code) {
                      const link = document.createElement('a');
                      link.href = activeQrUrl.qr_code;
                      link.download = `qrcode-${activeQrUrl.short_code}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  disabled={!activeQrUrl.qr_code}
                  className="btn-primary w-full text-sm font-bold flex items-center justify-center gap-2 py-3"
                >
                  <Download className="w-4.5 h-4.5" /> Download QR Code Image
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
