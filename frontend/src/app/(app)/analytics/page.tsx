'use client';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Target, Clock, CheckSquare } from 'lucide-react';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6'];
const TOOLTIP_STYLE = { background: 'hsl(222,15%,14%)', border: '1px solid hsl(222,15%,22%)', borderRadius: '10px', color: '#e2e8f0', fontSize: '13px' };

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.getStats(),
    select: res => res.data,
  });

  if (isLoading) return <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_,i) => <div key={i} className="h-40 shimmer rounded-2xl" />)}</div>;

  const { stats, completionTrend, priorityDistribution, projects } = data || {};
  const pieData = (priorityDistribution || []).map((p: any) => ({ name: p._id || 'none', value: p.count }));
  const trendData = (completionTrend || []).map((d: any) => ({ day: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }), tasks: d.count }));
  const projectProgress = (projects || []).map((p: any) => ({ name: (p.emoji||'📋')+' '+p.name.slice(0,12), progress: p.completionPercentage, total: p.totalTasks }));

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div><h1 className="text-xl font-bold text-white mb-1">Analytics</h1><p className="text-gray-400 text-sm">Your productivity insights</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: stats?.totalProjects||0, icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Active Projects', value: stats?.activeProjects||0, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Open Tasks', value: stats?.myTasks||0, icon: CheckSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Overdue', value: stats?.overdueTasks||0, icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map((card, i) => (
          <div key={i} className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-5">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-4`}><card.icon className={`w-5 h-5 ${card.color}`} /></div>
            <p className="text-3xl font-bold text-white tabular-nums mb-1">{card.value}</p>
            <p className="text-sm text-gray-400">{card.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-1">Daily Completions</h3>
          <p className="text-gray-500 text-xs mb-5">Tasks completed in the last 7 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} barSize={28}>
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="tasks" fill="#7c5af6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-1">Tasks by Priority</h3>
          <p className="text-gray-500 text-xs mb-5">Distribution of open tasks</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Legend formatter={(v: string) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{v}</span>} /><Tooltip contentStyle={TOOLTIP_STYLE} /></PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-48 text-gray-600 text-sm">No task data yet</div>}
        </div>
        {projectProgress.length > 0 && (
          <div className="lg:col-span-2 bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-1">Project Progress</h3>
            <p className="text-gray-500 text-xs mb-5">Completion across projects</p>
            <ResponsiveContainer width="100%" height={Math.max(180, projectProgress.length * 35)}>
              <BarChart data={projectProgress} layout="vertical" barSize={14}>
                <XAxis type="number" domain={[0,100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v+'%'} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
                <Tooltip formatter={(v: any) => [v+'%', 'Progress']} contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="progress" fill="#7c5af6" radius={[0,6,6,0]} background={{ fill: 'hsl(222,15%,18%)', radius: 6 } as any} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
