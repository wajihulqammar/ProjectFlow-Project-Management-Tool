'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import UserAvatar from '@/components/ui/UserAvatar';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [bio, setBio] = useState(user?.bio || '');

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/update-profile', data),
    onSuccess: (res) => { updateUser(res.data.user); toast.success('Profile updated!'); }
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Settings</h1>
      <div className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-[hsl(222,15%,16%)]">
          <UserAvatar user={user} size="lg" />
          <div>
            <p className="text-white font-semibold">{user?.name}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Job Title</label>
          <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Product Designer"
            className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-gray-600" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell your team about yourself..."
            className="w-full bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] focus:border-violet-500 rounded-xl px-4 py-3 text-white text-sm outline-none resize-none placeholder-gray-600" />
        </div>
        <button onClick={() => updateMutation.mutate({ name, jobTitle, bio })} disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
