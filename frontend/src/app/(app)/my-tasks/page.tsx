'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Calendar, Flag } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn, PRIORITY_CONFIG, formatDate } from '@/lib/utils';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import toast from 'react-hot-toast';

type FilterType = 'assigned' | 'overdue' | 'today' | 'upcoming';

export default function MyTasksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('assigned');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Get all projects user belongs to
  const { data: projectsData } = useQuery({
    queryKey: ['my-projects-ids'],
    queryFn: () => api.get('/projects', { params: { limit: 100 } }),
    select: res => res.data.projects || [],
    enabled: !!user?._id,
  });

  const projects = projectsData || [];

  // Fetch all tasks from all projects
  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks-all', projects.map((p: any) => p._id).join(',')],
    queryFn: async () => {
      if (!projects.length) return [];
      const results = await Promise.all(
        projects.map((p: any) =>
          api.get('/tasks', { params: { projectId: p._id, limit: 500 } })
            .then(res => res.data.tasks.map((t: any) => ({
              ...t,
              project: { _id: p._id, name: p.name, emoji: p.emoji, color: p.color }
            })))
            .catch(() => [])
        )
      );
      return results.flat();
    },
    enabled: projects.length > 0,
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => api.put(`/tasks/${taskId}`, { status: 'done', column: 'done' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks-all'] });
      toast.success('Task completed! 🎉');
    }
  });

  const now = new Date();
  const myId = String(user?._id || '');
  const activeTasks = allTasks.filter((t: any) =>
    t.status !== 'done' && t.status !== 'cancelled' && !t.isArchived
  );

  // Normalize assignee to string ID regardless of whether it's populated or not
  const isAssignedToMe = (task: any) => {
    if (!task.assignees || !task.assignees.length) return false;
    return task.assignees.some((a: any) => {
      if (typeof a === 'string') return a === myId;
      if (typeof a === 'object' && a !== null) {
        return String(a._id || '') === myId || String(a.id || '') === myId;
      }
      return false;
    });
  };

  const assignedToMe = activeTasks.filter(isAssignedToMe);

  const overdueTasks = activeTasks.filter((t: any) =>
    t.dueDate && new Date(t.dueDate) < now
  );

  const todayTasks = assignedToMe.filter((t: any) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toDateString() === now.toDateString();
  });

  const upcomingTasks = assignedToMe.filter((t: any) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d > now && d <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  });

  const filterTabs = [
    { id: 'assigned' as FilterType, label: 'Assigned to Me', count: assignedToMe.length },
    { id: 'overdue' as FilterType, label: 'Overdue', count: overdueTasks.length, urgent: true },
    { id: 'today' as FilterType, label: 'Due Today', count: todayTasks.length },
    { id: 'upcoming' as FilterType, label: 'Next 7 Days', count: upcomingTasks.length },
  ];

  // For "Assigned to Me" tab, group by urgency
  const assignedOverdue = assignedToMe.filter((t: any) => t.dueDate && new Date(t.dueDate) < now);
  const assignedNoDate = assignedToMe.filter((t: any) => !t.dueDate);
  const assignedGroups = [
    { label: 'Overdue', color: 'text-red-400', tasks: assignedOverdue },
    { label: 'Due Today', color: 'text-amber-400', tasks: todayTasks },
    { label: 'Next 7 Days', color: 'text-blue-400', tasks: upcomingTasks },
    { label: 'No Due Date', color: 'text-gray-400', tasks: assignedNoDate },
  ].filter(g => g.tasks.length > 0);

  const flatGroups =
    filter === 'assigned' ? assignedGroups :
    [{ label: '', color: 'text-gray-300', tasks:
      filter === 'overdue' ? overdueTasks :
      filter === 'today' ? todayTasks :
      upcomingTasks
    }];

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-1">My Tasks</h1>
          <p className="text-gray-400 text-sm">
            {assignedToMe.length} assigned · {overdueTasks.length} overdue across {projects.length} projects
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 bg-[hsl(222,15%,12%)] p-1 rounded-xl">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
                filter === tab.id ? 'bg-[hsl(222,15%,18%)] text-white' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <span className="hidden sm:block">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              {tab.count > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full tabular-nums',
                  tab.urgent && tab.count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-[hsl(222,15%,22%)] text-gray-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading || !projectsData ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 shimmer rounded-xl" />)}
          </div>
        ) : flatGroups.every(g => g.tasks.length === 0) ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-1">
              {filter === 'overdue' ? 'No overdue tasks!' : 'All caught up!'}
            </h3>
            <p className="text-gray-500 text-sm">
              {filter === 'overdue' ? 'Everything is on track.' : 'No tasks in this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {flatGroups.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('text-sm font-semibold', group.color)}>{group.label}</span>
                    <span className="text-xs text-gray-600">({group.tasks.length})</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  {group.tasks.map((task: any) => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      onSelect={() => setSelectedTask(task._id)}
                      onComplete={() => completeMutation.mutate(task._id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Debug info - remove after fixing */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-xs text-gray-700">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-400">Debug info</summary>
            <pre className="mt-2 p-3 bg-[hsl(222,15%,10%)] rounded-lg overflow-auto">
              {JSON.stringify({
                myId,
                totalTasks: allTasks.length,
                activeTasks: activeTasks.length,
                assignedToMe: assignedToMe.length,
                sampleTask: allTasks[0] ? {
                  title: allTasks[0].title,
                  assignees: allTasks[0].assignees,
                  status: allTasks[0].status
                } : null
              }, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask}
          onClose={() => {
            setSelectedTask(null);
            queryClient.invalidateQueries({ queryKey: ['my-tasks-all'] });
          }}
        />
      )}
    </>
  );
}

function TaskItem({ task, onSelect, onComplete }: any) {
  const priority = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-xl hover:border-[hsl(222,15%,22%)] transition-all cursor-pointer group"
      onClick={onSelect}
    >
      <button onClick={e => { e.stopPropagation(); onComplete(); }} className="flex-shrink-0">
        <Circle className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 truncate font-medium">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-600">{task.project?.emoji} {task.project?.name}</span>
          <span className="text-[10px] text-gray-700 font-mono">#{task.taskNumber}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {task.priority && task.priority !== 'none' && (
          <Flag className={cn('w-3.5 h-3.5 hidden sm:block', priority?.text)} />
        )}
        {task.dueDate && (
          <span className={cn('text-xs hidden sm:flex items-center gap-1 font-medium', isOverdue ? 'text-red-400' : 'text-gray-500')}>
            <Calendar className="w-3 h-3" />
            {formatDate(task.dueDate, 'MMM d')}
          </span>
        )}
      </div>
    </div>
  );
}