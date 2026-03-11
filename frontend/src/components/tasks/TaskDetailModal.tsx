'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Flag, Calendar, Trash2, Clock, Plus, Send, Check, Edit3, CheckSquare } from 'lucide-react';
import { tasksAPI } from '@/lib/api';
import { cn, PRIORITY_CONFIG, STATUS_CONFIG, TYPE_CONFIG, formatDate, formatRelativeDate } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface Props {
  taskId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => tasksAPI.getById(taskId),
    select: res => res.data.task,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => tasksAPI.getComments(taskId),
    select: res => res.data.comments,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => tasksAPI.update(taskId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => tasksAPI.addComment(taskId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setNewComment('');
      toast.success('Comment added');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksAPI.delete(taskId),
    onSuccess: () => { toast.success('Task deleted'); onClose(); }
  });

  const toggleChecklist = (itemId: string, completed: boolean) => {
    const checklist = task.checklist.map((item: any) =>
      item.id === itemId ? { ...item, completed } : item
    );
    updateMutation.mutate({ checklist });
  };

  if (isLoading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl h-96 bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,20%)] rounded-2xl shimmer" />
    </div>
  );

  if (!task) return null;

  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];
  const checklistTotal = task.checklist?.length || 0;
  const checklistDone = task.checklist?.filter((c: any) => c.completed).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,20%)] rounded-2xl shadow-2xl flex flex-col animate-scale-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(222,15%,16%)] flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="text-xs">{task.project?.name || ''}</span>
            <span>/</span>
            <span className="font-mono text-xs">#{task.taskNumber}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", status?.bg, status?.text)}>
              {status?.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (window.confirm('Delete this task?')) deleteMutation.mutate(); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-200 hover:bg-[hsl(222,15%,16%)] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Title */}
            <div>
              {editingTitle ? (
                <div className="flex items-start gap-2">
                  <textarea
                    value={titleValue}
                    onChange={e => setTitleValue(e.target.value)}
                    autoFocus
                    rows={2}
                    className="flex-1 bg-[hsl(222,15%,14%)] border border-violet-500 rounded-xl px-3 py-2 text-white text-lg font-bold outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      updateMutation.mutate({ title: titleValue });
                      setEditingTitle(false);
                    }}
                    className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h1
                  className="text-xl font-bold text-white cursor-pointer hover:text-violet-300 transition-colors leading-snug group"
                  onClick={() => { setTitleValue(task.title); setEditingTitle(true); }}
                >
                  {task.title}
                  <Edit3 className="w-3.5 h-3.5 inline ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                </h1>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Description</p>
              <textarea
                defaultValue={task.description}
                onBlur={e => { if (e.target.value !== task.description) updateMutation.mutate({ description: e.target.value }); }}
                placeholder="Add a description..."
                rows={3}
                className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] focus:border-violet-500/50 rounded-xl px-4 py-3 text-gray-300 text-sm placeholder-gray-600 outline-none resize-none transition-colors"
              />
            </div>

            {/* Checklist */}
            {checklistTotal > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Checklist ({checklistDone}/{checklistTotal})
                  </p>
                  <span className="text-xs text-gray-500">{Math.round((checklistDone / checklistTotal) * 100)}%</span>
                </div>
                <div className="h-1 bg-[hsl(222,15%,18%)] rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
                  />
                </div>
                <div className="space-y-1.5">
                  {task.checklist?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[hsl(222,15%,13%)] transition-all">
                      <button
                        onClick={() => toggleChecklist(item.id, !item.completed)}
                        className={cn("w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                          item.completed ? "bg-emerald-500 border-emerald-500" : "border-gray-600 hover:border-emerald-500"
                        )}
                      >
                        {item.completed && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className={cn("text-sm flex-1", item.completed ? "line-through text-gray-600" : "text-gray-300")}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">
                Comments ({comments?.length || 0})
              </p>
              <div className="space-y-4 mb-4">
                {comments?.map((comment: any) => (
                  <div key={comment._id} className="flex gap-3">
                    <UserAvatar user={comment.author} size="sm" className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-sm font-medium text-gray-200">{comment.author?.name}</span>
                        <span className="text-xs text-gray-600">{formatRelativeDate(comment.createdAt)}</span>
                        {comment.isEdited && <span className="text-xs text-gray-600">(edited)</span>}
                      </div>
                      <div className="bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl px-4 py-3 text-sm text-gray-300 leading-relaxed">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <div className="flex gap-3">
                <UserAvatar user={user} size="sm" className="flex-shrink-0 mt-1" />
                <div className="flex-1 flex items-end gap-2">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={1}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && newComment.trim()) {
                        e.preventDefault();
                        addCommentMutation.mutate(newComment.trim());
                      }
                    }}
                    className="flex-1 bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] focus:border-violet-500/50 rounded-xl px-4 py-3 text-gray-300 text-sm placeholder-gray-600 outline-none resize-none transition-colors"
                  />
                  <button
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    onClick={() => addCommentMutation.mutate(newComment.trim())}
                    className="flex-shrink-0 p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar meta */}
          <div className="w-56 flex-shrink-0 border-l border-[hsl(222,15%,16%)] p-5 space-y-5 overflow-y-auto">
            <MetaField label="Status">
              <select
                value={task.status}
                onChange={e => updateMutation.mutate({ status: e.target.value, column: e.target.value })}
                className="w-full bg-[hsl(222,15%,14%)] border border-[hsl(222,15%,20%)] rounded-lg px-2.5 py-1.5 text-sm text-gray-300 outline-none cursor-pointer"
              >
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </MetaField>

            <MetaField label="Priority">
              <select
                value={task.priority}
                onChange={e => updateMutation.mutate({ priority: e.target.value })}
                className="w-full bg-[hsl(222,15%,14%)] border border-[hsl(222,15%,20%)] rounded-lg px-2.5 py-1.5 text-sm text-gray-300 outline-none cursor-pointer"
              >
                {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </MetaField>

            <MetaField label="Type">
              <select
                value={task.type}
                onChange={e => updateMutation.mutate({ type: e.target.value })}
                className="w-full bg-[hsl(222,15%,14%)] border border-[hsl(222,15%,20%)] rounded-lg px-2.5 py-1.5 text-sm text-gray-300 outline-none cursor-pointer"
              >
                {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
              </select>
            </MetaField>

            <MetaField label="Due Date">
              <input
                type="date"
                defaultValue={task.dueDate ? formatDate(task.dueDate, 'yyyy-MM-dd') : ''}
                onBlur={e => updateMutation.mutate({ dueDate: e.target.value || null })}
                className="w-full bg-[hsl(222,15%,14%)] border border-[hsl(222,15%,20%)] rounded-lg px-2.5 py-1.5 text-sm text-gray-300 outline-none cursor-pointer"
              />
            </MetaField>

            <MetaField label="Assignees">
              {task.assignees?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {task.assignees.map((u: any) => (
                    <div key={u._id} className="flex items-center gap-1.5 px-2 py-1 bg-[hsl(222,15%,14%)] rounded-lg">
                      <UserAvatar user={u} size="xs" />
                      <span className="text-xs text-gray-300">{u.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-600">None assigned</p>
              )}
            </MetaField>

            <MetaField label="Created">
              <p className="text-xs text-gray-400">{formatRelativeDate(task.createdAt)}</p>
            </MetaField>

            {task.completedAt && (
              <MetaField label="Completed">
                <p className="text-xs text-emerald-400">{formatRelativeDate(task.completedAt)}</p>
              </MetaField>
            )}

            {task.tags?.length > 0 && (
              <MetaField label="Tags">
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-[hsl(222,15%,16%)] text-gray-400 rounded-md">{tag}</span>
                  ))}
                </div>
              </MetaField>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}
