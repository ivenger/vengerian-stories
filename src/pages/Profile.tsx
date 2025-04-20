
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
import { Clock, BookOpen, User as UserIcon, Shield, UserCheck, RefreshCcw } from "lucide-react";
import ReadingHistory from "../components/ReadingHistory";
import { useToast } from "@/hooks/use-toast";
import ProtectedRoute from "../components/ProtectedRoute";
import { useSessionRefresh } from "@/hooks/filters/useSessionRefresh";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user, isAdmin, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);
  const { refreshSession } = useSessionRefresh();
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    console.log("Profile page - User:", user?.email, "Is Admin:", isAdmin, "Has session:", !!session);
  }, [user, isAdmin, session]);
  
  useEffect(() => {
    if (!user && !loading) {
      console.log("Profile page - No user, redirecting to auth");
      navigate("/auth");
      return;
    }

    if (!user) return;

    const loadUserDetails = async () => {
      try {
        setLoading(true);
        
        // Make sure session is fresh
        await refreshSession();
        
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        setUserDetails(data.user);
      } catch (error: any) {
        console.error("Profile - Error loading user details:", error);
        
        toast({
          title: "Error",
          description: error.message || "Failed to load user details",
          variant: "destructive"
        });
        
        // If we get an auth error, redirect to login
        if (error.message?.includes("session") || error.message?.includes("auth")) {
          navigate("/auth");
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUserDetails();
    
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
  }, [user, toast, refreshSession, navigate, loading]);

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

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const refreshed = await refreshSession();
      if (refreshed) {
        toast({
          title: "Success",
          description: "Session refreshed successfully",
        });
        
        // Reload user details with fresh session
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          throw error;
        }
        
        setUserDetails(data.user);
      } else {
        toast({
          title: "Warning",
          description: "Session could not be refreshed. Please try logging in again.",
        });
        navigate("/auth");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh session",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  // If we have a session issue, show a helpful message
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
                <p>Your session appears to be invalid or expired. This can happen if you've been inactive for a while or cleared your browser cookies.</p>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={handleManualRefresh} 
                    disabled={refreshing}
                    className="flex items-center gap-2"
                  >
                    {refreshing ? (
                      <>
                        <RefreshCcw className="h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-4 w-4" />
                        Refresh Session
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" onClick={() => navigate("/auth")}>
                    Sign in again
                  </Button>
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
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant="outline" className={`${isAdmin ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 'bg-blue-100 text-blue-800 hover:bg-blue-100'}`}>
                    {isAdmin ? (
                      <><Shield size={14} className="mr-1" />Administrator</>
                    ) : (
                      <><UserCheck size={14} className="mr-1" />Regular User</>
                    )}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleManualRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1 text-xs"
                  >
                    {refreshing ? (
                      <>
                        <RefreshCcw className="h-3 w-3 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="h-3 w-3" />
                        Refresh Session
                      </>
                    )}
                  </Button>
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
