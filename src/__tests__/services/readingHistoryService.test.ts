
import { describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseClient, resetMocks } from '../utils/supabase/mockClient';
import { getUserReadingHistory, isPostRead, togglePostReadStatus } from '@/services/readingHistoryService';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

describe('readingHistoryService', () => {
  const userId = 'test-user-id';
  const postId = 'test-post-id';

  beforeEach(() => {
    resetMocks();
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: userId } } },
      error: null
    });
  });

  describe('getUserReadingHistory', () => {
    it('should fetch reading history for valid user', async () => {
      const mockHistory = [{ id: '1', post_id: postId, user_id: userId }];
      
      mockSupabaseClient.from().select.mockResolvedValueOnce({
        data: mockHistory,
        error: null
      });

      const result = await getUserReadingHistory(userId);
      expect(result).toEqual(mockHistory);
    });

    it('should return empty array when no session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null
      });

      const result = await getUserReadingHistory(userId);
      expect(result).toEqual([]);
    });
  });

  describe('isPostRead', () => {
    it('should return true when post is read', async () => {
      mockSupabaseClient.from().select().maybeSingle.mockResolvedValueOnce({
        data: { id: '1' },
        error: null
      });

      const result = await isPostRead(userId, postId);
      expect(result).toBe(true);
    });

    it('should return false when post is not read', async () => {
      mockSupabaseClient.from().select().maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await isPostRead(userId, postId);
      expect(result).toBe(false);
    });
  });
});

