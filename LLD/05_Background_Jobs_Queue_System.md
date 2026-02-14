# Low-Level Design: Background Jobs & Queue System

## 1. Overview

The platform uses **Redis** with **BullMQ** for background job processing and queue management.

### Key Use Cases
1. Daily delivery list generation
2. Notification sending (email, SMS, push)
3. Subscription expiry processing
4. Pause request processing
5. Payment webhook processing
6. Report generation
7. Data cleanup/archival

---

## 2. Technology Stack

```typescript
// Core Dependencies
{
  "bull": "^4.12.0",           // Job queue (BullMQ)
  "ioredis": "^5.3.0",          // Redis client
  "@nestjs/bull": "^10.0.0"     // NestJS integration (if using NestJS)
}
```

### Redis Configuration

```typescript
// config/redis.config.ts
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,  // Default database
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
};
```

---

## 3. Queue Structure

### 3.1 Queue Definitions

```typescript
// queues/queue-names.ts
export enum QueueName {
  DELIVERY = 'delivery-queue',
  NOTIFICATION = 'notification-queue',
  SUBSCRIPTION = 'subscription-queue',
  PAYMENT = 'payment-queue',
  REPORT = 'report-queue',
  CLEANUP = 'cleanup-queue'
}

// queues/queue.module.ts
import { BullModule } from '@nestjs/bull';
import { QueueName } from './queue-names';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QueueName.DELIVERY },
      { name: QueueName.NOTIFICATION },
      { name: QueueName.SUBSCRIPTION },
      { name: QueueName.PAYMENT },
      { name: QueueName.REPORT },
      { name: QueueName.CLEANUP }
    )
  ]
})
export class QueueModule {}
```

---

## 4. Job Definitions

### 4.1 Delivery Jobs

#### 4.1.1 Daily Delivery Generation Job

```typescript
// jobs/delivery/daily-delivery.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QueueName } from '../queue-names';

interface DailyDeliveryJobData {
  date: string;  // YYYY-MM-DD
}

@Processor(QueueName.DELIVERY)
export class DailyDeliveryProcessor {
  
  @Process('generate-daily-deliveries')
  async generateDailyDeliveries(job: Job<DailyDeliveryJobData>) {
    const { date } = job.data;
    
    console.log(`Processing daily deliveries for ${date}`);
    
    // Update progress
    await job.progress(10);
    
    // Step 1: Get all scheduled deliveries for the date
    const deliveries = await this.db.subscriptionDay.findMany({
      where: {
        scheduledDate: date,
        status: 'SCHEDULED'
      },
      include: {
        subscription: {
          include: {
            student: true,
            school: true,
            mealPlan: true,
            parent: true
          }
        }
      }
    });
    
    await job.progress(30);
    
    // Step 2: Group by school
    const deliveriesBySchool = groupBy(deliveries, 'subscription.schoolId');
    
    await job.progress(50);
    
    // Step 3: Generate delivery reports for each school
    for (const [schoolId, schoolDeliveries] of Object.entries(deliveriesBySchool)) {
      await this.generateSchoolDeliveryReport(schoolId, schoolDeliveries, date);
    }
    
    await job.progress(70);
    
    // Step 4: Send notifications to parents
    for (const delivery of deliveries) {
      await this.notificationQueue.add('send-delivery-reminder', {
        userId: delivery.subscription.parent.id,
        studentName: delivery.subscription.student.fullName,
        date: date,
        mealPlanName: delivery.subscription.mealPlan.name
      });
    }
    
    await job.progress(90);
    
    // Step 5: Cache delivery count for dashboard
    await this.redis.set(
      `deliveries:count:${date}`,
      deliveries.length,
      'EX',
      86400  // 24 hours
    );
    
    await job.progress(100);
    
    return {
      success: true,
      totalDeliveries: deliveries.length,
      schoolCount: Object.keys(deliveriesBySchool).length,
      date: date
    };
  }
  
  @Process('mark-delivery-completed')
  async markDeliveryCompleted(job: Job<{ subscriptionDayId: string }>) {
    const { subscriptionDayId } = job.data;
    
    await this.db.$transaction(async (tx) => {
      // Update subscription_day
      const subscriptionDay = await tx.subscriptionDay.update({
        where: { id: subscriptionDayId },
        data: {
          status: 'DELIVERED',
          deliveryConfirmedAt: new Date()
        },
        include: { subscription: true }
      });
      
      // Update subscription counters
      await tx.subscription.update({
        where: { id: subscriptionDay.subscriptionId },
        data: {
          deliveredDays: { increment: 1 },
          remainingDays: { decrement: 1 }
        }
      });
      
      // Check if subscription is complete
      const updatedSubscription = await tx.subscription.findUnique({
        where: { id: subscriptionDay.subscriptionId }
      });
      
      if (updatedSubscription.remainingDays === 0) {
        await tx.subscription.update({
          where: { id: subscriptionDay.subscriptionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });
        
        // Queue completion notification
        await this.notificationQueue.add('send-subscription-completed', {
          subscriptionId: subscriptionDay.subscriptionId,
          userId: updatedSubscription.parentId
        });
      }
    });
    
    return { success: true };
  }
}
```

