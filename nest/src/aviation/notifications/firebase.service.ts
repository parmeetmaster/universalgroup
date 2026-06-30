import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  onModuleInit() {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT
        || path.join(process.cwd(), 'firebase-service-account.json');

      if (!fs.existsSync(serviceAccountPath)) {
        this.logger.warn(`Firebase service account not found at ${serviceAccountPath}. Push notifications disabled.`);
        return;
      }

      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (err) {
      this.logger.error(`Firebase init failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    imageUrl?: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn('Firebase not initialized, skipping notification');
      return false;
    }

    try {
      // DATA-ONLY message: no top-level `notification` block. This stops Android/FCM
      // from auto-displaying a system notification, so the app renders exactly one
      // (silent) notification itself — killing the duplicate + heads-up/sound.
      const message: admin.messaging.Message = {
        topic,
        android: {
          // Normal priority — does not wake device from doze.
          // App's low-importance channel keeps display silent.
          priority: 'normal',
        },
        apns: {
          headers: { 'apns-priority': '5' },
          payload: {
            aps: {
              // iOS can't reliably render data-only pushes, so show a native
              // silent alert there (no `sound` key → no sound).
              alert: { title, body },
              'mutable-content': 1,
            },
          },
          ...(imageUrl ? { fcmOptions: { imageUrl } } : {}),
        },
        data: {
          ...(data || {}),
          title,
          body,
          ...(imageUrl ? { imageUrl } : {}),
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Notification sent: ${response} | ${title}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send notification: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  async subscribeToTopic(deviceToken: string, topic: string): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn('Firebase not initialized, skipping subscribe');
      return false;
    }

    try {
      const response = await admin.messaging().subscribeToTopic(deviceToken, topic);
      this.logger.log(`Subscribed to topic ${topic}: ${response.successCount} success, ${response.failureCount} failure`);
      return response.successCount > 0;
    } catch (err) {
      this.logger.error(`Failed to subscribe to topic: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  async unsubscribeFromTopic(deviceToken: string, topic: string): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn('Firebase not initialized, skipping unsubscribe');
      return false;
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(deviceToken, topic);
      this.logger.log(`Unsubscribed from topic ${topic}: ${response.successCount} success, ${response.failureCount} failure`);
      return response.successCount > 0;
    } catch (err) {
      this.logger.error(`Failed to unsubscribe from topic: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  isReady(): boolean {
    return this.initialized;
  }
}
