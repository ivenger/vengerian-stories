
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useAuth } from "@/hooks/auth/useAuth";
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
import { Spinner } from "@/components/ui/spinner";

const Profile = () => {
  const { user, isAdmin, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadAttempted, setLoadAttempted] = useState(false);
  
  useEffect(() => {
    console.log("Profile page - Auth state:", { 
      user: user?.email, 
      isAdmin, 
      hasSession: !!session 
    });
  }, [user, isAdmin, session]);
  
  useEffect(() => {
    // Don't try to load profile if there's no authenticated user or if we've already attempted to load
    if (!user || loadAttempted) return;

    const loadUserDetails = async () => {
      try {
        setLoading(true);
        setLoadAttempted(true);
        
        // Fetch user details from Supabase
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        console.log("Profile - User details loaded:", data.user.email);
        setUserDetails(data.user);
      } catch (error: any) {
        console.error("Profile - Error loading user details:", error);
        
        toast({
          title: "Error",
          description: error.message || "Failed to load user details",
          variant: "destructive"
        });
        
        // Only redirect if there's a specific auth error
        if (error.message?.toLowerCase().includes('session') || 
            error.message?.toLowerCase().includes('auth') || 
            error.status === 401) {
          navigate("/auth");
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUserDetails();
    
  }, [user, toast, navigate, loadAttempted]);

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

  // If we have a session issue but there's a user, show a helpful message
  if (!session && !loading && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl mb-1">Session Issue Detected</CardTitle>
              <CardDescription>We're having trouble accessing your profile data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p>Your session appears to be invalid or expired. Please sign in again to continue.</p>
                
                <div className="flex gap-4">
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    onClick={() => navigate("/auth")}
                  >
                    Sign in again
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
                <div>
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
                <div className="flex flex-col items-center justify-center py-12">
                  <Spinner size="lg" variant="primary" label="Loading profile..." />
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
                        Joined {userDetails?.created_at ? new Date(userDetails?.created_at).toLocaleDateString() : 'Unknown'}
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
