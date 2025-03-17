
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

type User = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Fetch users from Supabase - using edge functions
        // Since we can't directly query auth.users from the frontend
        const { data: { users }, error } = await supabase.auth.admin.listUsers();
        
        if (error) throw error;
        
        setUsers(users || []);
      } catch (error) {
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
        <div className="overflow-hidden border border-gray-200 rounded-lg">
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
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Never"}</TableCell>
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
