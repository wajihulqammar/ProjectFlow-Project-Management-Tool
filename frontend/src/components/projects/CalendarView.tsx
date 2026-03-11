'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Circle, CheckCircle2, X } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addDays, isSameMonth, isToday, parseISO, getDay
} from 'date-fns';
import { tasksAPI } from '@/lib/api';
import { cn, PRIORITY_CONFIG } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import toast from 'react-hot-toast';

export default function CalendarView({ project }: { project: any }) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [dayPopover, setDayPopover] = useState<{ date: Date; tasks: any[] } | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
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

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    const days = [];
    let day = start;
    while (day <= end) { days.push(day); day = addDays(day, 1); }
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    tasks.forEach((task: any) => {
      if (task.dueDate) {
        const key = format(parseISO(task.dueDate), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(task);
      }
    });
    return map;
  }, [tasks]);

  const getTasksForDay = (day: Date) => tasksByDate[format(day, 'yyyy-MM-dd')] || [];
  const totalWithDates = tasks.filter((t: any) => t.dueDate).length;
  const totalOverdue = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
  const displayDays = viewMode === 'month' ? calendarDays : weekDays;
  const MAX_VISIBLE = 3;

  return (
    <>
      <div className="flex flex-col h-full">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(222,15%,14%)] flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => viewMode === 'month' ? setCurrentDate(subMonths(currentDate, 1)) : setCurrentDate(d => addDays(d, -7))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[hsl(222,15%,16%)] text-gray-400 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-[hsl(222,15%,16%)] rounded-lg transition-all"
              >
                Today
              </button>
              <button
                onClick={() => viewMode === 'month' ? setCurrentDate(addMonths(currentDate, 1)) : setCurrentDate(d => addDays(d, 7))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[hsl(222,15%,16%)] text-gray-400 hover:text-white transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-base font-bold text-white">
              {viewMode === 'month'
                ? format(currentDate, 'MMMM yyyy')
                : `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="text-gray-500"><span className="text-white font-medium">{totalWithDates}</span> scheduled</span>
              {totalOverdue > 0 && <span className="text-red-400 font-medium">{totalOverdue} overdue</span>}
            </div>
            <div className="flex items-center gap-1 bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl p-1">
              {(['month', 'week'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                    viewMode === m ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300')}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[hsl(222,15%,14%)] flex-shrink-0 bg-[hsl(222,15%,9%)]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-7" style={{ minHeight: '100%' }}>
              {displayDays.map((day, idx) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);
                const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                const visibleTasks = dayTasks.slice(0, MAX_VISIBLE);
                const hiddenCount = dayTasks.length - MAX_VISIBLE;

                return (
                  <div
                    key={idx}
                    className={cn(
                      'border-r border-b border-[hsl(222,15%,14%)] group',
                      'hover:bg-[hsl(222,15%,11%)] transition-colors',
                      isWeekend && isCurrentMonth && 'bg-[hsl(222,15%,9%)]',
                      !isCurrentMonth && viewMode === 'month' && 'bg-[hsl(222,15%,7%)] opacity-60',
                      isDayToday && 'bg-violet-500/5',
                    )}
                    style={{ minHeight: viewMode === 'week' ? '500px' : '140px' }}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between px-3 pt-3 pb-2">
                      <span className={cn(
                        'text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-all',
                        isDayToday
                          ? 'bg-violet-600 text-white'
                          : isCurrentMonth
                          ? 'text-gray-200 hover:bg-[hsl(222,15%,18%)]'
                          : 'text-gray-600'
                      )}>
                        {format(day, 'd')}
                      </span>
                      <button
                        onClick={() => setCreateDate(format(day, 'yyyy-MM-dd'))}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-400 hover:text-white transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Tasks */}
                    <div className="px-2 pb-2 space-y-1">
                      {visibleTasks.map((task: any) => (
                        <CalendarTaskChip
                          key={task._id}
                          task={task}
                          onSelect={() => setSelectedTask(task._id)}
                          onComplete={() => completeMutation.mutate(task._id)}
                        />
                      ))}
                      {hiddenCount > 0 && (
                        <button
                          onClick={() => setDayPopover({ date: day, tasks: dayTasks })}
                          className="w-full text-left text-xs text-violet-400 hover:text-violet-300 font-medium px-2 py-1 rounded-lg hover:bg-violet-500/10 transition-all"
                        >
                          +{hiddenCount} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-5 px-6 py-3 border-t border-[hsl(222,15%,14%)] flex-shrink-0 bg-[hsl(222,15%,9%)]">
          <span className="text-xs text-gray-600 font-semibold uppercase tracking-wider">Priority:</span>
          {['urgent', 'high', 'medium', 'low'].map(p => (
            <div key={p} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_CONFIG[p]?.color || '#888' }} />
              <span className="text-xs text-gray-500 capitalize">{p}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-500">Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-gray-500">Overdue</span>
          </div>
        </div>
      </div>

      {/* Day overflow popover */}
      {dayPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDayPopover(null)} />
          <div className="relative w-full max-w-sm bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,20%)] rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(222,15%,16%)]">
              <div>
                <p className="text-white font-semibold">{format(dayPopover.date, 'EEEE')}</p>
                <p className="text-gray-500 text-sm">{format(dayPopover.date, 'MMMM d, yyyy')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCreateDate(format(dayPopover.date, 'yyyy-MM-dd')); setDayPopover(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-medium transition-all"
                >
                  <Plus className="w-3 h-3" /> Add task
                </button>
                <button onClick={() => setDayPopover(null)} className="text-gray-500 hover:text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-1.5 max-h-96 overflow-y-auto">
              {dayPopover.tasks.map((task: any) => (
                <div
                  key={task._id}
                  onClick={() => { setSelectedTask(task._id); setDayPopover(null); }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[hsl(222,15%,13%)] hover:bg-[hsl(222,15%,16%)] border border-[hsl(222,15%,18%)] hover:border-violet-500/20 cursor-pointer transition-all group"
                >
                  <button onClick={e => { e.stopPropagation(); if (task.status !== 'done') completeMutation.mutate(task._id); }} className="flex-shrink-0">
                    {task.status === 'done'
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <Circle className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm text-white font-medium truncate', task.status === 'done' && 'line-through text-gray-500')}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.priority && task.priority !== 'none' && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_CONFIG[task.priority]?.color }} />
                          <span className="text-xs text-gray-500 capitalize">{task.priority}</span>
                        </div>
                      )}
                      <span className="text-xs text-gray-600 font-mono">#{task.taskNumber}</span>
                    </div>
                  </div>
                  {task.assignees?.length > 0 && <UserAvatar user={task.assignees[0]} size="xs" className="flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {createDate && (
        <CreateTaskModal
          projectId={project._id}
          defaultColumn="todo"
          onClose={() => { setCreateDate(null); queryClient.invalidateQueries({ queryKey: ['tasks', project._id] }); }}
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

function CalendarTaskChip({ task, onSelect, onComplete }: { task: any; onSelect: () => void; onComplete: () => void; }) {
  const isDone = task.status === 'done';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all group/chip border w-full',
        isDone
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : isOverdue
          ? 'bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/15'
          : 'bg-[hsl(222,15%,15%)] border-[hsl(222,15%,22%)] text-gray-300 hover:bg-[hsl(222,15%,20%)] hover:border-violet-500/30'
      )}
    >
      <button onClick={e => { e.stopPropagation(); if (!isDone) onComplete(); }} className="flex-shrink-0">
        {isDone
          ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          : <Circle className="w-3 h-3 text-gray-600 group-hover/chip:text-gray-400 transition-colors" />}
      </button>
      {task.priority && task.priority !== 'none' && !isDone && (
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priority?.color }} />
      )}
      <span className={cn('truncate flex-1 font-medium leading-tight', isDone && 'line-through opacity-50')}>
        {task.title}
      </span>
    </div>
  );
}