import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FcmProvider } from './providers/fcm.provider';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { RegisterFcmTokenDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private fcmProvider: FcmProvider,
    private emailProvider: EmailProvider,
    private smsProvider: SmsProvider,
  ) {}

  /**
   * Register FCM token for a user
   */
  async registerFcmToken(userId: string, registerFcmTokenDto: RegisterFcmTokenDto) {
    const { token, deviceType } = registerFcmTokenDto;

    // Check if token already exists
    const existing = await this.prisma.fCMToken.findFirst({
      where: { userId, token },
    });

    if (existing) {
      return { message: 'Token already registered' };
    }

    // Create new token
    await this.prisma.fCMToken.create({
      data: {
        userId,
        token,
        device: deviceType,
      },
    });

    return { message: 'FCM token registered successfully' };
  }

  /**
   * Get all notifications for a user
   */
  async findAllByUser(userId: string, unreadOnly?: boolean) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 notifications
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: 'Notification marked as read' };
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: 'All notifications marked as read' };
  }

  /**
   * Send notification to user
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: any,
    sendPush = true,
    sendEmail = false,
    sendSms = false,
  ) {
    // Store notification in database
    const notification = await this.prisma.notification.create({
      data: {
        user: { connect: { id: userId } },
        title,
        body,
        data: data ? JSON.stringify(data) : null,
        notificationType: 'GENERAL',
      },
    });

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phoneNumber: true },
    });

    if (!user) {
      return notification;
    }

    // Send push notification
    if (sendPush) {
      const fcmTokens = await this.prisma.fCMToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (fcmTokens.length > 0) {
        const tokens = fcmTokens.map((t) => t.token);
        await this.fcmProvider.sendToMultipleDevices(tokens, title, body, data);
      }
    }

    // Send email notification
    if (sendEmail && user.email) {
      await this.emailProvider.sendEmail(user.email, title, `<p>${body}</p>`);
    }

    // Send SMS notification
    if (sendSms && user.phoneNumber) {
      await this.smsProvider.sendSms(user.phoneNumber, `${title}: ${body}`);
    }

    return notification;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }
}
