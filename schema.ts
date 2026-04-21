
/**
 * Notifications - user notifications and system announcements
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for system-wide announcements
  type: mysqlEnum("type", [
    "operation",      // User operation feedback (toast)
    "system",         // System announcements
    "email",          // Email notification record
    "message"         // In-app message
  ]).notNull(),
  category: mysqlEnum("category", [
    "success",
    "error",
    "warning",
    "info",
    "announcement"
  ]).default("info").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  link: varchar("link", { length: 500 }), // Optional link to related resource
  linkText: varchar("linkText", { length: 100 }), // Link button text
  isRead: boolean("isRead").default(false).notNull(),
  isGlobal: boolean("isGlobal").default(false).notNull(), // System-wide announcement
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  expiresAt: timestamp("expiresAt"), // For time-limited announcements
  metadata: json("metadata"), // Additional data (e.g., projectId, actionType)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * System announcements - global announcements shown to all users
 */
export const systemAnnouncements = mysqlTable("system_announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["banner", "modal", "toast"]).default("banner").notNull(),
  style: mysqlEnum("style", ["info", "warning", "success", "error"]).default("info").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  isDismissible: boolean("isDismissible").default(true).notNull(),
  showOnce: boolean("showOnce").default(false).notNull(), // Only show once per user
  link: varchar("link", { length: 500 }),
  linkText: varchar("linkText", { length: 100 }),
  startAt: timestamp("startAt"),
  endAt: timestamp("endAt"),
  createdBy: int("createdBy"), // Admin user ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemAnnouncement = typeof systemAnnouncements.$inferSelect;
export type InsertSystemAnnouncement = typeof systemAnnouncements.$inferInsert;

/**
 * User notification preferences
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  // Email preferences
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  emailOnProjectComplete: boolean("emailOnProjectComplete").default(true).notNull(),
  emailOnManuscriptReady: boolean("emailOnManuscriptReady").default(true).notNull(),
  emailOnDataAnalysis: boolean("emailOnDataAnalysis").default(true).notNull(),
  emailOnSystemUpdate: boolean("emailOnSystemUpdate").default(false).notNull(),
  emailDigestFrequency: mysqlEnum("emailDigestFrequency", ["instant", "daily", "weekly", "never"]).default("instant").notNull(),
  // In-app preferences
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  showOperationToasts: boolean("showOperationToasts").default(true).notNull(),
  showSystemBanners: boolean("showSystemBanners").default(true).notNull(),
  // Quiet hours
  quietHoursEnabled: boolean("quietHoursEnabled").default(false).notNull(),
  quietHoursStart: varchar("quietHoursStart", { length: 5 }), // HH:MM format
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Dismissed announcements - track which announcements users have dismissed
 */
export const dismissedAnnouncements = mysqlTable("dismissed_announcements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  announcementId: int("announcementId").notNull(),
  dismissedAt: timestamp("dismissedAt").defaultNow().notNull(),
});

export type DismissedAnnouncement = typeof dismissedAnnouncements.$inferSelect;
export type InsertDismissedAnnouncement = typeof dismissedAnnouncements.$inferInsert;

/**
 * Email logs - track sent emails
 */
export const emailLogs = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  templateName: varchar("templateName", { length: 100 }),
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;


/**
 * SEER Publications - Latest SEER research papers from PubMed
 */
