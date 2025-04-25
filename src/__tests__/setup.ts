import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock localStorage with a complete implementation
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(index => null),
};

global.localStorage = localStorageMock as unknown as Storage;

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
