'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell, Plus, Command, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/my-tasks': 'My Tasks',
  '/analytics': 'Analytics',
  '/team': 'Team',
  '/settings': 'Settings',
};

export default function Header() {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const pageTitle = PAGE_TITLES[pathname] || (pathname.includes('/projects/') ? 'Project' : 'ProjectFlow');

  // Keyboard shortcut: cmd+k to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  return (
    <>
      <header className="h-14 flex items-center justify-between px-6 border-b border-[hsl(222,15%,14%)] bg-[hsl(222,15%,9%)] flex-shrink-0">
        {/* Left - breadcrumb/title */}
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-100">{pageTitle}</h1>
          <div className={cn(
            "hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
            isConnected
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
          )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-emerald-400 status-dot-active" : "bg-gray-500")} />
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>

        {/* Right - actions */}
        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(222,15%,14%)] hover:bg-[hsl(222,15%,17%)] border border-[hsl(222,15%,18%)] rounded-lg text-gray-400 hover:text-gray-200 transition-all text-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:block text-xs">Search...</span>
            <div className="hidden md:flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-[hsl(222,15%,10%)] rounded text-[10px] text-gray-600">
              <Command className="w-2.5 h-2.5" />K
            </div>
          </button>

          {/* Create button */}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-all shadow-sm shadow-violet-600/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Create</span>
          </button>

          {/* Notifications */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[hsl(222,15%,14%)] text-gray-400 hover:text-gray-200 transition-all">
            <Bell className="w-4 h-4" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-[hsl(222,15%,9%)]" />
          </button>

          {/* User avatar */}
          <UserAvatar user={user} size="sm" className="cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all" />
        </div>
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,20%)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[hsl(222,15%,16%)]">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search projects, tasks, team members..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
              />
              <button onClick={() => setSearchOpen(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3">
              <p className="text-gray-600 text-xs px-2 py-4 text-center">Start typing to search...</p>
            </div>
            <div className="px-4 py-2.5 border-t border-[hsl(222,15%,16%)] flex items-center gap-4 text-[11px] text-gray-600">
              <span className="flex items-center gap-1"><kbd className="bg-[hsl(222,15%,16%)] px-1.5 py-0.5 rounded text-gray-500">↵</kbd> Select</span>
              <span className="flex items-center gap-1"><kbd className="bg-[hsl(222,15%,16%)] px-1.5 py-0.5 rounded text-gray-500">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="bg-[hsl(222,15%,16%)] px-1.5 py-0.5 rounded text-gray-500">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}

      {createOpen && <CreateTaskModal onClose={() => setCreateOpen(false)} />}
    </>
  );
}