export const seerPublications = mysqlTable("seer_publications", {
  id: int("id").autoincrement().primaryKey(),
  pmid: varchar("pmid", { length: 20 }).notNull().unique(),
  title: text("title").notNull(),
  authors: text("authors"),
  journal: varchar("journal", { length: 255 }),
  journalAbbrev: varchar("journalAbbrev", { length: 100 }),
  impactFactor: varchar("impactFactor", { length: 20 }),
  year: int("year"),
  month: varchar("month", { length: 20 }),
  volume: varchar("volume", { length: 50 }),
  issue: varchar("issue", { length: 50 }),
  pages: varchar("pages", { length: 50 }),
  doi: varchar("doi", { length: 100 }),
  // Abstract and summary
  abstractText: text("abstractText"),
  summary: text("summary"), // AI-generated 500-word summary
  keyFindings: json("keyFindings"), // Key findings extracted by AI
  // Research characteristics
  cancerType: varchar("cancerType", { length: 100 }),
  studyDesign: varchar("studyDesign", { length: 100 }),
  statisticalMethods: json("statisticalMethods"), // Methods used in the study
  sampleSize: varchar("sampleSize", { length: 50 }),
  // AI analysis
  methodologyScore: int("methodologyScore"), // 1-100 score
  innovationScore: int("innovationScore"),
  clinicalRelevanceScore: int("clinicalRelevanceScore"),
  aiAnalysis: json("aiAnalysis"), // Detailed AI analysis
  // Display settings
  isFeatured: boolean("isFeatured").default(false).notNull(),
  displayOrder: int("displayOrder"),
  // Timestamps
  publishedDate: timestamp("publishedDate"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  analyzedAt: timestamp("analyzedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeerPublication = typeof seerPublications.$inferSelect;
export type InsertSeerPublication = typeof seerPublications.$inferInsert;

/**
 * SEER Research Patterns - AI-learned patterns from SEER publications
 */
export const seerResearchPatterns = mysqlTable("seer_research_patterns", {
  id: int("id").autoincrement().primaryKey(),
  patternType: mysqlEnum("patternType", [
    "methodology",      // Common statistical methods
    "study_design",     // Study design patterns
    "cancer_type",      // Cancer type trends
    "variable_usage",   // Common SEER variables
    "outcome_measure",  // Outcome measurement patterns
    "publication_trend" // Publication trends
  ]).notNull(),
  patternName: varchar("patternName", { length: 255 }).notNull(),
  description: text("description"),
  frequency: int("frequency").default(0).notNull(), // How often this pattern appears
  examples: json("examples"), // Example PMIDs
  recommendations: text("recommendations"), // AI recommendations for users
  confidence: int("confidence"), // 1-100 confidence score
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeerResearchPattern = typeof seerResearchPatterns.$inferSelect;
export type InsertSeerResearchPattern = typeof seerResearchPatterns.$inferInsert;

/**
 * SEER Learning Insights - AI-generated insights from analyzing publications
 */
export const seerLearningInsights = mysqlTable("seer_learning_insights", {
  id: int("id").autoincrement().primaryKey(),
  insightType: mysqlEnum("insightType", [
    "best_practice",    // Best practices identified
    "common_pitfall",   // Common mistakes to avoid
    "emerging_trend",   // Emerging research trends
    "method_comparison",// Comparison of methods
    "journal_preference"// Journal preferences for topics
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  supportingEvidence: json("supportingEvidence"), // PMIDs and quotes
  applicableCancerTypes: json("applicableCancerTypes"),
  applicableStudyDesigns: json("applicableStudyDesigns"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  helpfulCount: int("helpfulCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeerLearningInsight = typeof seerLearningInsights.$inferSelect;
export type InsertSeerLearningInsight = typeof seerLearningInsights.$inferInsert;

/**
 * Publication fetch logs - track PubMed fetch history
 */
export const publicationFetchLogs = mysqlTable("publication_fetch_logs", {
  id: int("id").autoincrement().primaryKey(),
  fetchType: mysqlEnum("fetchType", ["scheduled", "manual", "initial"]).notNull(),
  query: text("query"),
  totalResults: int("totalResults"),
  newPublications: int("newPublications"),
  updatedPublications: int("updatedPublications"),
  status: mysqlEnum("status", ["success", "partial", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
  duration: int("duration"), // in milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PublicationFetchLog = typeof publicationFetchLogs.$inferSelect;
export type InsertPublicationFetchLog = typeof publicationFetchLogs.$inferInsert;


/**
 * Pricing Plans - Available subscription plans
 */
export const pricingPlans = mysqlTable("pricing_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }).notNull(),
  description: text("description"),
  price: int("price").notNull(), // Price in CNY (cents)
  currency: varchar("currency", { length: 10 }).default("CNY").notNull(),
  billingCycle: mysqlEnum("billingCycle", ["once", "monthly", "yearly"]).notNull(),
  downloadQuota: int("downloadQuota").notNull(), // Number of downloads allowed
  // Features included
  features: json("features"), // Array of feature strings
  hasWordPdf: boolean("hasWordPdf").default(true).notNull(),
  hasStataRCode: boolean("hasStataRCode").default(true).notNull(),
  hasAllFigures: boolean("hasAllFigures").default(true).notNull(),
  hasLancetDeclaration: boolean("hasLancetDeclaration").default(true).notNull(),
  hasPrioritySupport: boolean("hasPrioritySupport").default(false).notNull(),
  hasDedicatedSupport: boolean("hasDedicatedSupport").default(false).notNull(),
  hasAdvancedStats: boolean("hasAdvancedStats").default(false).notNull(),
  hasCustomTemplate: boolean("hasCustomTemplate").default(false).notNull(),
  // Display settings
  isPopular: boolean("isPopular").default(false).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type InsertPricingPlan = typeof pricingPlans.$inferInsert;

/**
 * User Subscriptions - User subscription records
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled", "pending"]).default("pending").notNull(),
  // Quota tracking
  downloadQuotaRemaining: int("downloadQuotaRemaining").notNull(),
  downloadQuotaTotal: int("downloadQuotaTotal").notNull(),
  // Billing period
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  // Payment info
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentId: varchar("paymentId", { length: 100 }),
  amountPaid: int("amountPaid"), // Amount in cents
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Download Records - Track user downloads
 */
export const downloadRecords = mysqlTable("download_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId"),
  projectId: int("projectId").notNull(),
  downloadType: mysqlEnum("downloadType", [
    "manuscript_word",
    "manuscript_pdf",
    "manuscript_jama",
    "analysis_code",
    "figures",
    "tables",
    "references",
    "cover_letter",
    "full_package"
  ]).notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileUrl: varchar("fileUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DownloadRecord = typeof downloadRecords.$inferSelect;
export type InsertDownloadRecord = typeof downloadRecords.$inferInsert;

/**
 * Payment Records - Track payment transactions
 */
export const paymentRecords = mysqlTable("payment_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId"),
  planId: int("planId").notNull(),
  amount: int("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 10 }).default("CNY").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["wechat", "alipay", "stripe", "manual"]).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  transactionId: varchar("transactionId", { length: 100 }),
  paymentData: json("paymentData"), // Additional payment data
  errorMessage: text("errorMessage"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type InsertPaymentRecord = typeof paymentRecords.$inferInsert;
