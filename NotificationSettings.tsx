import React from 'react';
import { trpc } from '@/lib/trpc';
import { useNotification } from '@/contexts/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Clock, Volume2, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

export default function NotificationSettings() {
  const { success, error } = useNotification();
  
  const { data: preferences, isLoading, refetch } = trpc.notification.getPreferences.useQuery();
  
  const updatePreferences = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => {
      success('Settings saved', 'Your notification preferences have been updated.');
      refetch();
    },
    onError: (err) => {
      error('Failed to save', err.message);
    },
  });
  
  const handleToggle = (key: string, value: boolean) => {
    updatePreferences.mutate({ [key]: value });
  };
  
  const handleSelect = (key: string, value: string) => {
    updatePreferences.mutate({ [key]: value });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Link href="/">
          <a className="text-sm text-muted-foreground hover:text-foreground">← Back to Dashboard</a>
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      
      {/* Email Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure when you receive email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={preferences?.emailEnabled ?? true}
              onCheckedChange={(checked) => handleToggle('emailEnabled', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4 pl-4">
            <div className="flex items-center justify-between">
              <Label>Project completion</Label>
              <Switch
                checked={preferences?.emailOnProjectComplete ?? true}
                onCheckedChange={(checked) => handleToggle('emailOnProjectComplete', checked)}
                disabled={!preferences?.emailEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Manuscript ready</Label>
              <Switch
                checked={preferences?.emailOnManuscriptReady ?? true}
                onCheckedChange={(checked) => handleToggle('emailOnManuscriptReady', checked)}
                disabled={!preferences?.emailEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Data analysis complete</Label>
              <Switch
                checked={preferences?.emailOnDataAnalysis ?? true}
                onCheckedChange={(checked) => handleToggle('emailOnDataAnalysis', checked)}
                disabled={!preferences?.emailEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>System updates</Label>
              <Switch
                checked={preferences?.emailOnSystemUpdate ?? false}
                onCheckedChange={(checked) => handleToggle('emailOnSystemUpdate', checked)}
                disabled={!preferences?.emailEnabled}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Digest Frequency</Label>
              <p className="text-sm text-muted-foreground">
                How often to receive email summaries
              </p>
            </div>
            <Select
              value={preferences?.emailDigestFrequency ?? 'instant'}
              onValueChange={(value) => handleSelect('emailDigestFrequency', value)}
              disabled={!preferences?.emailEnabled}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* In-App Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>In-App Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how notifications appear in the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications within the application
              </p>
            </div>
            <Switch
              checked={preferences?.inAppEnabled ?? true}
              onCheckedChange={(checked) => handleToggle('inAppEnabled', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4 pl-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Operation Toasts</Label>
                <p className="text-sm text-muted-foreground">
                  Show toast notifications for operations
                </p>
              </div>
              <Switch
                checked={preferences?.showOperationToasts ?? true}
                onCheckedChange={(checked) => handleToggle('showOperationToasts', checked)}
                disabled={!preferences?.inAppEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Banners</Label>
                <p className="text-sm text-muted-foreground">
                  Show system announcement banners
                </p>
              </div>
              <Switch
                checked={preferences?.showSystemBanners ?? true}
                onCheckedChange={(checked) => handleToggle('showSystemBanners', checked)}
                disabled={!preferences?.inAppEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quiet Hours */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Quiet Hours</CardTitle>
          </div>
          <CardDescription>
            Pause notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Mute notifications during set hours
              </p>
            </div>
            <Switch
              checked={preferences?.quietHoursEnabled ?? false}
              onCheckedChange={(checked) => handleToggle('quietHoursEnabled', checked)}
            />
          </div>
          
          {preferences?.quietHoursEnabled && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={preferences?.quietHoursStart ?? '22:00'}
                    onChange={(e) => handleSelect('quietHoursStart', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={preferences?.quietHoursEnd ?? '08:00'}
                    onChange={(e) => handleSelect('quietHoursEnd', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Test Notification */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Test Notifications</CardTitle>
          </div>
          <CardDescription>
            Send a test notification to verify your settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestNotificationButton />
        </CardContent>
      </Card>
    </div>
  );
}

function TestNotificationButton() {
  const { success, error } = useNotification();
  
  const sendTest = trpc.notification.sendTestNotification.useMutation({
    onSuccess: () => {
      success('Test notification sent', 'Check your notifications!');
    },
    onError: (err) => {
      error('Failed to send', err.message);
    },
  });
  
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => sendTest.mutate({
          type: 'operation',
          title: 'Test Operation',
          content: 'This is a test operation notification.',
        })}
        disabled={sendTest.isPending}
      >
        {sendTest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Send Toast
      </Button>
      <Button
        variant="outline"
        onClick={() => sendTest.mutate({
          type: 'message',
          title: 'Test Message',
          content: 'This is a test message notification.',
        })}
        disabled={sendTest.isPending}
      >
        {sendTest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Send Message
      </Button>
    </div>
  );
}
