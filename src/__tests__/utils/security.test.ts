
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, validateSession, sanitizeInput, validateAndSanitizeData } from '../../utils/security';
import { Session } from '@supabase/supabase-js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(3, 1000); // 3 attempts per second
  });

  it('allows initial attempts within limit', () => {
    expect(rateLimiter.checkLimit('test-key')).toBe(true);
    expect(rateLimiter.checkLimit('test-key')).toBe(true);
    expect(rateLimiter.checkLimit('test-key')).toBe(true);
  });

  it('blocks attempts over limit', () => {
    rateLimiter.checkLimit('test-key');
    rateLimiter.checkLimit('test-key');
    rateLimiter.checkLimit('test-key');
    expect(rateLimiter.checkLimit('test-key')).toBe(false);
  });

  it('resets after window expires', async () => {
    rateLimiter.checkLimit('test-key');
    rateLimiter.checkLimit('test-key');
    rateLimiter.checkLimit('test-key');
    
    await new Promise(resolve => setTimeout(resolve, 1100));
    expect(rateLimiter.checkLimit('test-key')).toBe(true);
  });

  it('handles multiple keys independently', () => {
    expect(rateLimiter.checkLimit('key1')).toBe(true);
    expect(rateLimiter.checkLimit('key2')).toBe(true);
  });
});

describe('validateSession', () => {
  const mockValidSession: Session = {
    access_token: 'valid-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'refresh-token',
    user: {
      id: 'user-id',
      aud: 'authenticated',
      email: 'test@example.com',
      role: 'authenticated',
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };

  it('returns true for valid session', () => {
    expect(validateSession(mockValidSession)).toBe(true);
  });

  it('returns false for expired session', () => {
    const expiredSession = {
      ...mockValidSession,
      expires_at: Math.floor(Date.now() / 1000) - 3600
    };
    expect(validateSession(expiredSession)).toBe(false);
  });

  it('returns false for null session', () => {
    expect(validateSession(null)).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('sanitizes HTML special characters', () => {
    const input = '<script>alert("xss")</script>';
    expect(sanitizeInput(input)).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('handles empty input', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('handles null/undefined input', () => {
    expect(sanitizeInput(undefined as any)).toBe('');
  });

  it('preserves normal text', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World');
  });
});

describe('validateAndSanitizeData', () => {
  interface TestData {
    name: string;
    age: number;
    description: string;
  }

  it('sanitizes allowed string fields', () => {
    const data: TestData = {
      name: '<script>alert("xss")</script>',
      age: 25,
      description: 'Normal text'
    };
    const allowedFields = ['name', 'description'];
    
    const result = validateAndSanitizeData<TestData>(data, allowedFields);
    expect(result.name).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(result.description).toBe('Normal text');
  });

  it('excludes non-allowed fields', () => {
    const data: TestData = {
      name: 'John',
      age: 25,
      description: 'Test'
    };
    const allowedFields = ['name'];
    
    const result = validateAndSanitizeData<TestData>(data, allowedFields);
    expect(result).toHaveProperty('name');
    expect(result).not.toHaveProperty('age');
    expect(result).not.toHaveProperty('description');
  });

  it('preserves non-string values', () => {
    const data: TestData = {
      name: 'John',
      age: 25,
      description: 'Test'
    };
    const allowedFields = ['name', 'age'];
    
    const result = validateAndSanitizeData<TestData>(data, allowedFields);
    expect(result.age).toBe(25);
  });
});
