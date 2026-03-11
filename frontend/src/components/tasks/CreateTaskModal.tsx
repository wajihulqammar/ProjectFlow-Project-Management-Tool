'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { tasksAPI, projectsAPI } from '@/lib/api';
import { cn, PRIORITY_CONFIG, TYPE_CONFIG } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import toast from 'react-hot-toast';

interface Props {
  projectId?: string;
  defaultColumn?: string;
  onClose: () => void;
}

export default function CreateTaskModal({ projectId, defaultColumn, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('none');
  const [type, setType] = useState('task');
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [dueDate, setDueDate] = useState('');
  const [assignees, setAssignees] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { data: projects } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectsAPI.getAll({ limit: 50 }),
    select: res => res.data.projects,
  });

  const { data: projectData } = useQuery({
    queryKey: ['project-members', selectedProject],
    queryFn: () => projectsAPI.getById(selectedProject),
    select: res => res.data.project,
    enabled: !!selectedProject,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksAPI.create(data),
    onSuccess: () => {
      toast.success('Task created!');
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Task title is required'); return; }
    if (!selectedProject) { toast.error('Please select a project'); return; }
    createMutation.mutate({
      title: title.trim(), description,
      project: selectedProject,
      column: defaultColumn || 'todo',
      priority, type, assignees,
      dueDate: dueDate || undefined,
      tags: tagInput ? tagInput.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    });
  };

  const members = projectData?.members || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,20%)] rounded-2xl shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(222,15%,16%)]">
          <h2 className="text-base font-semibold text-white">Create Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Task title..." autoFocus
            className="w-full bg-transparent text-white text-base placeholder-gray-600 outline-none font-medium"
          />
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Add description..." rows={2}
            className="w-full bg-transparent text-gray-300 text-sm placeholder-gray-600 outline-none resize-none"
          />
          <div className="h-px bg-[hsl(222,15%,16%)]" />
          <div className="flex flex-wrap gap-2">
            {!projectId && (
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                className="flex-1 min-w-[140px] bg-[hsl(222,15%,14%)] border border-[hsl(222,15%,20%)] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none cursor-pointer">
                <option value="">Select Project...</option>
                {projects?.map((p: any) => <option key={p._id} value={p._id}>{p.emoji} {p.name}</option>)}
              </select>
            )}
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="bg-[hsl(222,15%,14%)] border border-[hsl(222,15%,20%)] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none cursor-pointer">
              {Object.entries(PRIORITY_CONFIG).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}
            </select>
            <select value={type} onChange={e => setType(e.target.value)}
              className="bg-[hsl(222,15%,14%)] border border-[hsl(222,15%,20%)] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none cursor-pointer">
              {Object.entries(TYPE_CONFIG).map(([key, val]) => <option key={key} value={key}>{val.icon} {val.label}</option>)}
            </select>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="bg-[hsl(222,15%,14%)] border border-[hsl(222,15%,20%)] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none cursor-pointer" />
          </div>
          {members.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Assignees</p>
              <div className="flex flex-wrap gap-2">
                {members.map((m: any) => (
                  <button key={m.user._id} type="button"
                    onClick={() => setAssignees(prev => prev.includes(m.user._id) ? prev.filter(id => id !== m.user._id) : [...prev, m.user._id])}
                    className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-all border",
                      assignees.includes(m.user._id)
                        ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                        : "bg-[hsl(222,15%,14%)] border-[hsl(222,15%,20%)] text-gray-400")}>
                    <UserAvatar user={m.user} size="xs" />
                    <span>{m.user.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            placeholder="Tags (comma separated)..."
            className="w-full bg-[hsl(222,15%,14%)] border border-[hsl(222,15%,20%)] rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 outline-none focus:border-violet-500" />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || !title.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
