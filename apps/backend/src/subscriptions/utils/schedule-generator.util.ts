/**
 * Schedule Generation Utility
 * Generates delivery schedules based on school operating days
 */

import { addDays, format, isWeekend, startOfDay } from 'date-fns';

export interface GenerateScheduleOptions {
  startDate: Date;
  numberOfDays: number;
  operatingDays: string[]; // ['MON', 'TUE', 'WED', 'THU', 'FRI']
  excludeDates?: Date[]; // Optional: holidays or exceptions
}

export interface ScheduleDay {
  date: Date;
  dayOfWeek: string;
  isOperatingDay: boolean;
}

/**
 * Generate delivery schedule for a subscription
 */
export function generateDeliverySchedule(options: GenerateScheduleOptions): Date[] {
  const { startDate, numberOfDays, operatingDays, excludeDates = [] } = options;

  const schedule: Date[] = [];
  let currentDate = startOfDay(startDate);
  let daysGenerated = 0;

  // Convert exclude dates to timestamps for easy comparison
  const excludeTimestamps = excludeDates.map((d) => startOfDay(d).getTime());

  // Iterate until we have generated the required number of operating days
  while (daysGenerated < numberOfDays) {
    // Get day of week (MON, TUE, etc.)
    const dayOfWeek = format(currentDate, 'EEE').toUpperCase();

    // Check if this day is an operating day
    const isOperatingDay = operatingDays.includes(dayOfWeek);

    // Check if this day is excluded (holiday)
    const isExcluded = excludeTimestamps.includes(currentDate.getTime());

    // Add to schedule if it's an operating day and not excluded
    if (isOperatingDay && !isExcluded) {
      schedule.push(new Date(currentDate));
      daysGenerated++;
    }

    // Move to next day
    currentDate = addDays(currentDate, 1);

    // Safety check: prevent infinite loop (max 365 days scan)
    if (schedule.length === 0 && currentDate > addDays(startDate, 365)) {
      throw new Error('Could not generate schedule within 365 days');
    }
  }

  return schedule;
}

/**
 * Calculate subscription end date
 */
export function calculateEndDate(options: GenerateScheduleOptions): Date {
  const schedule = generateDeliverySchedule(options);
  return schedule[schedule.length - 1];
}

/**
 * Generate subscription number
 * Format: SUB-{timestamp}-{random}
 */
export function generateSubscriptionNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `SUB-${timestamp}-${random}`;
}

/**
 * Validate operating days format
 */
export function validateOperatingDays(operatingDays: any): boolean {
  if (!Array.isArray(operatingDays)) {
    return false;
  }

  const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  return operatingDays.every((day) => validDays.includes(day));
}
