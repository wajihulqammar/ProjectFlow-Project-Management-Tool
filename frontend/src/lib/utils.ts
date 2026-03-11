import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy') {
  return format(new Date(date), fmt);
}

export function formatRelativeDate(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`;
  if (isTomorrow(d)) return `Tomorrow at ${format(d, 'h:mm a')}`;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export const PRIORITY_CONFIG: Record<string, any> = {
  urgent: { label: 'Urgent', color: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-400' },
  high: { label: 'High', color: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  medium: { label: 'Medium', color: '#eab308', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  low: { label: 'Low', color: '#22c55e', bg: 'bg-green-500/10', text: 'text-green-400' },
  none: { label: 'None', color: '#6b7280', bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

export const STATUS_CONFIG: Record<string, any> = {
  backlog: { label: 'Backlog', color: '#6b7280', bg: 'bg-gray-500/10', text: 'text-gray-400' },
  todo: { label: 'To Do', color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  inprogress: { label: 'In Progress', color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  review: { label: 'In Review', color: '#8b5cf6', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  done: { label: 'Done', color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  cancelled: { label: 'Cancelled', color: '#6b7280', bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

export const TYPE_CONFIG: Record<string, any> = {
  task: { label: 'Task', icon: '✅', color: '#6b7280' },
  bug: { label: 'Bug', icon: '🐛', color: '#ef4444' },
  feature: { label: 'Feature', icon: '✨', color: '#8b5cf6' },
  improvement: { label: 'Improvement', icon: '📈', color: '#3b82f6' },
  epic: { label: 'Epic', icon: '⚡', color: '#f59e0b' },
  story: { label: 'Story', icon: '📖', color: '#10b981' },
};

export function truncate(str: string, length = 50) {
  return str.length > length ? str.slice(0, length) + '...' : str;
}
