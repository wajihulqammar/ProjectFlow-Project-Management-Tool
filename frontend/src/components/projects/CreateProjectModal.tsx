'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { projectsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMOJIS = ['📋','🚀','💡','🎯','🔥','⚡','🌟','🛠️','📊','🎨','🏗️','🔬','📱','🌍','🎮'];
const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6','#14b8a6','#f97316'];

export default function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📋');
  const [color, setColor] = useState('#6366f1');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => projectsAPI.create(data),
    onSuccess: () => { toast.success('Project created! 🚀'); onClose(); }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Project name required'); return; }
    createMutation.mutate({ name: name.trim(), description, emoji, color, priority, dueDate: dueDate || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,20%)] rounded-2xl shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(222,15%,16%)]">
          <h2 className="text-base font-semibold text-white">New Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border border-[hsl(222,15%,20%)]" style={{ background: color+'20' }}>{emoji}</div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-2">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setEmoji(e)}
                    className={cn("w-7 h-7 rounded-lg text-base flex items-center justify-center hover:bg-[hsl(222,15%,18%)]", emoji===e && "bg-[hsl(222,15%,20%)] ring-1 ring-violet-500")}>{e}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Color</p>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn("w-6 h-6 rounded-full transition-all", color===c && "ring-2 ring-offset-2 ring-offset-[hsl(222,15%,11%)] ring-white")}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Project Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="My awesome project..." autoFocus
              className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What's this about?"
              className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] focus:border-violet-500 rounded-xl px-4 py-3 text-gray-300 text-sm placeholder-gray-600 outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1.5">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none cursor-pointer">
                <option value="low">Low</option><option value="medium">Medium</option>
                <option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1.5">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl px-3 py-2.5 text-sm text-gray-300 outline-none cursor-pointer" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 shadow-md shadow-violet-600/25">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
