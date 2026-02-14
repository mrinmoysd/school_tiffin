/**
 * Sanitization utility functions
 * Protects against XSS, SQL injection, and other attacks
 */

/**
 * Remove HTML tags from string
 */
export function stripHtml(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Escape special HTML characters
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return stripHtml(escapeHtml(obj));
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Remove SQL injection patterns
 */
export function sanitizeSqlInput(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Remove common SQL injection patterns
  const sqlPatterns = [
    /(\s|^)(OR|AND)(\s+\d+\s*=\s*\d+)/gi,
    /(\s|^)(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)/gi,
    /(--|;|\/\*|\*\/|xp_)/gi,
  ];
  
  let sanitized = text;
  sqlPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return email;
  
  return email.toLowerCase().trim();
}

/**
 * Sanitize phone number (remove non-numeric characters)
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return phone;
  
  return phone.replace(/[^\d+]/g, '');
}
