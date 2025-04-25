
import { describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseClient, resetMocks } from '../utils/supabase/mockClient';
import { fetchAboutContent, updateAboutContent } from '@/services/aboutService';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

describe('aboutService', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('fetchAboutContent', () => {
    it('should return content when available', async () => {
      const mockContent = {
        id: '1',
        content: 'Test content',
        language: 'en'
      };

      mockSupabaseClient.from().maybeSingle.mockResolvedValueOnce({ 
        data: mockContent, 
        error: null 
      });

      const result = await fetchAboutContent();
      expect(result).toEqual(mockContent);
    });

    it('should handle no content found', async () => {
      mockSupabaseClient.from().maybeSingle.mockResolvedValueOnce({ 
        data: null, 
        error: null 
      });

      const result = await fetchAboutContent();
      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      mockSupabaseClient.from().maybeSingle.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error')
      });

      await expect(fetchAboutContent()).rejects.toThrow();
    });
  });
});

