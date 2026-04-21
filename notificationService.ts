// Notification Service - handles all notification operations
import { getDb } from "./db";
import { 
  notifications, 
  systemAnnouncements, 
  notificationPreferences,
  dismissedAnnouncements,
  emailLogs,
  type Notification,
  type InsertNotification,
  type SystemAnnouncement,
  type InsertSystemAnnouncement,
  type NotificationPreference,
  type InsertNotificationPreference
} from "../drizzle/schema";
import { eq, and, desc, isNull, or, lte, gte, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

// ============ Notification CRUD ============

export async function createNotification(data: InsertNotification): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [notification] = await db.insert(notifications).values(data).$returningId();
  const [created] = await db.select().from(notifications).where(eq(notifications.id, notification.id));
  return created;
}

export async function getUserNotifications(
  userId: number, 
  options: { 
    limit?: number; 
    offset?: number; 
    unreadOnly?: boolean;
    type?: Notification['type'];
  } = {}
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  const db = await getDb();
  if (!db) return { notifications: [], total: 0, unreadCount: 0 };
  
  const { limit = 50, offset = 0, unreadOnly = false, type } = options;
  
  const whereConditions: any[] = [
    or(eq(notifications.userId, userId), eq(notifications.isGlobal, true))
  ];
  
  if (unreadOnly) {
    whereConditions.push(eq(notifications.isRead, false));
  }
  
  if (type) {
    whereConditions.push(eq(notifications.type, type));
  }
  
  const notificationList = await db
    .select()
    .from(notifications)
    .where(and(...whereConditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
  
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(...whereConditions));
  
  const unreadResult = await db
    .select({ unread: sql<number>`count(*)` })
    .from(notifications)
    .where(and(
      or(eq(notifications.userId, userId), eq(notifications.isGlobal, true)),
      eq(notifications.isRead, false)
    ));
  
  return {
    notifications: notificationList,
    total: Number(countResult[0]?.count || 0),
    unreadCount: Number(unreadResult[0]?.unread || 0)
  };
}

export async function markNotificationAsRead(notificationId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(
      eq(notifications.id, notificationId),
      or(eq(notifications.userId, userId), eq(notifications.isGlobal, true))
    ));
  return true;
}

export async function markAllNotificationsAsRead(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(
      or(eq(notifications.userId, userId), eq(notifications.isGlobal, true)),
      eq(notifications.isRead, false)
    ));
  return 1;
}

export async function deleteNotification(notificationId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db
    .delete(notifications)
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
  return true;
}

// ============ System Announcements ============

export async function createAnnouncement(data: InsertSystemAnnouncement): Promise<SystemAnnouncement | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [announcement] = await db.insert(systemAnnouncements).values(data).$returningId();
  const [created] = await db.select().from(systemAnnouncements).where(eq(systemAnnouncements.id, announcement.id));
  return created;
}

export async function getActiveAnnouncements(userId?: number): Promise<SystemAnnouncement[]> {
  const db = await getDb();
  if (!db) return [];
  
  const now = new Date();
  
  let announcementList = await db
    .select()
    .from(systemAnnouncements)
    .where(and(
      eq(systemAnnouncements.isActive, true),
      or(isNull(systemAnnouncements.startAt), lte(systemAnnouncements.startAt, now)),
      or(isNull(systemAnnouncements.endAt), gte(systemAnnouncements.endAt, now))
    ))
    .orderBy(desc(systemAnnouncements.createdAt));
  
  // Filter out dismissed announcements for this user
  if (userId) {
    const dismissed = await db
      .select({ announcementId: dismissedAnnouncements.announcementId })
      .from(dismissedAnnouncements)
      .where(eq(dismissedAnnouncements.userId, userId));
    
    const dismissedIds = new Set(dismissed.map((d) => d.announcementId));
    announcementList = announcementList.filter((a) => !dismissedIds.has(a.id));
  }
  
  return announcementList;
}

export async function dismissAnnouncement(userId: number, announcementId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.insert(dismissedAnnouncements).values({
    userId,
    announcementId
  });
  return true;
}

export async function updateAnnouncement(
  announcementId: number, 
  data: Partial<InsertSystemAnnouncement>
): Promise<SystemAnnouncement | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .update(systemAnnouncements)
    .set(data)
    .where(eq(systemAnnouncements.id, announcementId));
  
  const [updated] = await db
    .select()
    .from(systemAnnouncements)
    .where(eq(systemAnnouncements.id, announcementId));
  
  return updated || null;
}

export async function deleteAnnouncement(announcementId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(systemAnnouncements).where(eq(systemAnnouncements.id, announcementId));
  return true;
}

// ============ Notification Preferences ============

export async function getNotificationPreferences(userId: number): Promise<NotificationPreference | null> {
  const db = await getDb();
  if (!db) return null;
  
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
  return prefs || null;
}

export async function upsertNotificationPreferences(
  userId: number, 
  data: Partial<InsertNotificationPreference>
): Promise<NotificationPreference | null> {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await getNotificationPreferences(userId);
  
  if (existing) {
    await db
      .update(notificationPreferences)
      .set(data)
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({
      userId,
      ...data
    });
  }
  
  const [updated] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
  
  return updated;
}

