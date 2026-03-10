import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { sanitizeObject, sanitizeObjectPreservingHtml } from '../utils/sanitize.util';

/**
 * Global sanitization pipe
 * Automatically sanitizes all incoming request data
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (value && typeof value === 'object') {
      // CMS content supports author-provided HTML/Markdown and must not be escaped.
      if (
        metadata.metatype?.name === 'CreateCmsPageDto' ||
        metadata.metatype?.name === 'UpdateCmsPageDto'
      ) {
        return sanitizeObjectPreservingHtml(value, ['content']);
      }
      return sanitizeObject(value);
    }
    return value;
  }
}
