
import { useState, useEffect } from "react";
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
  const query = useQuery();
  const editId = query.get("editId");
  const { isAdmin } = useAuth();

  // Ensure smooth transitions when switching to the admin page
  useEffect(() => {
    // Short delay to allow components to initialize properly
    const timer = setTimeout(() => {
      setPageReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Verify admin status once instead of repeatedly
  useEffect(() => {
    if (isAdmin !== undefined && !adminChecked) {
      setAdminChecked(true);
      console.log("Admin page - Admin status confirmed:", isAdmin);
    }
  }, [isAdmin, adminChecked]);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <MultilingualTitle />
        </div>
        
        {!pageReady ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
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
              {pageReady && adminChecked && (
                <PostsTab 
                  editId={editId} 
                  setIsEditing={setIsEditing} 
                  setSelectedPost={setSelectedPost} 
                />
              )}
            </TabsContent>
            
            <TabsContent value="about">
              {pageReady && adminChecked && <AboutEditor />}
            </TabsContent>
            
            <TabsContent value="tags">
              {pageReady && adminChecked && <TagManagement />}
            </TabsContent>
            
            <TabsContent value="users">
              {pageReady && adminChecked && <UserManagement />}
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