// ============ Email Service ============

interface EmailOptions {
  userId: number;
  toEmail: string;
  subject: string;
  content: string;
  templateName?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const { userId, toEmail, subject, content, templateName } = options;
  
  // Log the email attempt
  const [emailLog] = await db.insert(emailLogs).values({
    userId,
    toEmail,
    subject,
    content,
    templateName,
    status: 'pending'
  }).$returningId();
  
  try {
    // Use the built-in notification system to send email
    // This integrates with the Manus notification API
    const success = await notifyOwner({
      title: subject,
      content: `To: ${toEmail}\n\n${content}`
    });
    
    // Update email log status
    await db
      .update(emailLogs)
      .set({ 
        status: success ? 'sent' : 'failed',
        sentAt: success ? new Date() : undefined,
        errorMessage: success ? undefined : 'Failed to send via notification API'
      })
      .where(eq(emailLogs.id, emailLog.id));
    
    return success;
  } catch (error) {
    await db
      .update(emailLogs)
      .set({ 
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
      .where(eq(emailLogs.id, emailLog.id));
    return false;
  }
}

// ============ Convenience Functions ============

// Create operation notification (for toast messages)
export async function notifyOperation(
  userId: number,
  title: string,
  content: string,
  category: 'success' | 'error' | 'warning' | 'info' = 'info',
  metadata?: Record<string, unknown>
): Promise<Notification | null> {
  return createNotification({
    userId,
    type: 'operation',
    category,
    title,
    content,
    metadata: metadata as any
  });
}

// Create system message notification
export async function notifyMessage(
  userId: number,
  title: string,
  content: string,
  link?: string,
  linkText?: string
): Promise<Notification | null> {
  return createNotification({
    userId,
    type: 'message',
    category: 'info',
    title,
    content,
    link,
    linkText
  });
}

// Send email notification with preference check
export async function sendEmailNotification(
  userId: number,
  email: string,
  subject: string,
  content: string,
  notificationType: 'projectComplete' | 'manuscriptReady' | 'dataAnalysis' | 'systemUpdate'
): Promise<boolean> {
  // Check user preferences
  const prefs = await getNotificationPreferences(userId);
  
  if (prefs && !prefs.emailEnabled) {
    return false;
  }
  
  // Check specific notification type preference
  if (prefs) {
    switch (notificationType) {
      case 'projectComplete':
        if (!prefs.emailOnProjectComplete) return false;
        break;
      case 'manuscriptReady':
        if (!prefs.emailOnManuscriptReady) return false;
        break;
      case 'dataAnalysis':
        if (!prefs.emailOnDataAnalysis) return false;
        break;
      case 'systemUpdate':
        if (!prefs.emailOnSystemUpdate) return false;
        break;
    }
  }
  
  // Also create an in-app notification
  await createNotification({
    userId,
    type: 'email',
    category: 'info',
    title: subject,
    content: `Email sent to ${email}`,
    metadata: { notificationType } as any
  });
  
  return sendEmail({
    userId,
    toEmail: email,
    subject,
    content,
    templateName: notificationType
  });
}

// Email templates
export const emailTemplates = {
  projectComplete: (projectTitle: string, projectId: number) => ({
    subject: `Your research project "${projectTitle}" is complete`,
    content: `
Dear Researcher,

Great news! Your research project "${projectTitle}" has been completed successfully.

You can now:
- Download your complete manuscript
- Export all figures and tables
- Generate cover letters for journal submission

View your project: /projects/${projectId}

Best regards,
SEER Data to Oncology Top Journal Platform
    `.trim()
  }),
  
  manuscriptReady: (projectTitle: string, projectId: number) => ({
    subject: `Manuscript ready for "${projectTitle}"`,
    content: `
Dear Researcher,

Your manuscript for "${projectTitle}" has been generated and is ready for review.

The manuscript includes:
- Full text (5000+ words)
- Tables and figures
- References in Vancouver format
- All required JAMA declarations

View and download: /projects/${projectId}

Best regards,
SEER Data to Oncology Top Journal Platform
    `.trim()
  }),
  
  dataAnalysis: (projectTitle: string, analysisType: string) => ({
    subject: `Data analysis complete for "${projectTitle}"`,
    content: `
Dear Researcher,

The ${analysisType} analysis for your project "${projectTitle}" has been completed.

Results are now available in your project dashboard.

Best regards,
SEER Data to Oncology Top Journal Platform
    `.trim()
  }),
  
  systemUpdate: (updateTitle: string, updateContent: string) => ({
    subject: `System Update: ${updateTitle}`,
    content: updateContent
  })
};

export default {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createAnnouncement,
  getActiveAnnouncements,
  dismissAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getNotificationPreferences,
  upsertNotificationPreferences,
  sendEmail,
  notifyOperation,
  notifyMessage,
  sendEmailNotification,
  emailTemplates
};
