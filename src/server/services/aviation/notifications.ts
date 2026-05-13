import * as admin from "firebase-admin";
import { getFirebaseApp, isFirebaseEnabled } from "@/server/firebase";
import { query } from "@/lib/db";
import { scrapeHome, type ArticleSummary } from "@/server/scrapers/aviation-scraper";

const FCM_TOPIC = "breaking_news";
const MAX_NOTIFY_PER_SCAN = 5;

// --------------- interfaces ---------------

export interface SentNotification {
  id: number;
  articleUrl: string;
  title: string;
  image: string | null;
  sentAt: string;
}

export interface NotificationSetting {
  id: number;
  deviceToken: string;
  enabled: boolean;
  topic: string;
  createdAt: string;
  updatedAt: string;
}

// --------------- FCM helpers ---------------

async function sendFcm(
  title: string,
  body: string,
  imageUrl?: string,
  data?: Record<string, string>
): Promise<string> {
  const app = getFirebaseApp();
  if (!app) {
    console.log(`[aviation-fcm] [dry-run] ${title}`);
    return "dry-run";
  }

  const message: admin.messaging.Message = {
    topic: FCM_TOPIC,
    notification: {
      title,
      body,
      imageUrl: imageUrl || undefined,
    },
    data: data || {},
    android: {
      priority: "high",
      notification: {
        channelId: "aviation_news",
        priority: "high",
        defaultSound: true,
      },
    },
  };

  return admin.messaging(app).send(message);
}

// --------------- scan & notify ---------------

export async function scanAndNotify(): Promise<{
  sent: number;
  articles: string[];
}> {
  const home = await scrapeHome();
  const latestArticles: ArticleSummary[] = home.latestNews.slice(0, 10);

  let sentCount = 0;
  const sentArticles: string[] = [];

  for (const article of latestArticles) {
    if (sentCount >= MAX_NOTIFY_PER_SCAN) break;

    // Check if already sent
    const existing = (await query(
      "aviation",
      "SELECT id FROM sent_notifications WHERE articleUrl = ? LIMIT 1",
      [article.url]
    )) as { id: number }[];

    if (existing.length > 0) continue;

    // Send notification
    try {
      await sendFcm(
        article.title,
        article.excerpt || article.category,
        article.image,
        { url: article.url, category: article.category }
      );

      // Save to DB
      await query(
        "aviation",
        `INSERT INTO sent_notifications (articleUrl, title, image, sentAt)
         VALUES (?, ?, ?, NOW())`,
        [article.url, article.title, article.image || null]
      );

      sentCount++;
      sentArticles.push(article.url);
    } catch (err) {
      console.error(`[aviation-notify] Failed to send for ${article.url}:`, err);
    }
  }

  return { sent: sentCount, articles: sentArticles };
}

// --------------- history ---------------

export async function getHistory(limit: number = 50): Promise<SentNotification[]> {
  const rows = (await query(
    "aviation",
    "SELECT id, articleUrl, title, image, sentAt FROM sent_notifications ORDER BY sentAt DESC LIMIT ?",
    [limit]
  )) as SentNotification[];
  return rows;
}

// --------------- ad notifications ---------------

export async function sendAdNotification(
  title: string,
  body: string,
  imageUrl?: string,
  storeUrl?: string
): Promise<{ success: boolean; messageId: string }> {
  const data: Record<string, string> = { type: "ad" };
  if (storeUrl) data.storeUrl = storeUrl;

  const messageId = await sendFcm(title, body, imageUrl, data);
  return { success: true, messageId };
}

// --------------- status ---------------

export async function getStatus(): Promise<{
  firebaseEnabled: boolean;
  topicName: string;
  totalSent: number;
  lastSentAt: string | null;
}> {
  const countRows = (await query(
    "aviation",
    "SELECT COUNT(*) AS cnt FROM sent_notifications"
  )) as { cnt: number }[];

  const lastRows = (await query(
    "aviation",
    "SELECT sentAt FROM sent_notifications ORDER BY sentAt DESC LIMIT 1"
  )) as { sentAt: string }[];

  return {
    firebaseEnabled: isFirebaseEnabled(),
    topicName: FCM_TOPIC,
    totalSent: countRows[0]?.cnt || 0,
    lastSentAt: lastRows[0]?.sentAt || null,
  };
}

// --------------- device settings ---------------

export async function updateSetting(
  deviceToken: string,
  enabled: boolean
): Promise<NotificationSetting> {
  const app = getFirebaseApp();

  if (app) {
    const messaging = admin.messaging(app);
    if (enabled) {
      await messaging.subscribeToTopic([deviceToken], FCM_TOPIC);
    } else {
      await messaging.unsubscribeFromTopic([deviceToken], FCM_TOPIC);
    }
  }

  // Upsert
  await query(
    "aviation",
    `INSERT INTO notification_settings (deviceToken, enabled, topic, createdAt, updatedAt)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), updatedAt = NOW()`,
    [deviceToken, enabled ? 1 : 0, FCM_TOPIC]
  );

  const rows = (await query(
    "aviation",
    "SELECT id, deviceToken, enabled, topic, createdAt, updatedAt FROM notification_settings WHERE deviceToken = ? LIMIT 1",
    [deviceToken]
  )) as NotificationSetting[];

  const setting = rows[0];
  return { ...setting, enabled: !!setting.enabled };
}

export async function getSetting(
  deviceToken: string
): Promise<NotificationSetting | null> {
  const rows = (await query(
    "aviation",
    "SELECT id, deviceToken, enabled, topic, createdAt, updatedAt FROM notification_settings WHERE deviceToken = ? LIMIT 1",
    [deviceToken]
  )) as NotificationSetting[];

  if (rows.length === 0) return null;
  return { ...rows[0], enabled: !!rows[0].enabled };
}
