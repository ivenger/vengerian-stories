import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import PostsTab from "../components/admin/PostsTab";
import TagManagement from "../components/TagManagement";
import UserManagement from "../components/UserManagement";
import AboutEditor from "../components/AboutEditor";
import PostEditor from "../components/admin/PostEditor";
import { BlogEntry } from "../types/blogTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MultilingualTitle from "../components/MultilingualTitle";
import { useAuth } from "@/hooks/auth/useAuth";

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Admin = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogEntry | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [pageReady, setPageReady] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const initAttemptedRef = useRef(false);
  const query = useQuery();
  const editId = query.get("editId");
  const { isAdmin, user } = useAuth();

  // Ensure smooth transitions when switching to the admin page
  useEffect(() => {
    // Only attempt initialization once
    if (!initAttemptedRef.current) {
      initAttemptedRef.current = true;
      
      // Short delay to allow components to initialize properly
      const timer = setTimeout(() => {
        setPageReady(true);
      }, 300); // Increased from 100ms to 300ms for better reliability
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Verify admin status once instead of repeatedly
  useEffect(() => {
    if (isAdmin !== undefined && !adminChecked && user) {
      setAdminChecked(true);
      console.log("Admin page - Admin status confirmed:", isAdmin, "for user:", user.email);
    }
  }, [isAdmin, adminChecked, user]);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <MultilingualTitle />
        </div>
        
        {!pageReady || !adminChecked ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            <p className="text-gray-600">Loading admin panel...</p>
          </div>
        ) : !isEditing ? (
          <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts">
              <PostsTab 
                editId={editId} 
                setIsEditing={setIsEditing} 
                setSelectedPost={setSelectedPost} 
              />
            </TabsContent>
            
            <TabsContent value="about">
              <AboutEditor />
            </TabsContent>
            
            <TabsContent value="tags">
              <TagManagement />
            </TabsContent>
            
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          </Tabs>
        ) : (
          selectedPost && (
            <PostEditor 
              selectedPost={selectedPost} 
              setIsEditing={setIsEditing}
              setSelectedPost={setSelectedPost}
              editId={editId}
            />
          )
        )}
      </main>
    </div>
  );
};

export default Admin;
