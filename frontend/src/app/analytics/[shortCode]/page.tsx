'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MousePointerClick, Zap, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const { shortCode } = useParams();
  const [data, setData] = useState<{ total_clicks: number; recent_clicks: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/urls/${shortCode}/analytics`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 3000); // Live update every 3s
    return () => clearInterval(interval);
  }, [shortCode]);

  if (loading) {
    return <div className="min-h-screen bg-black grid-bg flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black grid-bg flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-white mb-4">Not Found</h1>
        <Link href="/" className="btn-primary inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black grid-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-white/40 hover:text-white flex items-center gap-2 text-sm mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="text-brand-500" />
              Analytics for <span className="text-brand-400">/{shortCode}</span>
            </h1>
          </div>
          <a href={`http://localhost:8080/${shortCode}`} target="_blank" className="btn-secondary hidden sm:flex">
            Test Link
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-8 border-t-4 border-t-brand-500 shadow-[0_0_30px_rgba(234,179,8,0.1)] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
              <MousePointerClick className="w-8 h-8" />
            </div>
            <p className="text-white/50 mb-1">Total Clicks</p>
            <p className="text-6xl font-black text-white">{data?.total_clicks}</p>
          </div>

          <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 text-white/50 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <p className="text-white/50 mb-1">Redirect Latency</p>
            <p className="text-5xl font-black gradient-text">{'< 1ms'}</p>
            <p className="text-xs text-white/30 mt-2">Redis-powered hot path</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Live Activity (Last 50 clicks)</h2>
          <div className="space-y-3">
            {data?.recent_clicks?.length === 0 ? (
              <p className="text-white/30 text-center py-8">No clicks recorded yet. Share your link!</p>
            ) : (
              data?.recent_clicks?.map((click, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-sm text-white/70">Click recorded via API</span>
                  <span className="text-xs text-white/40">{new Date(click.timestamp).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
