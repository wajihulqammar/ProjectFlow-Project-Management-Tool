'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { cn, formatRelativeDate } from '@/lib/utils';
import UserAvatar from '@/components/ui/UserAvatar';
import { Mail, Briefcase, Search } from 'lucide-react';
import { useState } from 'react';

export default function TeamPage() {
  const { onlineUsers } = useSocket();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => api.get('/users/search', { params: { q: search } }),
    select: (res: any) => res.data?.users || [],
    enabled: search.length > 0,
  });

  const { data: allUsers, isLoading: allLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/users'),
    select: (res: any) => res.data?.users || [],
    enabled: search.length === 0,
  });

  const users = search ? (data || []) : (allUsers || []);
  const loading = search ? isLoading : allLoading;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Team Members</h1>
          <p className="text-gray-400 text-sm">{onlineUsers.length} online now</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
            className="bg-[hsl(222,15%,13%)] border border-[hsl(222,15%,18%)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500 w-56" />
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="h-28 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user: any) => {
            const isOnline = onlineUsers.includes(user._id);
            return (
              <div key={user._id} className="bg-[hsl(222,15%,11%)] border border-[hsl(222,15%,16%)] rounded-2xl p-5 hover:border-[hsl(222,15%,22%)] transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar user={user} size="md" showStatus isOnline={isOnline} />
                  <div>
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <div className={cn("ml-auto w-2 h-2 rounded-full", isOnline ? "bg-emerald-400" : "bg-gray-600")} />
                </div>
                <div className="space-y-2">
                  {user.jobTitle && <div className="flex items-center gap-2 text-xs text-gray-400"><Briefcase className="w-3 h-3 text-gray-600" />{user.jobTitle}</div>}
                  <div className="flex items-center gap-2 text-xs text-gray-400"><Mail className="w-3 h-3 text-gray-600" /><span className="truncate">{user.email}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-[hsl(222,15%,16%)]">
                  <p className="text-xs text-gray-600">{isOnline ? 'Active now' : `Last seen ${formatRelativeDate(user.lastSeen)}`}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
