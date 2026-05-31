'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Key, Plus, Copy, Trash2, Check, Clock, ShieldAlert } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
}

export default function APIKeysPage() {
  const { token } = useAuth();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  
  // Show plaintext key only once
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{plain_key: string, name: string} | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchKeys();
    }
  }, [token]);

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api-keys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch keys', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    try {
      setIsCreating(true);
      const res = await fetch(`${API_URL}/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKeyName })
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedKey(data);
        setNewKeyName('');
        fetchKeys();
      }
    } catch (error) {
      console.error('Failed to create key', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API Key? Any integrations using it will instantly fail.')) return;
    
    try {
      const res = await fetch(`${API_URL}/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchKeys();
      }
    } catch (error) {
      console.error('Failed to delete key', error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:p-8 space-y-8 relative z-10 text-current">
      
      {/* Header page title */}
      <div className="pb-6 border-b border-black/[0.04] dark:border-white/[0.04]">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Key className="w-7 h-7 text-brand-500 dark:text-brand-400" />
          Developer API Keys
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Manage secure tokens for programmatic access to the FlashLink REST APIs.
        </p>
      </div>

      {/* Newly Created plaintext Key Warning block */}
      {newlyCreatedKey && (
        <div className="p-6 bg-brand-500/5 border border-brand-500/20 rounded-2xl space-y-4 animate-slide-up shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-brand-500 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-brand-500 dark:text-brand-300 font-bold text-base">Store this key securely!</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                For security reasons, this is the **ONLY** time you will be able to see the full plaintext key. If you navigate away or close this block, you will need to generate a new key.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#09090d]/80 p-3.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08]">
            <code className="text-brand-500 dark:text-brand-400 font-mono text-sm flex-1 break-all select-all font-bold">
              {newlyCreatedKey.plain_key}
            </code>
            <button
              onClick={() => copyToClipboard(newlyCreatedKey.plain_key, 'new')}
              className={`p-2.5 rounded-xl border transition-all duration-300 ${
                copiedKey === 'new'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Copy full key"
            >
              {copiedKey === 'new' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <button 
            onClick={() => setNewlyCreatedKey(null)}
            className="btn-primary text-xs font-bold py-2.5 px-4 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 dark:text-brand-400 border border-brand-500/20 flex items-center gap-1.5 self-start shadow-none"
          >
            <Check className="w-4 h-4 text-current" /> I have copied and saved this key
          </button>
        </div>
      )}

      {/* Grid: Creator Form on Left, Active List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* API Key Creator Container */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 border-t-4 border-t-brand-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-500 dark:text-brand-400" />
              Create New Key
            </h2>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Friendly Key Name</label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Automation Node"
                  className="input-field"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating || !newKeyName.trim()}
                className="btn-primary w-full shadow-lg"
              >
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="w-4.5 h-4.5 fill-black" /> Generate API Key
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* API Keys Table/Card List Container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card overflow-hidden">
            
            {/* Header prefix */}
            <div className="p-5 sm:p-6 border-b border-black/[0.04] dark:border-white/[0.04] bg-slate-50/[0.3] dark:bg-white/[0.01]">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                <Key className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                Active API Credentials
              </h2>
            </div>

            {/* Desktop Table View (hidden on mobile, shown on md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.04] dark:border-white/[0.04] bg-slate-50/[0.1] dark:bg-white/[0.005]">
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Key Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Key Prefix</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Last API Usage</th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.03]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : keys.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Key className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm">No developer keys registered yet.</p>
                      </td>
                    </tr>
                  ) : (
                    keys.map((k) => (
                      <tr key={k.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.015] transition-colors group">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-neutral-200">
                          {k.name}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs text-brand-500 dark:text-brand-400 bg-brand-500/5 border border-brand-500/10 px-2.5 py-1 rounded-lg font-bold font-mono">
                            {k.key_prefix}*********
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                            {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never used'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(k.id)}
                            className="p-2 bg-slate-100 hover:bg-red-500/10 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] hover:border-red-500/20 hover:border-red-500/20 text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all duration-300"
                            title="Revoke and delete credential"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Credentials Card stack (shown on mobile, hidden on md+) */}
            <div className="md:hidden divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {isLoading ? (
                <div className="p-12 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : keys.length === 0 ? (
                <div className="p-12 text-center">
                  <Key className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-neutral-500 text-sm">No developer keys registered.</p>
                </div>
              ) : (
                keys.map((k) => (
                  <div key={k.id} className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-neutral-200">{k.name}</h4>
                        <code className="text-[10px] text-brand-500 dark:text-brand-400 bg-brand-500/5 border border-brand-500/10 px-2 py-0.5 rounded-md font-bold font-mono mt-1.5 inline-block">
                          fl_{k.key_prefix}...
                        </code>
                      </div>
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="p-2 bg-slate-100 dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] text-neutral-400 hover:text-red-500 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.04] text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
                      Last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
