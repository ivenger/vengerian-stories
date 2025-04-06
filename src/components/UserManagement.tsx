import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface User {
  id: string;
  email: string;
  role?: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const validateSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          throw new Error("Session expired");
        }
      }
      return true;
    } catch (err) {
      console.error("Session validation failed:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate session before proceeding
        const isValid = await validateSession();
        if (!isValid) {
          throw new Error("Session expired");
        }

        // Get current session for the token
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!sessionData.session) throw new Error("No active session");
        
        // Use Edge Function to fetch users
        const { data, error } = await supabase.functions.invoke('admin-list-users', {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });
        
        if (error) throw error;
        
        if (!isMounted) return;

        setUsers(data?.users || []);
        setRetryCount(0); // Reset retry count on success
      } catch (error: any) {
        console.error("Error fetching users:", error);
        
        if (!isMounted) return;

        if (error.message === "Session expired") {
          setError("Your session has expired. Please refresh the page to continue.");
        } else if (retryCount < 3) {
          // Implement exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
          console.log(`UserManagement: Retrying in ${delay}ms (attempt ${retryCount + 1})`);
          
          setRetryCount(prev => prev + 1);
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              fetchUsers();
            }
          }, delay);
        } else {
          setError("Failed to load users. Please try again later.");
          toast({
            title: "Error",
            description: "Failed to load users. Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [toast, retryCount, validateSession]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not confirmed";
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">User Management</h2>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Last Sign In</TableHead>
            <TableHead>Email Confirmed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell>{formatDate(user.last_sign_in_at || null)}</TableCell>
              <TableCell>
                {user.email_confirmed_at ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-red-600">No</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;
