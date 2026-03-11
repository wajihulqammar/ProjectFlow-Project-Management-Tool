'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Flag, Calendar, User, ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import { tasksAPI } from '@/lib/api';
import { cn, PRIORITY_CONFIG, STATUS_CONFIG, formatDate } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import toast from 'react-hot-toast';

export default function TaskListView({ project }: { project: any }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'assignee'>('status');

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', project._id],
    queryFn: () => tasksAPI.getAll({ projectId: project._id }),
    select: res => res.data.tasks,
  });

  const completeMutation = useMutation({
    mutationFn: (taskId: string) => tasksAPI.update(taskId, { status: 'done', column: 'done' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', project._id] });
      toast.success('Task completed! 🎉');
    }
  });

  const tasks = tasksData || [];

  const groupedTasks = project.columns?.map((col: any) => ({
    id: col.id,
    name: col.name,
    color: col.color,
    tasks: tasks.filter((t: any) => t.column === col.id)
  })) || [];

  if (isLoading) return (
    <div className="p-6 space-y-3">
      {[...Array(8)].map((_, i) => <div key={i} className="h-12 shimmer rounded-xl" />)}
    </div>
  );

  return (
    <>
      <div className="flex-1 overflow-auto p-6">
        {/* Controls */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Group by</span>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as any)}
              className="bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-lg px-2.5 py-1.5 text-sm text-gray-300 outline-none"
            >
              <option value="status">Status</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>

        {/* Task groups */}
        <div className="space-y-6 max-w-4xl">
          {groupedTasks.map((group: any) => (
            <div key={group.id}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-2 pb-2 border-b border-[hsl(222,15%,14%)]">
                <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                <span className="text-sm font-semibold text-gray-200">{group.name}</span>
                <span className="text-xs text-gray-500 bg-[hsl(222,15%,16%)] px-2 py-0.5 rounded-full">{group.tasks.length}</span>
              </div>

              {/* Tasks */}
              <div className="space-y-1">
                {group.tasks.map((task: any) => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    onSelect={() => setSelectedTask(task._id)}
                    onComplete={() => completeMutation.mutate(task._id)}
                  />
                ))}
                <button
                  onClick={() => setCreateOpen(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-400 hover:bg-[hsl(222,15%,13%)] rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add task to {group.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {createOpen && (
        <CreateTaskModal
          projectId={project._id}
          onClose={() => { setCreateOpen(false); queryClient.invalidateQueries({ queryKey: ['tasks', project._id] }); }}
        />
      )}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask}
          onClose={() => { setSelectedTask(null); queryClient.invalidateQueries({ queryKey: ['tasks', project._id] }); }}
        />
      )}
    </>
  );
}

function TaskRow({ task, onSelect, onComplete }: any) {
  const priority = PRIORITY_CONFIG[task.priority];
  const isComplete = task.status === 'done';

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-[hsl(222,15%,13%)] transition-all cursor-pointer group",
        isComplete && "opacity-60"
      )}
      onClick={onSelect}
    >
      {/* Complete toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); if (!isComplete) onComplete(); }}
        className="flex-shrink-0"
      >
        {isComplete
          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          : <Circle className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        }
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <span className={cn("text-sm text-gray-200 truncate", isComplete && "line-through text-gray-500")}>
          {task.title}
        </span>
        {task.tags?.map((tag: string, i: number) => (
          <span key={i} className="text-[11px] px-1.5 py-0.5 bg-[hsl(222,15%,18%)] text-gray-500 rounded-md hidden sm:inline">
            {tag}
          </span>
        ))}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {task.priority !== 'none' && (
          <Flag className={cn("w-3.5 h-3.5 hidden md:block", priority?.text)} />
        )}
        
        {task.dueDate && (
          <span className={cn(
            "text-xs hidden sm:flex items-center gap-1",
            new Date(task.dueDate) < new Date() ? "text-red-400" : "text-gray-500"
          )}>
            <Calendar className="w-3 h-3" />
            {formatDate(task.dueDate, 'MMM d')}
          </span>
        )}

        {task.assignees?.length > 0 && (
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 2).map((u: any) => (
              <UserAvatar key={u._id} user={u} size="xs" className="ring-1 ring-[hsl(222,15%,9%)]" />
            ))}
          </div>
        )}

        <span className="text-[10px] text-gray-600 font-mono hidden md:block">#{task.taskNumber}</span>
      </div>
    </div>
  );
}
