
import { renderHook } from '@testing-library/react-hooks';
import { describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseClient, resetMocks } from '../../utils/supabase/mockClient';
import { useSignOut } from '@/hooks/auth/useSignOut';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

describe('useSignOut', () => {
  beforeEach(() => {
    resetMocks();
    vi.spyOn(Storage.prototype, 'removeItem');
  });

  it('should sign out successfully', async () => {
    mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ error: null });

    const { result } = renderHook(() => useSignOut());
    await result.current.signOut();

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    expect(localStorage.removeItem).toHaveBeenCalledWith('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
  });

  it('should clear localStorage on error', async () => {
    mockSupabaseClient.auth.signOut.mockRejectedValueOnce(new Error('Sign out failed'));

    const { result } = renderHook(() => useSignOut());
    await result.current.signOut();

    expect(localStorage.removeItem).toHaveBeenCalledWith('sb-dvalgsvmkrqzwfcxvbxg-auth-token');
  });
});

