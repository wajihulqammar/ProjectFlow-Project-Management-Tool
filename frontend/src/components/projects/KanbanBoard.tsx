'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Grip, Calendar, MessageSquare, CheckSquare, Clock, Flag } from 'lucide-react';
import { tasksAPI } from '@/lib/api';
import { cn, PRIORITY_CONFIG, formatDate } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import toast from 'react-hot-toast';

interface Column {
  id: string;
  name: string;
  color: string;
}

interface KanbanBoardProps {
  project: any;
}

export default function KanbanBoard({ project }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<any>(null);
  const [createColumn, setCreateColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', project._id],
    queryFn: () => tasksAPI.getAll({ projectId: project._id }),
    select: res => res.data.tasks,
  });

  useEffect(() => {
    if (data) setLocalTasks(data);
  }, [data]);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tasksAPI.update(id, data),
    onError: () => {
      setLocalTasks(data || []);
      toast.error('Failed to move task');
    }
  });

  const reorderMutation = useMutation({
    mutationFn: (tasks: any[]) => tasksAPI.reorder({ tasks, projectId: project._id }),
  });

  const columns: Column[] = project.columns || [];

  const getColumnTasks = (columnId: string) =>
    localTasks.filter(t => t.column === columnId).sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const task = localTasks.find(t => t._id === event.active.id);
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeTaskData = localTasks.find(t => t._id === active.id);
    if (!activeTaskData) return;
    const overColumn = columns.find(c => c.id === over.id);
    if (overColumn && activeTaskData.column !== overColumn.id) {
      setLocalTasks(prev => prev.map(t =>
        t._id === active.id ? { ...t, column: overColumn.id } : t
      ));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeTaskData = localTasks.find(t => t._id === active.id);
    if (!activeTaskData) return;

    const overColumn = columns.find(c => c.id === over.id);
    const overTask = localTasks.find(t => t._id === over.id);
    const targetColumn = overColumn?.id || overTask?.column;
    if (!targetColumn) return;

    let newTasks = [...localTasks];

    if (activeTaskData.column !== targetColumn) {
      newTasks = newTasks.map(t => t._id === active.id ? { ...t, column: targetColumn } : t);
    }

    if (overTask && active.id !== over.id) {
      const columnTasks = newTasks.filter(t => t.column === targetColumn);
      const oldIndex = columnTasks.findIndex(t => t._id === active.id);
      const newIndex = columnTasks.findIndex(t => t._id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex).map((t, i) => ({ ...t, order: i }));
        newTasks = newTasks.map(t => {
          const updated = reordered.find(r => r._id === t._id);
          return updated || t;
        });
      }
    }

    setLocalTasks(newTasks);

    updateTaskMutation.mutate({
      id: active.id as string,
      data: { column: targetColumn, status: targetColumn }
    });

    const reorderPayload = newTasks
      .filter(t => t.column === targetColumn)
      .map((t, i) => ({ id: t._id, column: t.column, order: i }));
    reorderMutation.mutate(reorderPayload);
  };

  if (isLoading) return <KanbanSkeleton columns={columns} />;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full overflow-x-auto pb-4 px-6 pt-4">
          {columns.map((column) => {
            const tasks = getColumnTasks(column.id);
            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasks}
                project={project}
                onCreateTask={() => setCreateColumn(column.id)}
                onSelectTask={(id: string) => setSelectedTask(id)}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="drag-overlay">
              <TaskCard task={activeTask} onSelect={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {createColumn && (
        <CreateTaskModal
          projectId={project._id}
          defaultColumn={createColumn}
          onClose={() => {
            setCreateColumn(null);
            queryClient.invalidateQueries({ queryKey: ['tasks', project._id] });
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask}
          onClose={() => {
            setSelectedTask(null);
            queryClient.invalidateQueries({ queryKey: ['tasks', project._id] });
          }}
        />
      )}
    </>
  );
}

function KanbanColumn({ column, tasks, project, onCreateTask, onSelectTask }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'kanban-column flex flex-col w-72 flex-shrink-0 rounded-2xl border transition-all',
        isOver
          ? 'border-violet-500/40 bg-violet-500/5'
          : 'border-[hsl(222,15%,16%)] bg-[hsl(222,15%,10%)]'
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(222,15%,14%)]">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: column.color }} />
        <span className="text-sm font-semibold text-gray-200 flex-1">{column.name}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 bg-[hsl(222,15%,16%)] px-2 py-0.5 rounded-full tabular-nums font-medium">
            {tasks.length}
          </span>
          <button
            onClick={onCreateTask}
            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-[hsl(222,15%,18%)] text-gray-500 hover:text-gray-300 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <SortableContext items={tasks.map((t: any) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[100px]">
          {tasks.map((task: any) => (
            <SortableTaskCard key={task._id} task={task} onSelect={onSelectTask} />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={onCreateTask}
        className="flex items-center gap-2 mx-3 mb-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-[hsl(222,15%,15%)] transition-all border border-dashed border-[hsl(222,15%,18%)] hover:border-[hsl(222,15%,24%)]"
      >
        <Plus className="w-3.5 h-3.5" />
        Add task
      </button>
    </div>
  );
}

function SortableTaskCard({ task, onSelect }: { task: any; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { type: 'task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard task={task} onSelect={onSelect} dragListeners={listeners} />
    </div>
  );
}

function TaskCard({ task, onSelect, dragListeners }: any) {
  const priority = PRIORITY_CONFIG[task.priority];
  const hasChecklist = task.checklist && task.checklist.length > 0;
  const checklistDone = task.checklist?.filter((c: any) => c.completed).length || 0;

  return (
    <div
      className="task-card bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl p-3.5 group"
      onClick={() => onSelect(task._id)}
    >
      <div className="flex items-start gap-2 mb-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            {task.type && task.type !== 'task' && (
              <span className="text-xs">
                {{ bug: '🐛', feature: '✨', improvement: '📈', epic: '⚡', story: '📖' }[task.type as string]}
              </span>
            )}
            <span className="text-[11px] text-gray-600 font-mono">#{task.taskNumber}</span>
          </div>
          <p className="text-sm text-gray-200 font-medium line-clamp-2 leading-snug">{task.title}</p>
        </div>
        <div
          {...dragListeners}
          className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <Grip className="w-3.5 h-3.5 text-gray-600" />
        </div>
      </div>

      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.slice(0, 2).map((tag: string, i: number) => (
            <span key={i} className="text-[11px] px-2 py-0.5 bg-[hsl(222,15%,18%)] text-gray-400 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )}

      {hasChecklist && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <CheckSquare className="w-3 h-3" /> {checklistDone}/{task.checklist.length}
            </span>
          </div>
          <div className="h-1 bg-[hsl(222,15%,20%)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(checklistDone / task.checklist.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {task.priority && task.priority !== 'none' && (
          <Flag className={cn('w-3 h-3 flex-shrink-0', priority?.text)} />
        )}
        {task.dueDate && (
          <span className={cn(
            'text-[11px] flex items-center gap-1 font-medium',
            new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-gray-500'
          )}>
            <Clock className="w-3 h-3" />
            {formatDate(task.dueDate, 'MMM d')}
          </span>
        )}
        <div className="flex-1" />
        {task.commentCount > 0 && (
          <span className="text-[11px] text-gray-600 flex items-center gap-0.5">
            <MessageSquare className="w-3 h-3" /> {task.commentCount}
          </span>
        )}
        {task.assignees?.length > 0 && (
          <div className="flex -space-x-1">
            {task.assignees.slice(0, 2).map((u: any) => (
              <UserAvatar key={u._id} user={u} size="xs" className="ring-1 ring-[hsl(222,15%,13%)]" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanSkeleton({ columns }: { columns: Column[] }) {
  return (
    <div className="flex gap-4 h-full overflow-x-auto px-6 pt-4 pb-4">
      {columns.map(col => (
        <div key={col.id} className="w-72 flex-shrink-0 bg-[hsl(222,15%,10%)] border border-[hsl(222,15%,16%)] rounded-2xl p-3 space-y-2">
          <div className="h-8 shimmer rounded-lg mb-4" />
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer rounded-xl" />)}
        </div>
      ))}
    </div>
  );
}