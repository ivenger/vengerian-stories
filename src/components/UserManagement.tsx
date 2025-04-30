
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

type User = {
  id: string;
  email?: string; 
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  console.log("UserManagement: Rendering with screen type:", isMobile ? "mobile" : "desktop");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Fetch the session to get the access token
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          throw new Error("Not authenticated");
        }
        
        // Use Edge Function to fetch users
        const { data, error } = await supabase.functions.invoke('admin-list-users', {
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
        });
        
        if (error) throw error;
        
        setUsers(data?.users || []);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not confirmed";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">User Management</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                {!isMobile && <TableHead>Created At</TableHead>}
                {!isMobile && <TableHead>Last Sign In</TableHead>}
                <TableHead>Email Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email || "No email"}</TableCell>
                  {!isMobile && <TableCell>{formatDate(user.created_at)}</TableCell>}
                  {!isMobile && <TableCell>{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Never"}</TableCell>}
                  <TableCell>
                    {user.email_confirmed_at ? (
                      <span className="text-green-600">Confirmed</span>
                    ) : (
                      <span className="text-amber-600">Pending</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
