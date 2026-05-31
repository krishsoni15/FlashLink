'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Zap, BarChart3, Link2, Key, LogOut, Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <Zap className="w-5 h-5 text-brand-500 dark:text-brand-400 absolute animate-pulse" />
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: BarChart3 },
    { name: 'My Links', path: '/dashboard/links', icon: Link2 },
    { name: 'API Keys', path: '/dashboard/api-keys', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-transparent text-current selection:bg-brand-500 selection:text-black transition-colors duration-300">
      {/* Grid background overlay */}
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-40 dark:opacity-30 z-0" />
      {/* Ambient Radial Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/[0.03] dark:bg-brand-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/[0.03] dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-black/[0.04] dark:border-white/[0.04] bg-[#ffffff]/70 dark:bg-[#09090c]/70 backdrop-blur-xl z-40 hidden lg:flex flex-col transition-all duration-300">
        {/* Sidebar Logo */}
        <div className="p-6 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-2 transition-colors duration-300">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center shadow-lg shadow-brand-500/10 group-hover:shadow-brand-500/25 group-hover:scale-105 transition-all duration-300">
              <Zap className="w-5 h-5 text-black font-extrabold fill-black" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-neutral-600 dark:from-white dark:via-white dark:to-neutral-400 tracking-tight group-hover:text-brand-300 transition-colors duration-300">
              FlashLink
            </span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500/10 to-brand-500/5 border border-brand-500/20 text-brand-500 dark:text-brand-400 shadow-[0_0_15px_rgba(234,179,8,0.05)]'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400 dark:text-neutral-500 group-hover:text-slate-950 dark:group-hover:text-white'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Block & Logout */}
        <div className="p-4 border-t border-black/[0.04] dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#0c0c0f]/40 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-orange-500 rounded-xl blur opacity-20 dark:opacity-30 group-hover:opacity-60 transition duration-300" />
              <div className="relative w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#141419] flex items-center justify-center text-brand-500 dark:text-brand-400 font-bold border border-black/10 dark:border-white/10 text-sm shadow-sm">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 dark:text-neutral-200 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-600 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all duration-300 font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-black/[0.04] dark:border-white/[0.04] bg-white/80 dark:bg-[#050507]/80 backdrop-blur-xl z-40 flex items-center justify-between px-4 transition-all duration-300">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center shadow-lg shadow-brand-500/10">
            <Zap className="w-4 h-4 text-black font-extrabold fill-black" />
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-neutral-400 tracking-tight">
            FlashLink
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors text-slate-700 dark:text-neutral-300"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Menu Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur overlay */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-[#09090c] border-l border-black/[0.06] dark:border-white/[0.06] shadow-2xl flex flex-col p-6 animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-black/[0.05] dark:border-white/[0.05]">
              <Link href="/" className="flex items-center gap-2 group" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-black font-extrabold fill-black" />
                </div>
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-neutral-400">
                  FlashLink
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors text-slate-700 dark:text-neutral-300"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 py-8 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-500/10 to-brand-500/5 border border-brand-500/20 text-brand-500 dark:text-brand-400'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-brand-500 dark:text-brand-400' : 'text-slate-400 dark:text-neutral-500 group-hover:text-slate-950 dark:group-hover:text-white'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Footer user profile & Logout */}
            <div className="pt-6 border-t border-black/[0.05] dark:border-white/[0.05]">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center text-black font-extrabold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-slate-800 dark:text-neutral-200 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{user?.email || ''}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-slate-600 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all duration-300 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="lg:pl-64 min-h-screen pt-16 lg:pt-0 relative z-10">
        {children}
      </main>
    </div>
  );
}
