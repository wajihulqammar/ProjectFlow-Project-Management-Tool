'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, FolderKanban, CheckSquare, Users, 
  Settings, Zap, ChevronDown, Plus, Star, BarChart3,
  Bell, Search, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { projectsAPI } from '@/lib/api';
import UserAvatar from '@/components/ui/UserAvatar';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/my-tasks', icon: CheckSquare, label: 'My Tasks' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/team', icon: Users, label: 'Team' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);

  const { data } = useQuery({
    queryKey: ['projects-sidebar'],
    queryFn: () => projectsAPI.getAll({ limit: 8 }),
    select: (res) => res.data.projects,
  });

  const projects = data || [];
  const favorites = projects.filter((p: any) => p.isFavorited);

  return (
    <aside className={cn(
      "flex flex-col h-full border-r border-[hsl(222,15%,14%)] transition-all duration-300 relative",
      "bg-[hsl(222,15%,9%)]",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-4 border-b border-[hsl(222,15%,14%)]", collapsed && "justify-center px-0")}>
        <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-600/30">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-base tracking-tight">ProjectFlow</span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-14 w-6 h-6 bg-[hsl(222,15%,16%)] border border-[hsl(222,15%,20%)] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[hsl(222,15%,20%)] transition-all z-10"
      >
        <ChevronLeft className={cn("w-3 h-3 transition-transform", collapsed && "rotate-180")} />
      </button>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1 scrollbar-thin">
        {/* Main nav */}
        <div className="px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  collapsed && "justify-center px-0 py-3",
                  isActive
                    ? "bg-violet-600/15 text-violet-300 border border-violet-500/20"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[hsl(222,15%,14%)]"
                )}>
                  <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-violet-400")} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 bg-violet-400 rounded-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {!collapsed && (
          <>
            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="pt-3">
                <div className="px-4 mb-1.5">
                  <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Favorites</p>
                </div>
                <div className="px-2 space-y-0.5">
                  {favorites.map((project: any) => (
                    <Link key={project._id} href={`/projects/${project._id}`}>
                      <div className={cn(
                        "sidebar-item flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group",
                        pathname.includes(project._id)
                          ? "bg-[hsl(222,15%,15%)] text-white"
                          : "text-gray-400 hover:text-gray-200 hover:bg-[hsl(222,15%,14%)]"
                      )}>
                        <span className="text-base leading-none">{project.emoji}</span>
                        <span className="truncate">{project.name}</span>
                        <Star className="w-3 h-3 ml-auto text-yellow-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Projects */}
            <div className="pt-3">
              <button
                onClick={() => setProjectsOpen(o => !o)}
                className="w-full flex items-center gap-2 px-4 mb-1.5 group"
              >
                <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest flex-1 text-left">Projects</p>
                <ChevronDown className={cn("w-3 h-3 text-gray-600 transition-transform", !projectsOpen && "-rotate-90")} />
              </button>

              {projectsOpen && (
                <div className="px-2 space-y-0.5">
                  {projects.slice(0, 6).map((project: any) => (
                    <Link key={project._id} href={`/projects/${project._id}`}>
                      <div className={cn(
                        "sidebar-item flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group",
                        pathname.includes(project._id)
                          ? "bg-[hsl(222,15%,15%)] text-white"
                          : "text-gray-400 hover:text-gray-200 hover:bg-[hsl(222,15%,14%)]"
                      )}>
                        <span className="text-base leading-none">{project.emoji}</span>
                        <span className="truncate flex-1">{project.name}</span>
                        <div 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: project.color || '#6b7280' }}
                        />
                      </div>
                    </Link>
                  ))}
                  <Link href="/projects/new">
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-[hsl(222,15%,14%)] transition-all cursor-pointer border border-dashed border-[hsl(222,15%,18%)] hover:border-[hsl(222,15%,25%)] mt-1">
                      <Plus className="w-3.5 h-3.5" />
                      <span>New project</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* User section */}
      <div className={cn(
        "border-t border-[hsl(222,15%,14%)] p-3",
        collapsed ? "flex justify-center" : ""
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[hsl(222,15%,14%)] transition-all cursor-pointer group">
            <UserAvatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.jobTitle || user?.email}</p>
            </div>
            <Link href="/settings">
              <Settings className="w-4 h-4 text-gray-600 hover:text-gray-300 transition-colors" />
            </Link>
          </div>
        ) : (
          <UserAvatar user={user} size="sm" />
        )}
      </div>
    </aside>
  );
}
