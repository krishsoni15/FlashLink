'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Link2, Copy, Check, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [result, setResult] = useState<{ short_code: string; short_url: string; qr_code?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="min-h-screen bg-black grid-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center mb-12 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-400 mb-6">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">Performance-First Architecture</span>
        </div>
        <h1 className="text-5xl font-bold text-white mb-4">
          Lightning Fast <span className="gradient-text">Links</span>
        </h1>
        <p className="text-white/50 text-lg">
          Sub-millisecond redirects powered by Redis and Go. No auth, no bloat, just speed.
        </p>
      </div>

      <div className="w-full max-w-2xl glass-card p-6 md:p-8 border-t-4 border-t-brand-500 shadow-[0_0_40px_rgba(234,179,8,0.15)] animate-slide-up" style={{ animationDelay: '100ms' }}>
        <form onSubmit={handleShorten} className="space-y-4">
          <div>
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your long URL here..."
                className="input-field pl-12 text-lg py-4"
                required
              />
            </div>
          </div>
          <div className="flex gap-4">
            <input
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              placeholder="Custom alias (optional)"
              className="input-field flex-1"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary min-w-[140px] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Shorten
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 pt-8 border-t border-white/10 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {result.qr_code && (
                <div className="p-3 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] flex-shrink-0">
                  <img src={result.qr_code} alt="QR Code" className="w-32 h-32" />
                </div>
              )}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <p className="text-xs text-brand-400 font-bold uppercase tracking-wider mb-2">Your link is ready</p>
                  <a href={result.short_url} target="_blank" rel="noopener noreferrer" className="text-2xl font-bold text-white hover:text-brand-400 transition-colors break-all">
                    {result.short_url}
                  </a>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={copyToClipboard} className="btn-secondary flex-1 flex justify-center items-center gap-2">
                    {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <Link href={`/analytics/${result.short_code}`} className="btn-secondary flex-1 flex justify-center items-center gap-2 border-brand-500/30 text-brand-400 hover:bg-brand-500/10 hover:border-brand-500/50">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
