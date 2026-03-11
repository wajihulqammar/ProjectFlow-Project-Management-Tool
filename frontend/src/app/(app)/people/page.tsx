'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';
import { Search, Mail, Briefcase } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { motion } from 'framer-motion';
import { cn, formatRelativeDate } from '@/lib/utils';

export default function PeoplePage() {
  const [search, setSearch] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => search ? usersAPI.search(search) : usersAPI.list({ limit: 50 }),
    select: d => d.data.users,
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">People</h1>
        <p className="text-muted-foreground text-sm">{users.length} team members</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search people..."
          className="input-field pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((person: any, i: number) => (
            <motion.div
              key={person._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card p-5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <UserAvatar user={person} size="lg" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{person.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{person.jobTitle || 'Team Member'}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{person.email}</span>
                </div>
                {person.department && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3 flex-shrink-0" />
                    <span>{person.department}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-md font-medium capitalize',
                  person.role === 'admin' ? 'bg-primary/10 text-primary' :
                  person.role === 'manager' ? 'bg-blue-400/10 text-blue-400' :
                  'bg-surface-3 text-muted-foreground'
                )}>
                  {person.role}
                </span>
                {person.lastSeen && (
                  <span className="text-xs text-muted-foreground ml-2">Active {formatRelativeDate(person.lastSeen)}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
