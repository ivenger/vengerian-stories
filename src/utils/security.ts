
import { Session } from '@supabase/supabase-js';

// Rate limiting utility
export class RateLimiter {
  private attempts: Map<string, { count: number, firstAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  checkLimit(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    if (now - attempt.firstAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    this.attempts.set(key, { 
      count: attempt.count + 1, 
      firstAttempt: attempt.firstAttempt 
    });
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Session validation
export const validateSession = (session: Session | null): boolean => {
  if (!session) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at ? session.expires_at > now : false;
};

// DEPRECATED: Use htmlSanitizer.ts instead for comprehensive XSS protection
export const sanitizeInput = (input: string): string => {
  console.warn('security.ts: sanitizeInput is deprecated, use htmlSanitizer.ts instead');
  if (!input) return '';
  return input
    .replace(/[&<>"']/g, (match) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[match] || match);
};

export const validateAndSanitizeData = <T extends Record<string, any>>(
  data: T, 
  allowedFields: string[]
): Partial<T> => {
  console.log('security.ts: Validating and sanitizing data', { 
    fields: allowedFields,
    dataKeys: Object.keys(data)
  });
  
  const sanitized: Partial<T> = {};
  
  for (const field of allowedFields) {
    if (field in data) {
      const value = data[field];
      if (typeof value === 'string') {
        console.log(`security.ts: Sanitizing string field: ${field}`);
        // Use type assertion to fix the TypeScript error with Partial<T>
        sanitized[field as keyof T] = sanitizeInput(value) as any;
      } else {
        console.log(`security.ts: Preserving non-string field: ${field}`);
        sanitized[field as keyof T] = value;
      }
    }
  }
  
  console.log('security.ts: Data validation complete', {
    originalFields: Object.keys(data).length,
    sanitizedFields: Object.keys(sanitized).length
  });
  
  return sanitized;
};