#### 4.1.2 Cron Schedule for Daily Delivery

```typescript
// jobs/delivery/delivery-cron.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueueName } from '../queue-names';

@Injectable()
export class DeliveryCronService {
  constructor(
    @InjectQueue(QueueName.DELIVERY) private deliveryQueue: Queue
  ) {}
  
  // Run every day at 6:00 AM
  @Cron('0 6 * * *', {
    name: 'daily-delivery-generation',
    timeZone: 'Asia/Kolkata'
  })
  async scheduleDailyDeliveryGeneration() {
    const today = new Date().toISOString().split('T')[0];
    
    await this.deliveryQueue.add('generate-daily-deliveries', {
      date: today
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });
    
    console.log(`Queued daily delivery generation for ${today}`);
  }
}
```

---

### 4.2 Notification Jobs

```typescript
// jobs/notification/notification.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QueueName } from '../queue-names';

@Processor(QueueName.NOTIFICATION)
export class NotificationProcessor {
  
  @Process('send-push-notification')
  async sendPushNotification(job: Job<{
    userId: string;
    title: string;
    body: string;
    data?: any;
  }>) {
    const { userId, title, body, data } = job.data;
    
    try {
      // Get user's FCM tokens
      const user = await this.db.user.findUnique({
        where: { id: userId },
        include: { fcmTokens: true }
      });
      
      if (!user.fcmTokens || user.fcmTokens.length === 0) {
        console.log(`No FCM tokens for user ${userId}`);
        return { success: false, reason: 'no_tokens' };
      }
      
      // Send via FCM
      const message = {
        notification: { title, body },
        data: data || {},
        tokens: user.fcmTokens.map(t => t.token)
      };
      
      const response = await this.fcm.sendMulticast(message);
      
      // Remove invalid tokens
      if (response.failureCount > 0) {
        const failedTokens = response.responses
          .map((resp, idx) => resp.success ? null : user.fcmTokens[idx].token)
          .filter(token => token !== null);
        
        await this.db.fcmToken.deleteMany({
          where: { token: { in: failedTokens } }
        });
      }
      
      // Store notification in database
      await this.db.notification.create({
        data: {
          userId,
          title,
          body,
          notificationType: data?.type || 'GENERAL',
          referenceId: data?.referenceId,
          referenceType: data?.referenceType,
          isSent: true,
          sentAt: new Date()
        }
      });
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      console.error('Push notification error:', error);
      throw error;  // Will retry based on job config
    }
  }
  
  @Process('send-email')
  async sendEmail(job: Job<{
    to: string;
    subject: string;
    html: string;
    templateId?: string;
    templateData?: any;
  }>) {
    const { to, subject, html, templateId, templateData } = job.data;
    
    try {
      if (templateId) {
        // Use email template
        await this.emailService.sendTemplate(to, templateId, templateData);
      } else {
        // Send raw HTML
        await this.emailService.send(to, subject, html);
      }
      
      return { success: true, to };
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }
  
  @Process('send-sms')
  async sendSMS(job: Job<{
    phone: string;
    message: string;
  }>) {
    const { phone, message } = job.data;
    
    try {
      await this.smsService.send(phone, message);
      return { success: true, phone };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw error;
    }
  }
  
  @Process('send-delivery-reminder')
  async sendDeliveryReminder(job: Job<{
    userId: string;
    studentName: string;
    date: string;
    mealPlanName: string;
  }>) {
    const { userId, studentName, date, mealPlanName } = job.data;
    
    await this.sendPushNotification({
      data: {
        userId,
        title: 'Delivery Today',
        body: `${mealPlanName} will be delivered for ${studentName} today`,
        data: {
          type: 'DELIVERY_REMINDER',
          date
        }
      }
    } as any);
    
    return { success: true };
  }
  
  @Process('send-subscription-completed')
  async sendSubscriptionCompleted(job: Job<{
    subscriptionId: string;
    userId: string;
  }>) {
    const { subscriptionId, userId } = job.data;
    
    const subscription = await this.db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { student: true, mealPlan: true }
    });
    
    await this.sendPushNotification({
      data: {
        userId,
        title: 'Subscription Completed',
        body: `${subscription.mealPlan.name} for ${subscription.student.fullName} has been completed`,
        data: {
          type: 'SUBSCRIPTION_COMPLETED',
          subscriptionId
        }
      }
    } as any);
    
    return { success: true };
  }
}
```

