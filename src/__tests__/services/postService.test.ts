
import { fetchAllPosts, fetchPostById, fetchFilteredPosts, savePost, deletePost } from '../../services/postService';
import { supabase } from '../../integrations/supabase/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BlogEntry } from '../../types/blogTypes';

// Mock Supabase client
vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn(),
          order: vi.fn()
        })),
        order: vi.fn(),
        contains: vi.fn()
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
    }
  }
}));

describe('postService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAllPosts', () => {
    it('fetches all posts successfully', async () => {
      const mockPosts = [
        { id: '1', title: 'Post 1' },
        { id: '2', title: 'Post 2' }
      ];

      const selectMock = vi.fn().mockResolvedValue({ data: mockPosts, error: null });
      (supabase.from as any).mockImplementation(() => ({
        select: selectMock,
        order: vi.fn().mockReturnThis()
      }));

      const result = await fetchAllPosts();
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Post 1');
    });

    it('handles errors when fetching posts', async () => {
      const selectMock = vi.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });
      (supabase.from as any).mockImplementation(() => ({
        select: selectMock,
        order: vi.fn().mockReturnThis()
      }));

      await expect(fetchAllPosts()).rejects.toThrow('Failed to fetch posts: Database error');
    });
  });

  describe('fetchPostById', () => {
    it('fetches a single post by id', async () => {
      const mockPost = { id: '1', title: 'Test Post' };
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: mockPost, error: null });
      (supabase.from as any).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock
      }));

      const result = await fetchPostById('1');
      expect(result).toEqual(mockPost);
    });

    it('handles non-existent post', async () => {
      const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as any).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock
      }));

      await expect(fetchPostById('999')).rejects.toThrow('Post with ID 999 not found');
    });
  });

  describe('fetchFilteredPosts', () => {
    it('fetches posts with tag filters', async () => {
      const mockPosts = [
        { id: '1', title: 'Post 1', tags: ['tag1'] },
        { id: '2', title: 'Post 2', tags: ['tag2'] }
      ];

      const containsMock = vi.fn().mockResolvedValue({ data: mockPosts, error: null });
      (supabase.from as any).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        contains: containsMock
      }));

      const result = await fetchFilteredPosts(['tag1']);
      expect(result).toHaveLength(2);
    });
  });

  describe('savePost', () => {
    // Create a complete mock BlogEntry object for testing
    const mockPost: BlogEntry = {
      id: '1',
      title: 'Test Post',
      title_language: ['en'],
      content: 'Test content',
      excerpt: null,
      date: new Date().toISOString(),
      language: ['en'],
      status: 'draft',
      user_id: 'test-user-id'
    };

    it('creates a new post', async () => {
      const insertMock = vi.fn().mockResolvedValue({ 
        data: mockPost,
        error: null 
      });
      (supabase.from as any).mockImplementation(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: insertMock
      }));

      const result = await savePost(mockPost);
      expect(result).toEqual(mockPost);
    });

    it('updates an existing post', async () => {
      const updatedPost: BlogEntry = {
        ...mockPost,
        title: 'Updated Title'
      };
      
      const updateMock = vi.fn().mockResolvedValue({ 
        data: updatedPost,
        error: null 
      });
      (supabase.from as any).mockImplementation(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: updateMock
      }));

      const result = await savePost(updatedPost);
      expect(result.title).toBe('Updated Title');
    });
  });

  describe('deletePost', () => {
    it('deletes a post successfully', async () => {
      const deleteMock = vi.fn().mockResolvedValue({ error: null });
      (supabase.from as any).mockImplementation(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: deleteMock
      }));

      await expect(deletePost('1')).resolves.not.toThrow();
    });

    it('handles deletion errors', async () => {
      const deleteMock = vi.fn().mockResolvedValue({ 
        error: { message: 'Deletion failed' } 
      });
      (supabase.from as any).mockImplementation(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: deleteMock
      }));

      await expect(deletePost('1')).rejects.toThrow('Failed to delete post: Deletion failed');
    });
  });
});
