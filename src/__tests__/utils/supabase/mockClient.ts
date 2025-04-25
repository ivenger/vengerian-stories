
import { createClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn()
  })),
  storage: {
    from: vi.fn()
  }
};

// Helper to reset all mocks between tests
export const resetMocks = () => {
  vi.clearAllMocks();
};