---

### 4.3 Subscription Jobs

```typescript
// jobs/subscription/subscription.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QueueName } from '../queue-names';

@Processor(QueueName.SUBSCRIPTION)
export class SubscriptionProcessor {
  
  @Process('check-subscription-expiry')
  async checkSubscriptionExpiry(job: Job) {
    // Find all active subscriptions
    const activeSubscriptions = await this.db.subscription.findMany({
      where: { status: 'ACTIVE' }
    });
    
    let completedCount = 0;
    
    for (const subscription of activeSubscriptions) {
      if (subscription.remainingDays === 0) {
        await this.db.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });
        
        // Queue completion notification
        await this.notificationQueue.add('send-subscription-completed', {
          subscriptionId: subscription.id,
          userId: subscription.parentId
        });
        
        completedCount++;
      }
    }
    
    return {
      success: true,
      totalChecked: activeSubscriptions.length,
      completedCount
    };
  }
  
  @Process('process-pause-request')
  async processPauseRequest(job: Job<{ pauseRequestId: string }>) {
    const { pauseRequestId } = job.data;
    
    // This is called after admin approval
    const pauseRequest = await this.db.pauseRequest.findUnique({
      where: { id: pauseRequestId },
      include: { subscription: { include: { school: true } } }
    });
    
    if (pauseRequest.status !== 'APPROVED') {
      throw new Error('Pause request not approved');
    }
    
    await this.db.$transaction(async (tx) => {
      // Mark days as paused
      await tx.subscriptionDay.updateMany({
        where: {
          subscriptionId: pauseRequest.subscriptionId,
          scheduledDate: {
            gte: pauseRequest.pauseFromDate,
            lte: pauseRequest.pauseToDate
          },
          status: 'SCHEDULED'
        },
        data: { status: 'PAUSED' }
      });
      
      // Extend subscription
      const operatingDays = parseOperatingDays(
        pauseRequest.subscription.school.operatingDays
      );
      
      const newEndDate = await this.extendSubscription(
        pauseRequest.subscriptionId,
        pauseRequest.pauseDays,
        operatingDays,
        tx
      );
      
      // Update subscription
      await tx.subscription.update({
        where: { id: pauseRequest.subscriptionId },
        data: {
          currentEndDate: newEndDate,
          pausedDays: { increment: pauseRequest.pauseDays }
        }
      });
      
      // Mark pause request as processed
      await tx.pauseRequest.update({
        where: { id: pauseRequestId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date()
        }
      });
    });
    
    // Send notification to parent
    await this.notificationQueue.add('send-push-notification', {
      userId: pauseRequest.parentId,
      title: 'Pause Request Approved',
      body: `Your pause request has been processed successfully`,
      data: {
        type: 'PAUSE_APPROVED',
        pauseRequestId
      }
    });
    
    return { success: true };
  }
}

// Cron job for subscription expiry check
@Injectable()
export class SubscriptionCronService {
  constructor(
    @InjectQueue(QueueName.SUBSCRIPTION) private subscriptionQueue: Queue
  ) {}
  
  // Run daily at 11:59 PM
  @Cron('59 23 * * *', {
    name: 'check-subscription-expiry',
    timeZone: 'Asia/Kolkata'
  })
  async scheduleSubscriptionExpiryCheck() {
    await this.subscriptionQueue.add('check-subscription-expiry', {}, {
      attempts: 3,
      backoff: 5000
    });
  }
}
```

