
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

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Admin = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogEntry | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const query = useQuery();
  const editId = query.get("editId");

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <MultilingualTitle />
        </div>
        
        {!isEditing ? (
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
