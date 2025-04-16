
import { useSession } from "./auth/useSession";
import { useAdminCheck } from "./auth/useAdminCheck";

export function useAuthProvider() {
  const { session, loading, error, signOut } = useSession();
  const isAdmin = useAdminCheck(session);

  return {
    session,
    user: session?.user || null,
    loading,
    signOut,
    isAdmin,
    error
  };
}
