'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  Settings, MoreHorizontal, Star, Plus,
  LayoutDashboard, List, Calendar, BarChart3,
  Clock, CheckSquare, AlertCircle, UserPlus,
  X, Search, Loader2, Crown, Shield, Eye, User
} from 'lucide-react';
import { projectsAPI, usersAPI } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import CalendarView from '@/components/projects/CalendarView';
import KanbanBoard from '@/components/projects/KanbanBoard';
import TaskListView from '@/components/projects/TaskListView';
import toast from 'react-hot-toast';


type View = 'kanban' | 'list' | 'calendar' | 'analytics';

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  owner:   { label: 'Owner',   icon: Crown,  color: 'text-yellow-400' },
  manager: { label: 'Manager', icon: Shield, color: 'text-violet-400' },
  member:  { label: 'Member',  icon: User,   color: 'text-blue-400'   },
  viewer:  { label: 'Viewer',  icon: Eye,    color: 'text-gray-400'   },
};

export default function ProjectPage() {
  const { id } = useParams() as { id: string };
  const [view, setView] = useState<View>('kanban');
  const [showMembers, setShowMembers] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getById(id),
    select: res => res.data.project,
  });

  const project = data;

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  if (!project) return (
    <div className="h-full flex items-center justify-center">
      <p className="text-gray-400">Project not found</p>
    </div>
  );

  const views: { id: View; icon: any; label: string }[] = [
    { id: 'kanban',    icon: LayoutDashboard, label: 'Board'     },
    { id: 'list',      icon: List,            label: 'List'      },
    { id: 'calendar',  icon: Calendar,        label: 'Calendar'  },
    { id: 'analytics', icon: BarChart3,       label: 'Analytics' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-[hsl(222,15%,14%)] bg-[hsl(222,15%,9%)]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: project.color + '20' }}
            >
              {project.emoji}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{project.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-gray-400 capitalize">{project.status?.replace('_', ' ')}</span>
                </div>
                {project.dueDate && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due {formatDate(project.dueDate)}
                  </span>
                )}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  {project.metrics?.completedTasks}/{project.metrics?.totalTasks} tasks
                </span>
                {project.metrics?.overdueTasks > 0 && (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {project.metrics.overdueTasks} overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Progress */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-[hsl(222,15%,13%)] rounded-xl border border-[hsl(222,15%,18%)]">
              <div className="w-24 h-1.5 bg-[hsl(222,15%,20%)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${project.completionPercentage}%`, background: project.color || '#7c5af6' }}
                />
              </div>
              <span className="text-xs font-medium text-gray-300 tabular-nums">{project.completionPercentage}%</span>
            </div>

            {/* Members avatars - clickable */}
            <button
              onClick={() => setShowMembers(true)}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <div className="flex -space-x-1.5">
                {project.members?.slice(0, 4).map((m: any, i: number) => (
                  <UserAvatar key={m.user?._id || i} user={m.user} size="sm" className="ring-2 ring-[hsl(222,15%,9%)]" />
                ))}
              </div>
              {project.members?.length > 4 && (
                <span className="text-xs text-gray-400 ml-1">+{project.members.length - 4}</span>
              )}
            </button>

            {/* Add member button */}
            <button
              onClick={() => setShowMembers(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(222,15%,14%)] hover:bg-[hsl(222,15%,18%)] border border-[hsl(222,15%,20%)] text-gray-300 hover:text-white rounded-lg text-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Members</span>
            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[hsl(222,15%,14%)] text-gray-400 hover:text-gray-200 transition-all">
              <Star className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[hsl(222,15%,14%)] text-gray-400 hover:text-gray-200 transition-all">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-1">
          {views.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2',
                view === v.id
                  ? 'text-violet-300 border-violet-500 bg-violet-500/5'
                  : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-[hsl(222,15%,13%)]'
              )}
            >
              <v.icon className="w-3.5 h-3.5" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {view === 'kanban'    && <KanbanBoard project={project} />}
        {view === 'list'      && <TaskListView project={project} />}
        {view === 'calendar' && <CalendarView project={project} />}
        {view === 'analytics' && <ProjectAnalytics project={project} />}
      </div>

      {/* Members modal */}
      {showMembers && (
        <MembersModal
          project={project}
          onClose={() => { setShowMembers(false); refetch(); }}
        />
      )}
    </div>
  );
}

