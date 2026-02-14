import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);
  private twilioClient: Twilio;

  constructor(private configService: ConfigService) {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    const smsProvider = this.configService.get<string>('SMS_PROVIDER');
    const smsApiKey = this.configService.get<string>('SMS_API_KEY');

    if (!smsProvider || smsProvider !== 'twilio') {
      this.logger.warn('SMS provider not configured, SMS notifications disabled');
      return;
    }

    if (!smsApiKey) {
      this.logger.warn('SMS_API_KEY not configured, SMS notifications disabled');
      return;
    }

    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio credentials not configured');
      return;
    }

    this.twilioClient = new Twilio(accountSid, authToken);
    this.logger.log('Twilio SMS client initialized successfully');
  }

  /**
   * Send SMS
   */
  async sendSms(to: string, message: string): Promise<boolean> {
    if (!this.twilioClient) {
      this.logger.warn('Twilio client not initialized, skipping SMS');
      return false;
    }

    try {
      const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

      const result = await this.twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to,
      });

      this.logger.log(`SMS sent successfully: ${result.sid}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      return false;
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOtp(to: string, otp: string): Promise<boolean> {
    const message = `Your OTP for School Tiffin Platform is: ${otp}. Valid for 5 minutes.`;
    return this.sendSms(to, message);
  }

  /**
   * Send delivery reminder
   */
  async sendDeliveryReminder(to: string, studentName: string, date: string): Promise<boolean> {
    const message = `Reminder: Tiffin delivery for ${studentName} scheduled for ${date}.`;
    return this.sendSms(to, message);
  }

  /**
   * Send subscription activated SMS
   */
  async sendSubscriptionActivated(to: string, studentName: string): Promise<boolean> {
    const message = `Your subscription for ${studentName} has been activated. Deliveries will start as per schedule.`;
    return this.sendSms(to, message);
  }
}
