import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface OtpData {
  otp: string;
  attempts: number;
  createdAt: number;
}

/**
 * OTP Service
 * Handles OTP generation, storage, verification, and rate limiting
 */
@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY = 300; // 5 minutes in seconds
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Generate and store OTP for phone number
   */
  async generateOtp(phone: string): Promise<{ otp: string; expiresIn: number }> {
    // Check rate limiting
    await this.checkRateLimit(phone);

    // Generate 6-digit OTP
    const otp = this.generate6DigitOtp();

    // Store in Redis with expiry
    const otpData: OtpData = {
      otp,
      attempts: 0,
      createdAt: Date.now(),
    };

    const cacheKey = this.getOtpCacheKey(phone);
    await this.cacheManager.set(cacheKey, otpData, this.OTP_EXPIRY * 1000);

    // Increment rate limit counter
    await this.incrementRateLimitCounter(phone);

    // TODO: Send SMS with OTP
    // For now, log it (in production, use SMS service)
    console.log(`OTP for ${phone}: ${otp}`);

    return {
      otp, // Remove this in production!
      expiresIn: this.OTP_EXPIRY,
    };
  }

  /**
   * Verify OTP for phone number
   */
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const cacheKey = this.getOtpCacheKey(phone);
    const otpData = await this.cacheManager.get<OtpData>(cacheKey);

    if (!otpData) {
      throw new BadRequestException('OTP expired or not found');
    }

    // Check max attempts
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      await this.cacheManager.del(cacheKey);
      throw new BadRequestException('Maximum OTP attempts exceeded. Please request a new OTP');
    }

    // Increment attempts
    otpData.attempts += 1;
    await this.cacheManager.set(cacheKey, otpData, this.OTP_EXPIRY * 1000);

    // Verify OTP
    if (otpData.otp !== otp) {
      throw new BadRequestException(
        `Invalid OTP. ${this.MAX_ATTEMPTS - otpData.attempts} attempts remaining`,
      );
    }

    // OTP is valid, delete it
    await this.cacheManager.del(cacheKey);

    return true;
  }

  /**
   * Check if user has exceeded rate limit for OTP requests
   */
  private async checkRateLimit(phone: string): Promise<void> {
    const rateLimitKey = this.getRateLimitCacheKey(phone);
    const count = await this.cacheManager.get<number>(rateLimitKey);

    if (count && count >= 3) {
      throw new BadRequestException(
        'Too many OTP requests. Please try again after 1 hour',
      );
    }
  }

  /**
   * Increment rate limit counter
   */
  private async incrementRateLimitCounter(phone: string): Promise<void> {
    const rateLimitKey = this.getRateLimitCacheKey(phone);
    const count = (await this.cacheManager.get<number>(rateLimitKey)) || 0;

    await this.cacheManager.set(
      rateLimitKey,
      count + 1,
      this.RATE_LIMIT_WINDOW * 1000,
    );
  }

  /**
   * Generate random 6-digit OTP
   */
  private generate6DigitOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get cache key for OTP storage
   */
  private getOtpCacheKey(phone: string): string {
    return `otp:${phone}`;
  }

  /**
   * Get cache key for rate limiting
   */
  private getRateLimitCacheKey(phone: string): string {
    return `otp:rate_limit:${phone}`;
  }
}
