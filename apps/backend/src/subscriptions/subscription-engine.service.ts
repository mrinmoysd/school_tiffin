import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateDeliverySchedule,
  generateSubscriptionNumber,
  validateOperatingDays,
} from './utils/schedule-generator.util';

@Injectable()
export class SubscriptionEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate delivery schedule for a subscription
   */
  async generateSchedule(
    schoolId: string,
    startDate: Date,
    numberOfDays: number,
  ): Promise<{ schedule: Date[]; endDate: Date }> {
    // Get school operating days
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { operatingDays: true },
    });

    if (!school) {
      throw new BadRequestException('School not found');
    }

    // Parse operating days (stored as JSON string or CSV string)
    let operatingDays: string[];
    try {
      if (Array.isArray(school.operatingDays)) {
        operatingDays = school.operatingDays;
      } else if (typeof school.operatingDays === 'string') {
        const rawOperatingDays = school.operatingDays.trim();
        if (!rawOperatingDays) {
          throw new Error('Operating days is empty');
        }

        try {
          const parsed = JSON.parse(rawOperatingDays);
          if (!Array.isArray(parsed)) {
            throw new Error('Operating days JSON is not an array');
          }
          operatingDays = parsed;
        } catch {
          operatingDays = rawOperatingDays
            .split(',')
            .map(day => day.trim())
            .filter(Boolean);
        }
      } else {
        throw new Error('Operating days is not a supported type');
      }

      operatingDays = operatingDays.map(day => day.trim().toUpperCase()).filter(Boolean);
    } catch (error) {
      throw new BadRequestException('Invalid operating days format');
    }

    // Validate operating days
    if (!validateOperatingDays(operatingDays)) {
      throw new BadRequestException('Invalid operating days');
    }

    // Generate schedule
    const schedule = generateDeliverySchedule({
      startDate,
      numberOfDays,
      operatingDays,
    });

    const endDate = schedule[schedule.length - 1];

    return { schedule, endDate };
  }

  /**
   * Generate unique subscription number
   */
  generateSubscriptionNumber(): string {
    return generateSubscriptionNumber();
  }

  /**
   * Calculate price for subscription
   */
  async calculatePrice(mealPlanId: string, numberOfDays: number): Promise<number> {
    const mealPlan = await this.prisma.mealPlan.findUnique({
      where: { id: mealPlanId },
      select: { pricePerDay: true },
    });

    if (!mealPlan) {
      throw new BadRequestException('Meal plan not found');
    }

    return Number(mealPlan.pricePerDay) * numberOfDays;
  }

  /**
   * Validate subscription dates
   */
  validateSubscriptionDates(startDate: Date, numberOfDays: number): void {
    const now = new Date();
    const minStartDate = new Date(now);
    minStartDate.setHours(0, 0, 0, 0);

    if (startDate < minStartDate) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (numberOfDays < 1) {
      throw new BadRequestException('Number of days must be at least 1');
    }

    if (numberOfDays > 365) {
      throw new BadRequestException('Number of days cannot exceed 365');
    }
  }
}
