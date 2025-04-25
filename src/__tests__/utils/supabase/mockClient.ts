
import { vi } from 'vitest';

// Create mock types for better type safety
type MockFunction = ReturnType<typeof vi.fn>;
type MockReturnThis = { mockReturnThis: () => any };

// Create a properly typed mock function that can chain
const createChainableMock = () => {
  const fn = vi.fn();
  fn.mockReturnThis = () => fn;
  return fn as MockFunction & MockReturnThis;
};

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn()
  },
  from: vi.fn(() => ({
    select: createChainableMock(),
    insert: createChainableMock(),
    update: createChainableMock(),
    delete: createChainableMock(),
    eq: createChainableMock(),
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
