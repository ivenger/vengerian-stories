
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, BookOpen, User as UserIcon, Shield, UserCheck } from "lucide-react";
import ReadingHistory from "../components/ReadingHistory";
import { useToast } from "@/hooks/use-toast";
import ProtectedRoute from "../components/ProtectedRoute";
import { useSessionRefresh } from "@/hooks/filters/useSessionRefresh";

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);
  const { refreshSession } = useSessionRefresh();
  
  // Log whether this user is admin for debugging
  useEffect(() => {
    console.log("Profile page - User:", user?.email, "Is Admin:", isAdmin);
  }, [user, isAdmin]);
  
  useEffect(() => {
    if (!user) return;

    const loadUserDetails = async () => {
      try {
        setLoading(true);
        
        // Ensure session is fresh before making the request
        await refreshSession();
        
        // Get user metadata
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        setUserDetails(data.user);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load user details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserDetails();
    
    // Set up page visibility change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Profile page became visible, refreshing user details");
        loadUserDetails();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, toast, refreshSession]);

  // Get display name based on auth method
  const getDisplayName = () => {
    if (!userDetails) return '';
    
    if (userDetails.user_metadata?.full_name) {
      return userDetails.user_metadata.full_name;
    }
    
    if (userDetails.user_metadata?.name) {
      return userDetails.user_metadata.name;
    }
    
    if (userDetails.email) {
      return userDetails.email;
    }
    
    return 'User';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-1">User Profile</CardTitle>
                  <CardDescription>Manage your account and view your reading history</CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant="outline" className={`${isAdmin ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 'bg-blue-100 text-blue-800 hover:bg-blue-100'}`}>
                    {isAdmin ? (
                      <><Shield size={14} className="mr-1" />Administrator</>
                    ) : (
                      <><UserCheck size={14} className="mr-1" />Regular User</>
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-[250px]" />
                  <Skeleton className="h-5 w-[180px]" />
                  <Skeleton className="h-5 w-[200px]" />
                  <div className="pt-4">
                    <Skeleton className="h-8 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <UserIcon size={20} className="text-gray-500 mr-2" />
                      <span className="text-lg font-medium">{getDisplayName()}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm">
                      <span className="ml-7">{userDetails?.email}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm">
                      <Clock size={16} className="text-gray-500 mr-2" />
                      <span>
                        Joined {new Date(userDetails?.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm">
                      <Shield size={16} className="text-gray-500 mr-2" />
                      <span>
                        Role: {isAdmin ? 'Administrator' : 'Regular User'}
                      </span>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="reading-history" className="pt-4">
                    <TabsList>
                      <TabsTrigger value="reading-history" className="flex items-center">
                        <BookOpen size={16} className="mr-2" />
                        Reading History
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="reading-history" className="pt-4">
                      <ReadingHistory />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Profile;
