import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificationsApi, markAllReadApi, markReadApi } from '@/api/notifications';
import { Notification } from '@/types';
import { Bell, Menu } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface HeaderProps {
  action?: React.ReactNode;
  onMenuToggle?: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/users': 'User Management',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Header({ action, onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const pathSegments = location.pathname.split('/');
  const basePath = '/' + pathSegments[1];
  const title = routeTitles[basePath] || 'Tasky';

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotificationsApi,
    refetchInterval: 30000,
    retry: 1,
    staleTime: 10000,
  });

  const notificationsList = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notificationsList.filter((n) => !n.is_read).length;

  const markAllMutation = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: markReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close panel when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <header className="h-14 bg-bg-secondary border-b border-bg-border flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-1.5 rounded-lg text-text-secondary hover:bg-bg-tertiary transition-colors"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
        {location.pathname.startsWith('/projects/') && location.pathname !== '/projects' && (
          <span className="text-text-muted text-sm">/</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {action}

        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-tertiary transition-colors"
            aria-label="Notifications"
          >
            <Bell size={16} className="text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-accent-red text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-10 w-80 bg-bg-secondary border border-bg-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-bg-border">
                <span className="text-xs font-semibold text-text-primary">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    className="text-xs text-accent-cyan hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-bg-border">
                {notificationsList.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-8">No notifications</p>
                ) : (
                  notificationsList.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { if (!n.is_read) markOneMutation.mutate(n.id); }}
                      className={`px-4 py-3 cursor-pointer hover:bg-bg-tertiary transition-colors ${!n.is_read ? 'bg-accent-cyan/5' : ''}`}
                    >
                      <p className={`text-xs leading-relaxed ${!n.is_read ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {n.task_title} · {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
            <span className="text-xs font-bold font-mono text-accent-cyan">
              {getInitials(user.full_name)}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
