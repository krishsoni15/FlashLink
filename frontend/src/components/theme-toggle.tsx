'use client';

import { useTheme } from '@/lib/theme-context';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch: only render icon on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl bg-white/[0.02] border border-white/[0.06] shrink-0" />
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4.5 h-4.5 text-amber-500 animate-fade-in" />;
      case 'dark':
        return <Moon className="w-4.5 h-4.5 text-purple-400 animate-fade-in" />;
      case 'system':
        return <Monitor className="w-4.5 h-4.5 text-neutral-400 animate-fade-in" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'system':
        return 'System Adaptive';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] 
                 text-neutral-400 hover:text-white transition-all duration-300 relative group flex items-center justify-center shrink-0 active:scale-95"
      aria-label="Toggle visual theme"
      title={`Theme: ${getLabel()}`}
    >
      <div className="transition-transform duration-500 hover:rotate-[360deg]">
        {getIcon()}
      </div>
      
      {/* Premium micro tooltip */}
      <span className="absolute top-12 scale-0 group-hover:scale-100 transition-all duration-200 origin-top text-[10px] font-bold uppercase tracking-wider
                       bg-neutral-900 dark:bg-neutral-800 text-white px-2 py-1 rounded-md border border-white/[0.08] shadow-lg whitespace-nowrap z-50">
        {getLabel()}
      </span>
    </button>
  );
}
