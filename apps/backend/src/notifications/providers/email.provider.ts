import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');

    if (!smtpHost) {
      this.logger.warn('SMTP not configured, email notifications disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    this.logger.log('Email transporter initialized successfully');
  }

  /**
   * Send email
   */
  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not initialized, skipping email');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || 'noreply@schooltiffin.com',
        to,
        subject,
        text: text || '',
        html,
      });

      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to School Tiffin Platform!';
    const html = `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for registering with School Tiffin Platform.</p>
      <p>You can now browse meal plans and subscribe for your child.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send subscription activated email
   */
  async sendSubscriptionActivatedEmail(to: string, subscriptionNumber: string, studentName: string): Promise<boolean> {
    const subject = 'Subscription Activated!';
    const html = `
      <h1>Subscription Activated</h1>
      <p>Your subscription <strong>${subscriptionNumber}</strong> for ${studentName} has been activated.</p>
      <p>Deliveries will start as per the schedule.</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceiptEmail(to: string, orderNumber: string, amount: number, currency: string): Promise<boolean> {
    const subject = 'Payment Receipt';
    const html = `
      <h1>Payment Received</h1>
      <p>Thank you for your payment!</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Amount:</strong> ${amount / 100} ${currency}</p>
    `;

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
    `;

    return this.sendEmail(to, subject, html);
  }
}
