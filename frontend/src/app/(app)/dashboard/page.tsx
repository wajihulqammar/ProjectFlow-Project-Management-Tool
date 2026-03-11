'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  FolderKanban, CheckSquare, AlertCircle, TrendingUp,
  Clock, ArrowRight, Zap, Calendar, Activity
} from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { formatRelativeDate, formatDate, PRIORITY_CONFIG, STATUS_CONFIG, cn } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import { useAuth } from '@/context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.getStats(),
    select: res => res.data,
    refetchInterval: 30000,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) return <DashboardSkeleton />;

  const { stats, recentActivity, upcomingTasks, completionTrend, projects } = data || {};

  const statCards = [
    { label: 'Active Projects', value: stats?.activeProjects || 0, total: stats?.totalProjects, icon: FolderKanban, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { label: 'My Open Tasks', value: stats?.myTasks || 0, icon: CheckSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Overdue', value: stats?.overdueTasks || 0, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: 'Done This Week', value: stats?.completedThisWeek || 0, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/projects/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-violet-600/25">
            <Zap className="w-4 h-4" />
            New Project
          </button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={cn("bg-[hsl(222,15%,11%)] border rounded-2xl p-5 transition-all hover:border-[hsl(222,15%,22%)]", card.border)}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", card.bg, "border", card.border)}>
              <card.icon className={cn("w-5 h-5", card.color)} />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tabular-nums">{card.value}</span>
                {card.total !== undefined && (
                  <span className="text-gray-500 text-sm">/ {card.total}</span>
                )}
              </div>
              <p className="text-gray-400 text-sm">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion trend chart */}
        <div className="lg:col-span-2 bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold">Task Completion</h3>
              <p className="text-gray-400 text-xs mt-0.5">Tasks completed per day over last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
              7 days
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={completionTrend || []}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5af6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c5af6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={d => new Date(d).toLocaleDateString('en', { weekday: 'short' })}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(222, 15%, 14%)',
                  border: '1px solid hsl(222, 15%, 22%)',
                  borderRadius: '10px',
                  color: '#e2e8f0',
                  fontSize: '13px'
                }}
                formatter={(value: any) => [value, 'Tasks completed']}
                labelFormatter={l => formatDate(l, 'MMMM d')}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#7c5af6" 
                strokeWidth={2}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming tasks */}
        <div className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Due Soon</h3>
            <Link href="/my-tasks" className="text-violet-400 hover:text-violet-300 text-sm transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingTasks?.length ? upcomingTasks.map((task: any) => (
              <div key={task._id} className="flex items-start gap-3 p-3 bg-[hsl(222,15%,14%)] rounded-xl hover:bg-[hsl(222,15%,16%)] transition-all cursor-pointer group">
                <div className="w-4 h-4 mt-0.5 border border-gray-600 rounded flex-shrink-0 group-hover:border-violet-500 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">{task.project?.emoji}</span>
                    <span className="text-xs text-gray-500 truncate">{task.project?.name}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={cn("text-xs font-medium", task.dueDate && new Date(task.dueDate) < new Date() ? "text-red-400" : "text-amber-400")}>
                    <Clock className="w-3 h-3 inline mr-0.5" />
                    {task.dueDate ? formatDate(task.dueDate, 'MMM d') : '–'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">My Projects</h3>
            <Link href="/projects" className="text-violet-400 hover:text-violet-300 text-sm transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {projects?.map((project: any) => (
              <Link key={project._id} href={`/projects/${project._id}`}>
                <div className="flex items-center gap-3 p-3 bg-[hsl(222,15%,14%)] rounded-xl hover:bg-[hsl(222,15%,16%)] transition-all cursor-pointer">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: project.color + '20' }}>
                    {project.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{project.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-[hsl(222,15%,20%)] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ width: `${project.completionPercentage}%`, background: project.color || '#7c5af6' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">{project.completionPercentage}%</span>
                    </div>
                  </div>
                  <div className="flex -space-x-1.5">
  {project.members?.slice(0, 3).map((m: any, idx: number) => (
    <UserAvatar key={m.user?._id || idx} user={m.user} size="xs" className="ring-2 ring-[hsl(222,15%,14%)]" />
  ))}
</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Recent Activity</h3>
            <Activity className="w-4 h-4 text-gray-500" />
          </div>
          <div className="space-y-3">
            {recentActivity?.map((activity: any) => (
              <div key={activity._id} className="flex items-start gap-3">
                <UserAvatar user={activity.actor} size="sm" className="flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    <span className="font-medium text-gray-200">{activity.actor?.name?.split(' ')[0]}</span>
                    {' '}{activity.description?.replace(activity.actor?.name?.split(' ')[0] + ' ', '') || activity.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{formatRelativeDate(activity.createdAt)}</p>
                </div>
              </div>
            ))}
            {!recentActivity?.length && (
              <div className="text-center py-6">
                <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="h-12 w-64 shimmer rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 shimmer rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 shimmer rounded-2xl" />
        <div className="h-72 shimmer rounded-2xl" />
      </div>
    </div>
  );
}
