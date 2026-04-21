import { eq, and, desc, gte } from "drizzle-orm";
import { getDb } from "./db";
import {
  pricingPlans,
  subscriptions,
  downloadRecords,
  paymentRecords,
  type PricingPlan,
  type Subscription,
  type InsertSubscription,
  type InsertDownloadRecord,
  type InsertPaymentRecord,
} from "../drizzle/schema";

// Default pricing plans data
export const DEFAULT_PRICING_PLANS = [
  {
    name: "单次下载",
    nameEn: "Single Download",
    description: "单个研究项目完整下载",
    price: 5000, // ¥50.00 in cents
    billingCycle: "once" as const,
    downloadQuota: 1,
    features: [
      "单个研究项目完整下载",
      "论文 Word/PDF 格式",
      "Stata/R 分析代码",
      "所有图表文件",
      "Lancet 声明文件",
    ],
    hasWordPdf: true,
    hasStataRCode: true,
    hasAllFigures: true,
    hasLancetDeclaration: true,
    hasPrioritySupport: false,
    hasDedicatedSupport: false,
    hasAdvancedStats: false,
    hasCustomTemplate: false,
    isPopular: false,
    displayOrder: 1,
  },
  {
    name: "基础版",
    nameEn: "Basic",
    description: "每月5个研究下载",
    price: 9900, // ¥99.00 in cents
    billingCycle: "monthly" as const,
    downloadQuota: 5,
    features: [
      "每月 5 个研究下载",
      "论文 Word/PDF 格式",
      "Stata/R 分析代码",
      "所有图表文件",
      "Lancet 声明文件",
      "优先客服支持",
    ],
    hasWordPdf: true,
    hasStataRCode: true,
    hasAllFigures: true,
    hasLancetDeclaration: true,
    hasPrioritySupport: true,
    hasDedicatedSupport: false,
    hasAdvancedStats: false,
    hasCustomTemplate: false,
    isPopular: false,
    displayOrder: 2,
  },
  {
    name: "标准版",
    nameEn: "Standard",
    description: "每月10个研究下载",
    price: 15900, // ¥159.00 in cents
    billingCycle: "monthly" as const,
    downloadQuota: 10,
    features: [
      "每月 10 个研究下载",
      "论文 Word/PDF 格式",
      "Stata/R 分析代码",
      "所有图表文件",
      "Lancet 声明文件",
      "优先客服支持",
      "高级统计模型",
    ],
    hasWordPdf: true,
    hasStataRCode: true,
    hasAllFigures: true,
    hasLancetDeclaration: true,
    hasPrioritySupport: true,
    hasDedicatedSupport: false,
    hasAdvancedStats: true,
    hasCustomTemplate: false,
    isPopular: true,
    displayOrder: 3,
  },
  {
    name: "高级版",
    nameEn: "Premium",
    description: "每月20个研究下载",
    price: 29900, // ¥299.00 in cents
    billingCycle: "monthly" as const,
    downloadQuota: 20,
    features: [
      "每月 20 个研究下载",
      "论文 Word/PDF 格式",
      "Stata/R 分析代码",
      "所有图表文件",
      "Lancet 声明文件",
      "专属客服支持",
      "高级统计模型",
      "自定义论文模板",
    ],
    hasWordPdf: true,
    hasStataRCode: true,
    hasAllFigures: true,
    hasLancetDeclaration: true,
    hasPrioritySupport: true,
    hasDedicatedSupport: true,
    hasAdvancedStats: true,
    hasCustomTemplate: true,
    isPopular: false,
    displayOrder: 4,
  },
];

// Initialize default pricing plans
export async function initializePricingPlans(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if plans already exist
  const existingPlans = await db.select().from(pricingPlans).limit(1);
  if (existingPlans.length > 0) {
    return; // Plans already initialized
  }
  
  // Insert default plans
  for (const plan of DEFAULT_PRICING_PLANS) {
    await db.insert(pricingPlans).values({
      ...plan,
      features: JSON.stringify(plan.features),
    });
  }
}

// Get all active pricing plans
export async function getPricingPlans(): Promise<PricingPlan[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const plans = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.isActive, true))
    .orderBy(pricingPlans.displayOrder);
  return plans;
}

// Get a specific pricing plan
export async function getPricingPlan(planId: number): Promise<PricingPlan | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [plan] = await db
    .select()
    .from(pricingPlans)
    .where(eq(pricingPlans.id, planId));
  return plan || null;
}

