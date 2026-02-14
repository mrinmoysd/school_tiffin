import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmProvider {
  private readonly logger = new Logger(FcmProvider.name);
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const fcmServerKey = this.configService.get<string>('FCM_SERVER_KEY');

    if (!fcmServerKey) {
      this.logger.warn('FCM_SERVER_KEY not configured, push notifications disabled');
      return;
    }

    try {
      // Initialize Firebase Admin SDK
      // In production, use service account JSON file
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          // Load from environment or file
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
        }),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(token: string, title: string, body: string, data?: any): Promise<boolean> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized, skipping push notification');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(tokens: string[], title: string, body: string, data?: any): Promise<number> {
    if (!this.firebaseApp || tokens.length === 0) {
      return 0;
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(`Sent ${response.successCount}/${tokens.length} push notifications successfully`);
      return response.successCount;
    } catch (error) {
      this.logger.error(`Failed to send multicast push notification: ${error.message}`);
      return 0;
    }
  }

  /**
   * Send to topic
   */
  async sendToTopic(topic: string, title: string, body: string, data?: any): Promise<boolean> {
    if (!this.firebaseApp) {
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        topic,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent to topic ${topic}: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send push notification to topic: ${error.message}`);
      return false;
    }
  }
}