---

### 4.4 Payment Jobs

```typescript
// jobs/payment/payment.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QueueName } from '../queue-names';

@Processor(QueueName.PAYMENT)
export class PaymentProcessor {
  
  @Process('process-payment-webhook')
  async processPaymentWebhook(job: Job<{
    gateway: string;
    eventType: string;
    payload: any;
  }>) {
    const { gateway, eventType, payload } = job.data;
    
    console.log(`Processing ${gateway} webhook: ${eventType}`);
    
    // Verify webhook signature (already done in controller)
    
    if (eventType === 'payment.success' || eventType === 'charge.succeeded') {
      await this.handlePaymentSuccess(payload);
    } else if (eventType === 'payment.failed') {
      await this.handlePaymentFailure(payload);
    }
    
    return { success: true, eventType };
  }
  
  private async handlePaymentSuccess(payload: any) {
    // Extract order ID from payload
    const orderId = payload.order_id || payload.metadata?.orderId;
    
    const order = await this.db.order.findFirst({
      where: { paymentGatewayOrderId: orderId },
      include: { subscription: true }
    });
    
    if (!order) {
      console.error(`Order not found for gateway order ID: ${orderId}`);
      return;
    }
    
    await this.db.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'SUCCESS' }
      });
      
      // Create payment transaction record
      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          transactionId: generateTransactionId(),
          paymentGateway: payload.gateway || 'razorpay',
          gatewayTransactionId: payload.payment_id || payload.id,
          amount: order.finalAmount,
          currency: 'INR',
          status: 'SUCCESS',
          gatewayResponse: payload
        }
      });
      
      // Activate subscription
      await tx.subscription.update({
        where: { id: order.subscriptionId },
        data: {
          status: 'ACTIVE',
          activatedAt: new Date(),
          paidAmount: { increment: order.finalAmount }
        }
      });
    });
    
    // Send success notification
    await this.notificationQueue.add('send-push-notification', {
      userId: order.subscription.parentId,
      title: 'Payment Successful',
      body: 'Your subscription has been activated',
      data: {
        type: 'PAYMENT_SUCCESS',
        subscriptionId: order.subscriptionId
      }
    });
    
    // Send email receipt
    await this.notificationQueue.add('send-email', {
      to: order.subscription.parent.email,
      templateId: 'payment-receipt',
      templateData: {
        orderNumber: order.orderNumber,
        amount: order.finalAmount,
        subscriptionNumber: order.subscription.subscriptionNumber
      }
    });
  }
  
  private async handlePaymentFailure(payload: any) {
    const orderId = payload.order_id || payload.metadata?.orderId;
    
    const order = await this.db.order.findFirst({
      where: { paymentGatewayOrderId: orderId }
    });
    
    if (!order) return;
    
    await this.db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED' }
      });
      
      await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          transactionId: generateTransactionId(),
          paymentGateway: payload.gateway || 'razorpay',
          gatewayTransactionId: payload.payment_id || payload.id,
          amount: order.finalAmount,
          currency: 'INR',
          status: 'FAILED',
          errorMessage: payload.error_description,
          gatewayResponse: payload
        }
      });
    });
    
    // Send failure notification
    await this.notificationQueue.add('send-push-notification', {
      userId: order.subscription.parentId,
      title: 'Payment Failed',
      body: 'Your payment could not be processed. Please try again.',
      data: {
        type: 'PAYMENT_FAILED',
        orderId: order.id
      }
    });
  }
}
```

