'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { login as apiLogin } from '@/lib/api';
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await apiLogin(email, password);
      login(data.token, data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative bg-transparent overflow-y-auto text-current">
      {/* Background Grids & Radial Glows */}
      <div className="absolute inset-0 grid-bg opacity-40 dark:opacity-30 z-0 pointer-events-none" />
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[90%] md:w-[600px] h-[300px] md:h-[400px] bg-brand-500/[0.04] dark:bg-brand-500/5 rounded-full blur-[100px] z-0 pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-purple-500/[0.04] dark:bg-purple-500/5 rounded-full blur-[100px] z-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Brand Logo Header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-400 via-amber-500 to-orange-600 flex items-center justify-center
                          group-hover:shadow-2xl group-hover:shadow-brand-500/25 group-hover:scale-105 transition-all duration-300">
              <Zap className="w-6 h-6 text-black font-extrabold fill-black" />
            </div>
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-neutral-400 tracking-tight">
              FlashLink
            </span>
          </Link>
          <p className="text-neutral-500 text-sm mt-3">High-Performance Link Management</p>
        </div>

        {/* Form Container */}
        <div className="glass-card p-6 sm:p-8 border-t-4 border-t-brand-500 shadow-2xl relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/[0.03] dark:bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
          
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Welcome back</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">Sign in to your FlashLink account</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mb-2 block">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500 group-focus-within:text-brand-500 transition-colors" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500 group-focus-within:text-brand-500 transition-colors" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-slate-800 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full shadow-lg"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4.5 h-4.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-neutral-500">New to FlashLink? </span>
            <Link href="/register" className="font-bold text-brand-500 dark:text-brand-400 hover:underline">
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
