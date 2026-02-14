import { Injectable, PipeTransform } from '@nestjs/common';
import { sanitizeObject } from '../utils/sanitize.util';

/**
 * Global sanitization pipe
 * Automatically sanitizes all incoming request data
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    if (value && typeof value === 'object') {
      return sanitizeObject(value);
    }
    return value;
  }
}
