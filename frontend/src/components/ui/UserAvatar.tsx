import { getInitials, cn } from '@/lib/utils';

interface UserAvatarProps {
  user: any;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
}

const sizes = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

export default function UserAvatar({ user, size = 'md', className, showStatus, isOnline }: UserAvatarProps) {
  if (!user) return (
    <div className={cn("rounded-full bg-gray-700 flex items-center justify-center", sizes[size], className)}>
      <span className="text-gray-400">?</span>
    </div>
  );

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={cn("rounded-full object-cover", sizes[size])}
        />
      ) : (
        <div
          className={cn("rounded-full flex items-center justify-center font-semibold text-white", sizes[size])}
          style={{ background: user.avatarColor || '#6366f1' }}
        >
          {getInitials(user.name || 'U')}
        </div>
      )}
      {showStatus && (
        <div className={cn(
          "absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[hsl(222,15%,9%)]",
          isOnline ? "bg-emerald-400" : "bg-gray-500"
        )} />
      )}
    </div>
  );
}