---

### 4.5 Report Generation Jobs

```typescript
// jobs/report/report.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QueueName } from '../queue-names';

@Processor(QueueName.REPORT)
export class ReportProcessor {
  
  @Process('generate-sales-report')
  async generateSalesReport(job: Job<{
    fromDate: string;
    toDate: string;
    schoolId?: string;
    format: 'csv' | 'pdf';
    requestedBy: string;
  }>) {
    const { fromDate, toDate, schoolId, format, requestedBy } = job.data;
    
    await job.progress(10);
    
    // Fetch data
    const orders = await this.db.order.findMany({
      where: {
        paymentStatus: 'SUCCESS',
        createdAt: {
          gte: new Date(fromDate),
          lte: new Date(toDate)
        },
        subscription: schoolId ? { schoolId } : undefined
      },
      include: {
        subscription: {
          include: {
            school: true,
            mealPlan: true,
            student: true
          }
        }
      }
    });
    
    await job.progress(40);
    
    // Generate report file
    let fileUrl: string;
    
    if (format === 'csv') {
      fileUrl = await this.generateCSVReport(orders);
    } else {
      fileUrl = await this.generatePDFReport(orders);
    }
    
    await job.progress(80);
    
    // Notify user
    await this.notificationQueue.add('send-push-notification', {
      userId: requestedBy,
      title: 'Report Ready',
      body: 'Your sales report has been generated',
      data: {
        type: 'REPORT_READY',
        fileUrl
      }
    });
    
    await job.progress(100);
    
    return {
      success: true,
      fileUrl,
      recordCount: orders.length
    };
  }
  
  @Process('generate-delivery-list')
  async generateDeliveryList(job: Job<{
    schoolId: string;
    date: string;
    format: 'csv' | 'pdf';
  }>) {
    // Similar to sales report
    // Generate school-wise delivery list for printing
  }
}
```

---

### 4.6 Cleanup Jobs

```typescript
// jobs/cleanup/cleanup.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { QueueName } from '../queue-names';

@Processor(QueueName.CLEANUP)
export class CleanupProcessor {
  
  @Process('cleanup-old-notifications')
  async cleanupOldNotifications(job: Job) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);  // 90 days ago
    
    const result = await this.db.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true
      }
    });
    
    return {
      success: true,
      deletedCount: result.count
    };
  }
  
  @Process('cleanup-expired-tokens')
  async cleanupExpiredTokens(job: Job) {
    const result = await this.db.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true }
        ]
      }
    });
    
    return {
      success: true,
      deletedCount: result.count
    };
  }
  
  @Process('archive-completed-subscriptions')
  async archiveCompletedSubscriptions(job: Job) {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);  // 1 year ago
    
    const subscriptions = await this.db.subscription.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { lt: cutoffDate }
      }
    });
    
    // Move to archive table
    // (Implementation depends on archival strategy)
    
    return {
      success: true,
      archivedCount: subscriptions.length
    };
  }
}

// Cron jobs for cleanup
@Injectable()
export class CleanupCronService {
  constructor(
    @InjectQueue(QueueName.CLEANUP) private cleanupQueue: Queue
  ) {}
  
  // Run weekly on Sunday at 2:00 AM
  @Cron('0 2 * * 0', { name: 'cleanup-old-notifications' })
  async scheduleNotificationCleanup() {
    await this.cleanupQueue.add('cleanup-old-notifications');
  }
  
  // Run daily at 3:00 AM
  @Cron('0 3 * * *', { name: 'cleanup-expired-tokens' })
  async scheduleTokenCleanup() {
    await this.cleanupQueue.add('cleanup-expired-tokens');
  }
  
  // Run monthly on 1st at 4:00 AM
  @Cron('0 4 1 * *', { name: 'archive-subscriptions' })
  async scheduleSubscriptionArchival() {
    await this.cleanupQueue.add('archive-completed-subscriptions');
  }
}
```

