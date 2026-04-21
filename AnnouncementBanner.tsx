import React, { useState } from 'react';
import { useNotification, Announcement } from '@/contexts/NotificationContext';
import { X, Info, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const bannerStyles = {
  info: {
    bg: 'bg-blue-600',
    text: 'text-white',
    icon: Info,
  },
  warning: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-900',
    icon: AlertTriangle,
  },
  success: {
    bg: 'bg-green-600',
    text: 'text-white',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-600',
    text: 'text-white',
    icon: XCircle,
  },
};

function BannerItem({ announcement, onDismiss }: { announcement: Announcement; onDismiss: () => void }) {
  const styles = bannerStyles[announcement.style];
  const Icon = styles.icon;
  
  return (
    <div className={cn('relative py-2 px-4', styles.bg)}>
      <div className="container mx-auto flex items-center justify-center gap-3">
        <Icon className={cn('h-4 w-4 flex-shrink-0', styles.text)} />
        <p className={cn('text-sm font-medium', styles.text)}>
          {announcement.title}
          {announcement.content && announcement.content !== announcement.title && (
            <span className="ml-1 font-normal opacity-90">— {announcement.content}</span>
          )}
        </p>
        {announcement.link && (
          <a
            href={announcement.link}
            className={cn('inline-flex items-center gap-1 text-sm font-medium underline', styles.text)}
          >
            {announcement.linkText || 'Learn more'}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {announcement.isDismissible && (
          <button
            onClick={onDismiss}
            className={cn('absolute right-4 p-1 rounded hover:bg-white/10', styles.text)}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ModalAnnouncement({ announcement, onDismiss }: { announcement: Announcement; onDismiss: () => void }) {
  const [open, setOpen] = useState(true);
  const styles = bannerStyles[announcement.style];
  const Icon = styles.icon;
  
  const handleClose = () => {
    setOpen(false);
    if (announcement.isDismissible) {
      onDismiss();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-full', styles.bg)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>{announcement.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {announcement.content}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          {announcement.link && (
            <Button variant="outline" asChild>
              <a href={announcement.link}>
                {announcement.linkText || 'Learn more'}
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
          {announcement.isDismissible && (
            <Button onClick={handleClose}>
              Got it
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AnnouncementBanner() {
  const { announcements, dismissAnnouncement } = useNotification();
  
  const bannerAnnouncements = announcements.filter(a => a.type === 'banner');
  const modalAnnouncements = announcements.filter(a => a.type === 'modal');
  
  return (
    <>
      {/* Banner announcements at top of page */}
      {bannerAnnouncements.length > 0 && (
        <div className="w-full">
          {bannerAnnouncements.map(announcement => (
            <BannerItem
              key={announcement.id}
              announcement={announcement}
              onDismiss={() => dismissAnnouncement(announcement.id)}
            />
          ))}
        </div>
      )}
      
      {/* Modal announcements */}
      {modalAnnouncements.map(announcement => (
        <ModalAnnouncement
          key={announcement.id}
          announcement={announcement}
          onDismiss={() => dismissAnnouncement(announcement.id)}
        />
      ))}
    </>
  );
}

export default AnnouncementBanner;