// ── Members Modal ────────────────────────────────────────────────────────────

function MembersModal({ project, onClose }: { project: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState('member');

  const addMemberMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      projectsAPI.addMember(project._id, { userId, role }),
    onSuccess: () => {
      toast.success('Member added!');
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
      setSearch('');
      setSearchResults([]);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to add member');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectsAPI.removeMember(project._id, userId),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['project', project._id] });
    }
  });

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await usersAPI.search(q);
      const existingIds = project.members.map((m: any) => m.user?._id);
      setSearchResults(res.data.users.filter((u: any) => !existingIds.includes(u._id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,20%)] rounded-2xl shadow-2xl animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(222,15%,16%)]">
          <div>
            <h2 className="text-base font-semibold text-white">Team Members</h2>
            <p className="text-xs text-gray-500 mt-0.5">{project.members?.length} members in {project.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Search to add */}
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Invite Member</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] focus:border-violet-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors"
                />
              </div>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none cursor-pointer"
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {/* Search results */}
            {searching && (
              <div className="flex items-center gap-2 mt-3 px-3 py-2 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-[hsl(222,15%,18%)] rounded-xl overflow-hidden">
                {searchResults.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(222,15%,15%)] transition-all cursor-pointer border-b border-[hsl(222,15%,16%)] last:border-0"
                    onClick={() => addMemberMutation.mutate({ userId: user._id, role: selectedRole })}
                  >
                    <UserAvatar user={user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {addMemberMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      ) : (
                        <span className="text-xs text-violet-400 font-medium px-2 py-1 bg-violet-500/10 rounded-lg border border-violet-500/20">
                          + Add
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {search.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-sm text-gray-600 mt-3 px-3">No users found. Make sure they have an account.</p>
            )}
          </div>

          {/* Current members */}
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Current Members</p>
            <div className="space-y-1">
              {project.members?.map((m: any, i: number) => {
                const roleConfig = ROLE_CONFIG[m.role] || ROLE_CONFIG.member;
                const RoleIcon = roleConfig.icon;
                const isOwner = m.role === 'owner';

                return (
                  <div key={m.user?._id || i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(222,15%,14%)] transition-all group">
                    <UserAvatar user={m.user} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{m.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.user?.email}</p>
                    </div>
                    <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg', roleConfig.color, 'bg-[hsl(222,15%,16%)]')}>
                      <RoleIcon className="w-3 h-3" />
                      {roleConfig.label}
                    </div>
                    {!isOwner && (
                      <button
                        onClick={() => removeMemberMutation.mutate(m.user?._id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Analytics tab ────────────────────────────────────────────────────────────

function ProjectAnalytics({ project }: { project: any }) {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-5">
        <p className="text-gray-400 text-sm mb-1">Total Tasks</p>
        <p className="text-3xl font-bold text-white">{project.metrics?.totalTasks || 0}</p>
      </div>
      <div className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-5">
        <p className="text-gray-400 text-sm mb-1">Completed</p>
        <p className="text-3xl font-bold text-emerald-400">{project.metrics?.completedTasks || 0}</p>
      </div>
      <div className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-5">
        <p className="text-gray-400 text-sm mb-1">Overdue</p>
        <p className="text-3xl font-bold text-red-400">{project.metrics?.overdueTasks || 0}</p>
      </div>
      <div className="col-span-full bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Overall Progress</h3>
        <div className="h-4 bg-[hsl(222,15%,18%)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${project.completionPercentage}%`, background: project.color || '#7c5af6' }}
          />
        </div>
        <p className="text-gray-400 text-sm mt-2">{project.completionPercentage}% complete</p>
      </div>
    </div>
  );
}