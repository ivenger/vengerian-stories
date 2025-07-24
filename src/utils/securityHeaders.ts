// Security headers configuration for enhanced protection
export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://dvalgsvmkrqzwfcxvbxg.supabase.co wss://dvalgsvmkrqzwfcxvbxg.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
} as const;

// Apply security headers to the document
export const applySecurityHeaders = (): void => {
  console.log('securityHeaders: Applying security headers');
  
  // Create meta tags for CSP
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = SECURITY_HEADERS['Content-Security-Policy'];
  document.head.appendChild(cspMeta);
  
  // Apply other security headers via meta tags where possible
  const frameOptionsMeta = document.createElement('meta');
  frameOptionsMeta.httpEquiv = 'X-Frame-Options';
  frameOptionsMeta.content = SECURITY_HEADERS['X-Frame-Options'];
  document.head.appendChild(frameOptionsMeta);
  
  console.log('securityHeaders: Security headers applied successfully');
};

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  SAFE_HTML_TAG: /^[a-zA-Z][a-zA-Z0-9]*$/
} as const;

// Secure logging helper
export const secureLog = (message: string, data?: any): void => {
  const sanitizedData = data ? JSON.parse(JSON.stringify(data, (key, value) => {
    // Redact sensitive fields
    if (typeof key === 'string' && /password|token|key|secret/i.test(key)) {
      return '[REDACTED]';
    }
    return value;
  })) : undefined;
  
  console.log(`[SECURITY] ${message}`, sanitizedData);
};