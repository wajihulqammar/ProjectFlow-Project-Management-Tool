'use client';
import { useQuery } from '@tanstack/react-query';
import { activitiesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatRelativeDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, MessageSquare, UserPlus, FolderPlus, Tag } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';

const ACTIVITY_ICONS: Record<string, any> = {
  task_created: CheckCircle2,
  task_completed: CheckCircle2,
  comment_created: MessageSquare,
  member_added: UserPlus,
  project_created: FolderPlus,
  task_updated: Tag,
};

const ACTIVITY_LABELS: Record<string, string> = {
  task_created: 'created a task',
  task_completed: 'completed a task',
  task_updated: 'updated a task',
  comment_created: 'commented',
  member_added: 'joined the project',
  project_created: 'created a project',
};

export default function InboxPage() {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', 'inbox'],
    queryFn: () => activitiesAPI.getAll({ limit: 50 }),
    select: d => d.data.activities,
  });

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Inbox</h1>
          <p className="text-muted-foreground text-sm">Recent activity across your projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{activities.length} updates</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 shimmer rounded-xl" />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">You're all caught up!</h3>
          <p className="text-sm text-muted-foreground">No recent activity to show.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities.map((act: any, i: number) => {
            const Icon = ACTIVITY_ICONS[act.type] || Bell;
            const isOwn = act.actor?._id === user?._id;
            return (
              <motion.div
                key={act._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-start gap-3 p-4 rounded-xl hover:bg-surface-1 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar user={act.actor} size="md" />
                  <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-surface-1 flex items-center justify-center">
                    <Icon className="h-3 w-3 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{isOwn ? 'You' : act.actor?.name}</span>
                    {' '}{ACTIVITY_LABELS[act.type] || act.type.replace(/_/g, ' ')}
                    {act.task && (
                      <span className="text-primary"> #{act.task.taskNumber} {act.task.title && `"${act.task.title.slice(0, 30)}${act.task.title.length > 30 ? '…' : ''}"`}</span>
                    )}
                    {act.project && (
                      <span className="text-muted-foreground"> in {act.project.emoji} {act.project.name}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeDate(act.createdAt)}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
