'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, Filter, Grid, List, Star, Clock, Users, CheckSquare, MoreHorizontal, Zap } from 'lucide-react';
import { projectsAPI } from '@/lib/api';
import { cn, formatDate, PRIORITY_CONFIG } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import CreateProjectModal from '@/components/projects/CreateProjectModal';

const STATUS_COLORS: Record<string, string> = {
  planning: '#6b7280',
  active: '#10b981',
  on_hold: '#f59e0b',
  completed: '#3b82f6',
  cancelled: '#ef4444',
};

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', search, statusFilter],
    queryFn: () => projectsAPI.getAll({ search, status: statusFilter || undefined }),
    select: res => res.data,
  });

  const projects = data?.projects || [];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">All Projects</h1>
          <p className="text-gray-400 text-sm">{data?.pagination?.total || 0} projects</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-violet-600/25"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-violet-500 cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>

        <div className="flex items-center gap-1 bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300")}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300")}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 shimmer rounded-2xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4 border border-violet-500/20">
            <Zap className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-white font-semibold mb-2">No projects yet</h3>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">Create your first project and start organizing your work beautifully.</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> Create your first project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project: any) => (
            <ProjectCard key={project._id} project={project} onUpdate={refetch} />
          ))}
          <button
            onClick={() => setCreateOpen(true)}
            className="h-52 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[hsl(222,15%,20%)] hover:border-violet-500/50 rounded-2xl text-gray-500 hover:text-gray-300 transition-all group"
          >
            <div className="w-10 h-10 bg-[hsl(222,15%,16%)] group-hover:bg-violet-500/10 rounded-xl flex items-center justify-center transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">New Project</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((project: any) => (
            <ProjectRow key={project._id} project={project} />
          ))}
        </div>
      )}

      {createOpen && <CreateProjectModal onClose={() => { setCreateOpen(false); refetch(); }} />}
    </div>
  );
}

function ProjectCard({ project, onUpdate }: { project: any; onUpdate: () => void }) {
  return (
    <Link href={`/projects/${project._id}`}>
      <div className="h-52 bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-5 hover:border-[hsl(222,15%,22%)] transition-all cursor-pointer group relative overflow-hidden">
        {/* Color strip */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: project.color || '#7c5af6' }} />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3 pt-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{project.emoji}</span>
            <div>
              <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-violet-300 transition-colors">{project.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[project.status] || '#6b7280' }} />
                <span className="text-xs text-gray-500 capitalize">{project.status?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          {project.isFavorited && <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
        </div>

        <p className="text-gray-400 text-xs line-clamp-2 mb-4 leading-relaxed">{project.description || 'No description'}</p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs text-gray-400 tabular-nums font-medium">{project.completionPercentage}%</span>
          </div>
          <div className="h-1.5 bg-[hsl(222,15%,18%)] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all"
              style={{ width: `${project.completionPercentage}%`, background: project.color || '#7c5af6' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {project.members?.slice(0, 4).map((m: any) => (
              <UserAvatar key={m.user?._id} user={m.user} size="xs" className="ring-2 ring-[hsl(222,15%,11%)]" />
            ))}
            {project.members?.length > 4 && (
              <div className="w-5 h-5 rounded-full bg-[hsl(222,15%,20%)] border-2 border-[hsl(222,15%,11%)] flex items-center justify-center text-[9px] text-gray-400">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />
              {project.metrics?.completedTasks}/{project.metrics?.totalTasks}
            </span>
            {project.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(project.dueDate, 'MMM d')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProjectRow({ project }: { project: any }) {
  return (
    <Link href={`/projects/${project._id}`}>
      <div className="flex items-center gap-4 px-5 py-3.5 bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-xl hover:border-[hsl(222,15%,22%)] transition-all cursor-pointer">
        <span className="text-xl">{project.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">{project.name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[project.status] }} />
          <span className="text-xs text-gray-400 capitalize hidden sm:block">{project.status?.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-2 w-36 hidden md:flex">
          <div className="flex-1 h-1.5 bg-[hsl(222,15%,18%)] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${project.completionPercentage}%`, background: project.color || '#7c5af6' }} />
          </div>
          <span className="text-xs text-gray-500 tabular-nums">{project.completionPercentage}%</span>
        </div>
        <div className="flex -space-x-1.5">
          {project.members?.slice(0, 3).map((m: any) => (
            <UserAvatar key={m.user?._id} user={m.user} size="xs" className="ring-2 ring-[hsl(222,15%,11%)]" />
          ))}
        </div>
        {project.dueDate && (
          <span className="text-xs text-gray-500 hidden lg:block whitespace-nowrap">
            Due {formatDate(project.dueDate, 'MMM d')}
          </span>
        )}
      </div>
    </Link>
  );
}