---

## 5. Job Configuration

### 5.1 Retry Strategy

```typescript
// Common retry configuration
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000  // Start with 5 seconds
  },
  removeOnComplete: 100,  // Keep last 100 completed jobs
  removeOnFail: 200       // Keep last 200 failed jobs
};

// Critical jobs (e.g., payments)
const criticalJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 10000
  },
  removeOnComplete: 500,
  removeOnFail: 1000
};
```

### 5.2 Job Priority

```typescript
enum JobPriority {
  CRITICAL = 1,    // Payment processing
  HIGH = 5,        // Notifications
  NORMAL = 10,     // Daily jobs
  LOW = 20         // Cleanup, reports
}

// Usage
await queue.add('process-payment', data, {
  priority: JobPriority.CRITICAL
});
```

---

## 6. Queue Monitoring

### 6.1 Queue Metrics

```typescript
// jobs/monitoring/queue-metrics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueueName } from '../queue-names';

@Injectable()
export class QueueMetricsService {
  constructor(
    @InjectQueue(QueueName.DELIVERY) private deliveryQueue: Queue,
    @InjectQueue(QueueName.NOTIFICATION) private notificationQueue: Queue,
    @InjectQueue(QueueName.SUBSCRIPTION) private subscriptionQueue: Queue,
    @InjectQueue(QueueName.PAYMENT) private paymentQueue: Queue
  ) {}
  
  async getQueueStats() {
    const queues = [
      { name: 'delivery', queue: this.deliveryQueue },
      { name: 'notification', queue: this.notificationQueue },
      { name: 'subscription', queue: this.subscriptionQueue },
      { name: 'payment', queue: this.paymentQueue }
    ];
    
    const stats = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount()
        ]);
        
        return {
          name,
          waiting,
          active,
          completed,
          failed,
          delayed
        };
      })
    );
    
    return stats;
  }
  
  async getFailedJobs(queueName: QueueName, limit: number = 10) {
    const queue = this.getQueueByName(queueName);
    const failedJobs = await queue.getFailed(0, limit - 1);
    
    return failedJobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp
    }));
  }
}
```

### 6.2 Bull Board (UI Dashboard)

```typescript
// Add Bull Board for queue monitoring UI
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullAdapter(deliveryQueue),
    new BullAdapter(notificationQueue),
    new BullAdapter(subscriptionQueue),
    new BullAdapter(paymentQueue),
    new BullAdapter(reportQueue),
    new BullAdapter(cleanupQueue)
  ],
  serverAdapter
});

// Mount in Express app
app.use('/admin/queues', serverAdapter.getRouter());

// Access at: http://localhost:3000/admin/queues
```

---

## 7. Error Handling

### 7.1 Global Error Handler

