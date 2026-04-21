import { describe, it, expect } from 'vitest';
import * as notificationService from './notificationService';

describe('Notification Service', () => {
  describe('Email Templates', () => {
    it('should generate project complete email template', () => {
      const template = notificationService.emailTemplates.projectComplete('Test Project', 123);
      
      expect(template.subject).toContain('Test Project');
      expect(template.subject).toContain('complete');
      expect(template.content).toContain('Test Project');
      expect(template.content).toContain('/projects/123');
    });

    it('should generate manuscript ready email template', () => {
      const template = notificationService.emailTemplates.manuscriptReady('Cancer Study', 456);
      
      expect(template.subject).toContain('Manuscript ready');
      expect(template.subject).toContain('Cancer Study');
      expect(template.content).toContain('5000+ words');
      expect(template.content).toContain('Vancouver format');
      expect(template.content).toContain('/projects/456');
    });

    it('should generate data analysis email template', () => {
      const template = notificationService.emailTemplates.dataAnalysis('Lung Cancer Study', 'survival analysis');
      
      expect(template.subject).toContain('Data analysis complete');
      expect(template.subject).toContain('Lung Cancer Study');
      expect(template.content).toContain('survival analysis');
    });

    it('should generate system update email template', () => {
      const template = notificationService.emailTemplates.systemUpdate('New Feature', 'We added a new feature!');
      
      expect(template.subject).toContain('System Update');
      expect(template.subject).toContain('New Feature');
      expect(template.content).toBe('We added a new feature!');
    });
  });

  describe('Service Functions', () => {
    it('should export all required functions', () => {
      expect(typeof notificationService.createNotification).toBe('function');
      expect(typeof notificationService.getUserNotifications).toBe('function');
      expect(typeof notificationService.markNotificationAsRead).toBe('function');
      expect(typeof notificationService.markAllNotificationsAsRead).toBe('function');
      expect(typeof notificationService.deleteNotification).toBe('function');
      expect(typeof notificationService.createAnnouncement).toBe('function');
      expect(typeof notificationService.getActiveAnnouncements).toBe('function');
      expect(typeof notificationService.dismissAnnouncement).toBe('function');
      expect(typeof notificationService.updateAnnouncement).toBe('function');
      expect(typeof notificationService.deleteAnnouncement).toBe('function');
      expect(typeof notificationService.getNotificationPreferences).toBe('function');
      expect(typeof notificationService.upsertNotificationPreferences).toBe('function');
      expect(typeof notificationService.sendEmail).toBe('function');
      expect(typeof notificationService.notifyOperation).toBe('function');
      expect(typeof notificationService.notifyMessage).toBe('function');
      expect(typeof notificationService.sendEmailNotification).toBe('function');
    });

    it('should have default export with all functions', () => {
      const defaultExport = notificationService.default;
      
      expect(typeof defaultExport.createNotification).toBe('function');
      expect(typeof defaultExport.getUserNotifications).toBe('function');
      expect(typeof defaultExport.markNotificationAsRead).toBe('function');
      expect(typeof defaultExport.markAllNotificationsAsRead).toBe('function');
      expect(typeof defaultExport.deleteNotification).toBe('function');
      expect(typeof defaultExport.createAnnouncement).toBe('function');
      expect(typeof defaultExport.getActiveAnnouncements).toBe('function');
      expect(typeof defaultExport.dismissAnnouncement).toBe('function');
      expect(typeof defaultExport.updateAnnouncement).toBe('function');
      expect(typeof defaultExport.deleteAnnouncement).toBe('function');
      expect(typeof defaultExport.getNotificationPreferences).toBe('function');
      expect(typeof defaultExport.upsertNotificationPreferences).toBe('function');
      expect(typeof defaultExport.sendEmail).toBe('function');
      expect(typeof defaultExport.notifyOperation).toBe('function');
      expect(typeof defaultExport.notifyMessage).toBe('function');
      expect(typeof defaultExport.sendEmailNotification).toBe('function');
    });
  });

  describe('Email Template Content', () => {
    it('should include all required sections in project complete template', () => {
      const template = notificationService.emailTemplates.projectComplete('My Project', 1);
      
      expect(template.content).toContain('Dear Researcher');
      expect(template.content).toContain('Download your complete manuscript');
      expect(template.content).toContain('Export all figures and tables');
      expect(template.content).toContain('Generate cover letters');
      expect(template.content).toContain('Best regards');
      expect(template.content).toContain('SEER Data to Oncology Top Journal Platform');
    });

    it('should include all required sections in manuscript ready template', () => {
      const template = notificationService.emailTemplates.manuscriptReady('My Project', 1);
      
      expect(template.content).toContain('Dear Researcher');
      expect(template.content).toContain('Full text');
      expect(template.content).toContain('Tables and figures');
      expect(template.content).toContain('References');
      expect(template.content).toContain('JAMA declarations');
      expect(template.content).toContain('Best regards');
    });
  });
});
