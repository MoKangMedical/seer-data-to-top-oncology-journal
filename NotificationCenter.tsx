import React, { useState } from 'react';
import { useNotification, Notification } from '@/contexts/NotificationContext';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Mail, 
  MessageSquare, 
  Megaphone,
  Settings,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';

const notificationIcons = {
  operation: Settings,
  system: Megaphone,
  email: Mail,
  message: MessageSquare,
};

const categoryColors = {
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
  announcement: 'bg-purple-100 text-purple-800',
};

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification; 
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  const Icon = notificationIcons[notification.type];
  const categoryColor = categoryColors[notification.category];
  
  return (
    <div
      className={cn(
        'p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors',
        !notification.isRead && 'bg-blue-50/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-full', categoryColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn('font-medium text-sm', !notification.isRead && 'text-foreground')}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {notification.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            {notification.link && (
              <Link href={notification.link}>
                <a className="text-xs text-primary flex items-center gap-1 hover:underline">
                  {notification.linkText || 'View'}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onMarkAsRead}
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Bell className="h-12 w-12 mb-2 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications
  } = useNotification();
  
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.isRead;
    return n.type === activeTab;
  });
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={refreshNotifications}
            >
              <Loader2 className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="unread"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="message"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Messages
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <EmptyState 
                  message={
                    activeTab === 'unread' 
                      ? 'No unread notifications' 
                      : 'No notifications yet'
                  } 
                />
              ) : (
                filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                  />
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <div className="p-2 border-t">
          <Link href="/settings/notifications">
            <a className="block">
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Settings className="h-4 w-4 mr-2" />
                Notification Settings
              </Button>
            </a>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