// Get user's active subscription
export async function getUserSubscription(userId: number): Promise<Subscription | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  
  // Check if subscription is expired
  if (subscription && subscription.endDate && subscription.endDate < now) {
    // Mark as expired
    await db
      .update(subscriptions)
      .set({ status: "expired" })
      .where(eq(subscriptions.id, subscription.id));
    return null;
  }
  
  return subscription || null;
}

// Get user's subscription with plan details
export async function getSubscriptionWithPlan(userId: number): Promise<{
  id: number;
  planName: string;
  downloadQuotaTotal: number;
  downloadQuotaRemaining: number;
  startDate: Date;
  endDate: Date | null;
  status: string;
} | null> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return null;
  }
  const plan = await getPricingPlan(subscription.planId);
  return {
    id: subscription.id,
    planName: plan?.name || "Unknown",
    downloadQuotaTotal: subscription.downloadQuotaTotal,
    downloadQuotaRemaining: subscription.downloadQuotaRemaining,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    status: subscription.status,
  };
}

// Get user's remaining download quota
export async function getUserDownloadQuota(userId: number): Promise<number> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return 0;
  }
  return subscription.downloadQuotaRemaining;
}

// Check if user can download
export async function canUserDownload(userId: number): Promise<boolean> {
  const quota = await getUserDownloadQuota(userId);
  return quota > 0;
}

// Create a new subscription
export async function createSubscription(
  userId: number,
  planId: number,
  paymentMethod: string,
  paymentId?: string
): Promise<Subscription> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const plan = await getPricingPlan(planId);
  if (!plan) {
    throw new Error("Invalid plan");
  }
  
  const now = new Date();
  let endDate: Date | null = null;
  
  if (plan.billingCycle === "monthly") {
    endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (plan.billingCycle === "yearly") {
    endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  // For "once" billing cycle, endDate is null (no expiration)
  
  const subscriptionData: InsertSubscription = {
    userId,
    planId,
    status: "active",
    downloadQuotaRemaining: plan.downloadQuota,
    downloadQuotaTotal: plan.downloadQuota,
    startDate: now,
    endDate,
    paymentMethod,
    paymentId,
    amountPaid: plan.price,
  };
  
  const [result] = await db.insert(subscriptions).values(subscriptionData);
  const subscriptionId = result.insertId;
  
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, Number(subscriptionId)));
  
  return subscription;
}

// Record a download and deduct quota
export async function recordDownload(
  userId: number,
  projectId: number,
  downloadType: string,
  fileName?: string,
  fileUrl?: string
): Promise<{ success: boolean; remainingQuota: number; message?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    return { success: false, remainingQuota: 0, message: "No active subscription" };
  }
  
  if (subscription.downloadQuotaRemaining <= 0) {
    return { success: false, remainingQuota: 0, message: "Download quota exceeded" };
  }
  
  // Deduct quota
  await db
    .update(subscriptions)
    .set({
      downloadQuotaRemaining: subscription.downloadQuotaRemaining - 1,
    })
    .where(eq(subscriptions.id, subscription.id));
  
  // Record download
  const downloadData: InsertDownloadRecord = {
    userId,
    subscriptionId: subscription.id,
    projectId,
    downloadType: downloadType as any,
    fileName,
    fileUrl,
  };
  
  await db.insert(downloadRecords).values(downloadData);
  
  return {
    success: true,
    remainingQuota: subscription.downloadQuotaRemaining - 1,
  };
}

// Get user's download history
export async function getUserDownloadHistory(
  userId: number,
  limit: number = 20
): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const records = await db
    .select()
    .from(downloadRecords)
    .where(eq(downloadRecords.userId, userId))
    .orderBy(desc(downloadRecords.createdAt))
    .limit(limit);
  
  return records;
}

// Create payment record
export async function createPaymentRecord(
  userId: number,
  planId: number,
  paymentMethod: "wechat" | "alipay" | "stripe" | "manual",
  amount: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const paymentData: InsertPaymentRecord = {
    userId,
    planId,
    amount,
    paymentMethod,
    paymentStatus: "pending",
  };
  
  const [result] = await db.insert(paymentRecords).values(paymentData);
  return Number(result.insertId);
}

// Update payment status
export async function updatePaymentStatus(
  paymentId: number,
  status: "completed" | "failed" | "refunded",
  transactionId?: string,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(paymentRecords)
    .set({
      paymentStatus: status,
      transactionId,
      errorMessage,
      paidAt: status === "completed" ? new Date() : undefined,
    })
    .where(eq(paymentRecords.id, paymentId));
}

