
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User } from 'lucide-react';

interface UserData {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: string;
}

const AdminRoleManager: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin, setUserAsAdmin } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        const usersCollection = collection(db, 'users');
        const querySnapshot = await getDocs(usersCollection);
        const usersData: UserData[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          usersData.push({
            id: doc.id,
            email: data.email || null,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            role: data.role || 'viewer',
          });
        });

        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const handlePromoteToAdmin = async (userId: string) => {
    await setUserAsAdmin(userId);
    // Update local state after promotion
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: 'admin' } : user
      )
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Only administrators can manage user roles.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Role Management</CardTitle>
        <CardDescription>
          Manage admin access for users in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-full">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-medium">{user.displayName || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'admin' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? (
                      <div className="flex items-center gap-1">
                        <Shield size={12} />
                        <span>Admin</span>
                      </div>
                    ) : (
                      'Viewer'
                    )}
                  </div>
                  {user.role !== 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePromoteToAdmin(user.id)}
                    >
                      Make Admin
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-gray-500">
              {searchTerm ? 'No users match your search.' : 'No users found.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminRoleManager;
