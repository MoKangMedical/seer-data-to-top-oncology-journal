import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

// Toast notification type
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Notification from database
export interface Notification {
  id: number;
  type: 'operation' | 'system' | 'email' | 'message';
  category: 'success' | 'error' | 'warning' | 'info' | 'announcement';
  title: string;
  content: string;
  link?: string | null;
  linkText?: string | null;
  isRead: boolean;
  isGlobal: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date;
  readAt?: Date | null;
}

// System announcement
export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'banner' | 'modal' | 'toast';
  style: 'info' | 'warning' | 'success' | 'error';
  isActive: boolean;
  isDismissible: boolean;
  showOnce: boolean;
  link?: string | null;
  linkText?: string | null;
  startAt?: Date | null;
  endAt?: Date | null;
}

interface NotificationContextType {
  // Toast notifications
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  
  // Database notifications
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: number) => void;
  refreshNotifications: () => void;
  
  // System announcements
  announcements: Announcement[];
  dismissAnnouncement: (announcementId: number) => void;
  
  // Convenience methods
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Fetch notifications from database
  const { data: notificationData, refetch: refetchNotifications, isLoading } = trpc.notification.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: !!user, refetchInterval: 30000 } // Refetch every 30 seconds
  );
  
  // Fetch announcements
  const { data: announcementData, refetch: refetchAnnouncements } = trpc.notification.getAnnouncements.useQuery(
    undefined,
    { enabled: !!user }
  );
  
  // Mutations
  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => refetchNotifications(),
  });
  
  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => refetchNotifications(),
  });
  
  const deleteNotificationMutation = trpc.notification.delete.useMutation({
    onSuccess: () => refetchNotifications(),
  });
  
  const dismissAnnouncementMutation = trpc.notification.dismissAnnouncement.useMutation({
    onSuccess: () => refetchAnnouncements(),
  });
  
  // Toast management
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-dismiss after duration (default 5 seconds)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);
  
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  // Convenience methods
  const success = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);
  
  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message, duration: 8000 });
  }, [showToast]);
  
  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);
  
  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);
  
  // Database notification methods
  const markAsRead = useCallback((notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  }, [markAsReadMutation]);
  
  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);
  
  const deleteNotification = useCallback((notificationId: number) => {
    deleteNotificationMutation.mutate({ notificationId });
  }, [deleteNotificationMutation]);
  
  const dismissAnnouncement = useCallback((announcementId: number) => {
    dismissAnnouncementMutation.mutate({ announcementId });
  }, [dismissAnnouncementMutation]);
  
  const refreshNotifications = useCallback(() => {
    refetchNotifications();
    refetchAnnouncements();
  }, [refetchNotifications, refetchAnnouncements]);
  
  // Show toast announcements automatically
  useEffect(() => {
    if (announcementData) {
      announcementData
        .filter(a => a.type === 'toast')
        .forEach(announcement => {
          showToast({
            type: announcement.style,
            title: announcement.title,
            message: announcement.content,
            duration: announcement.isDismissible ? 10000 : 0,
          });
        });
    }
  }, [announcementData, showToast]);
  
  const value: NotificationContextType = {
    toasts,
    showToast,
    dismissToast,
    notifications: notificationData?.notifications || [],
    unreadCount: notificationData?.unreadCount || 0,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    announcements: announcementData?.filter(a => a.type !== 'toast') || [],
    dismissAnnouncement,
    success,
    error,
    warning,
    info,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