```typescript
// jobs/error-handler.ts
import { Job } from 'bull';

export class JobErrorHandler {
  static async handleError(job: Job, error: Error) {
    console.error(`Job ${job.name} failed:`, error);
    
    // Log to monitoring service (e.g., Sentry)
    // Sentry.captureException(error, {
    //   tags: {
    //     jobName: job.name,
    //     jobId: job.id,
    //     queueName: job.queue.name
    //   }
    // });
    
    // Send alert for critical jobs
    if (job.opts.priority === JobPriority.CRITICAL) {
      await this.sendCriticalJobFailureAlert(job, error);
    }
    
    // Check if should retry
    if (job.attemptsMade >= job.opts.attempts) {
      // Max retries reached, move to dead letter queue
      await this.moveToDeadLetterQueue(job, error);
    }
  }
  
  private static async sendCriticalJobFailureAlert(job: Job, error: Error) {
    // Send email/SMS to ops team
    // Or push to Slack/PagerDuty
  }
  
  private static async moveToDeadLetterQueue(job: Job, error: Error) {
    // Store in separate queue/DB table for manual review
    await db.failedJob.create({
      data: {
        jobId: job.id,
        queueName: job.queue.name,
        jobName: job.name,
        jobData: job.data,
        error: error.message,
        stackTrace: error.stack,
        attemptsMade: job.attemptsMade,
        failedAt: new Date()
      }
    });
  }
}
```

---

## 8. Performance Optimization

### 8.1 Concurrency Control

```typescript
// Limit concurrent job processing per queue
@Processor(QueueName.NOTIFICATION)
export class NotificationProcessor {
  // Process max 10 jobs concurrently
  @Process({ name: 'send-push-notification', concurrency: 10 })
  async sendPushNotification(job: Job) {
    // ...
  }
}
```

### 8.2 Rate Limiting

```typescript
// Limit job addition rate
const limiter = {
  max: 1000,      // Max 1000 jobs
  duration: 5000  // Per 5 seconds
};

await queue.add('send-email', data, { limiter });
```

### 8.3 Job Deduplication

```typescript
// Prevent duplicate jobs within time window
await queue.add('process-order', { orderId: 'xyz' }, {
  jobId: `order-xyz`,  // Unique job ID
  removeOnComplete: true
});

// Second attempt with same jobId will be rejected
```

---

## 9. Testing Background Jobs

### 9.1 Unit Test Example

```typescript
// jobs/notification/notification.processor.spec.ts
describe('NotificationProcessor', () => {
  let processor: NotificationProcessor;
  let mockDb: any;
  let mockFcm: any;
  
  beforeEach(() => {
    mockDb = createMockDb();
    mockFcm = createMockFcm();
    processor = new NotificationProcessor(mockDb, mockFcm);
  });
  
  it('should send push notification successfully', async () => {
    const job = createMockJob({
      userId: 'user-123',
      title: 'Test',
      body: 'Test body'
    });
    
    const result = await processor.sendPushNotification(job);
    
    expect(result.success).toBe(true);
    expect(mockFcm.sendMulticast).toHaveBeenCalled();
  });
  
  it('should handle missing FCM tokens gracefully', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: 'user-123',
      fcmTokens: []
    });
    
    const job = createMockJob({ userId: 'user-123', title: 'Test', body: 'Test' });
    const result = await processor.sendPushNotification(job);
    
    expect(result.success).toBe(false);
    expect(result.reason).toBe('no_tokens');
  });
});
```

---

## 10. Deployment Considerations

### 10.1 Separate Worker Processes

```typescript
// For production, run workers as separate processes
// worker.ts
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule);
  await app.init();
  console.log('Worker process started');
}

bootstrap();
```

```bash
# Run multiple worker processes
pm2 start worker.js -i 4  # 4 worker instances
pm2 start api.js -i 2     # 2 API instances
```

### 10.2 Redis High Availability

- Use Redis Sentinel for automatic failover
- Or use Redis Cluster for horizontal scaling
- Backup Redis data regularly

### 10.3 Monitoring & Alerts

- Track queue lengths
- Alert if jobs are not being processed
- Monitor job failure rates
- Track job processing times

---

This completes the background jobs and queue system design.
