import DOMPurify from 'dompurify';

// Configure DOMPurify for secure HTML sanitization
const createDOMPurify = () => {
  const purify = DOMPurify;
  
  // Configure allowed tags and attributes for blog content
  const blogConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'width', 'height', 'class'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'style'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'style']
  };

  return {
    sanitizeHtml: (dirty: string): string => {
      console.log('htmlSanitizer: Sanitizing HTML content', { 
        inputLength: dirty?.length || 0,
        containsScript: dirty?.includes('<script>') || false
      });
      
      if (!dirty) {
        console.log('htmlSanitizer: Empty input, returning empty string');
        return '';
      }
      
      const clean = purify.sanitize(dirty, blogConfig);
      console.log('htmlSanitizer: HTML sanitization complete', {
        outputLength: clean.length,
        removedContent: dirty.length !== clean.length
      });
      
      return clean;
    },
    
    sanitizeText: (dirty: string): string => {
      console.log('htmlSanitizer: Sanitizing text content', { 
        inputLength: dirty?.length || 0 
      });
      
      if (!dirty) return '';
      
      // Strip all HTML tags for plain text
      const clean = purify.sanitize(dirty, { ALLOWED_TAGS: [] });
      console.log('htmlSanitizer: Text sanitization complete');
      
      return clean;
    }
  };
};

export const { sanitizeHtml, sanitizeText } = createDOMPurify();

// Enhanced input validation schemas
export const validateInput = {
  title: (input: string): string => {
    console.log('htmlSanitizer: Validating title input');
    if (!input || typeof input !== 'string') return '';
    if (input.length > 200) {
      console.warn('htmlSanitizer: Title exceeds maximum length, truncating');
      input = input.substring(0, 200);
    }
    return sanitizeText(input);
  },
  
  content: (input: string): string => {
    console.log('htmlSanitizer: Validating content input');
    if (!input || typeof input !== 'string') return '';
    if (input.length > 50000) {
      console.warn('htmlSanitizer: Content exceeds maximum length, truncating');
      input = input.substring(0, 50000);
    }
    return sanitizeHtml(input);
  },
  
  excerpt: (input: string): string => {
    console.log('htmlSanitizer: Validating excerpt input');
    if (!input || typeof input !== 'string') return '';
    if (input.length > 500) {
      console.warn('htmlSanitizer: Excerpt exceeds maximum length, truncating');
      input = input.substring(0, 500);
    }
    return sanitizeText(input);
  },
  
  tags: (input: string[]): string[] => {
    console.log('htmlSanitizer: Validating tags input', { count: input?.length || 0 });
    if (!Array.isArray(input)) return [];
    return input
      .filter(tag => typeof tag === 'string' && tag.length <= 50)
      .map(tag => sanitizeText(tag))
      .slice(0, 20); // Maximum 20 tags
  }
};