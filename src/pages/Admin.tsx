
import { useState } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Admin = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogEntry | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const query = useQuery();
  const editId = query.get("editId");
  const { isAdmin, user, loading } = useAuth();
  const isMobile = useIsMobile();
  
  console.log("Admin: Rendering with screen type:", isMobile ? "mobile" : "desktop");

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin || !user) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <p className="text-red-600">Access denied. You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className={`container mx-auto ${isMobile ? 'px-2' : 'px-4'} py-8`}>
        <div className="text-center mb-8">
          <MultilingualTitle />
        </div>
        
        {!isEditing ? (
          <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 w-full overflow-x-auto flex">
              <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
              <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
              <TabsTrigger value="tags" className="flex-1">Tags</TabsTrigger>
              <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="w-full">
              <PostsTab 
                editId={editId}
                setIsEditing={setIsEditing}
                setSelectedPost={setSelectedPost}
              />
            </TabsContent>
            
            <TabsContent value="about" className="w-full">
              <AboutEditor />
            </TabsContent>
            
            <TabsContent value="tags" className="w-full">
              <TagManagement />
            </TabsContent>
            
            <TabsContent value="users" className="w-full">
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
