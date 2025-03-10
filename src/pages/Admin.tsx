
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import MarkdownEditor from "../components/MarkdownEditor";
import { useToast } from "../hooks/use-toast";
import { BlogPost, blogPosts } from "../data/blogPosts";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminRoleManager from "../components/AdminRoleManager";
import { useAuth } from "../context/AuthContext";
import PostsList from "../components/admin/PostsList";

// Function to parse query parameters
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Admin = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState(blogPosts);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const query = useQuery();
  const editId = query.get("editId");
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Check if we need to edit a specific post (from URL parameter)
  useEffect(() => {
    if (editId) {
      const postToEdit = posts.find(p => p.id === editId);
      if (postToEdit) {
        setSelectedPost({...postToEdit});
        setIsEditing(true);
      } else {
        toast({
          title: "Error",
          description: `Post with ID ${editId} not found.`,
          variant: "destructive"
        });
        navigate("/admin");
      }
    }
  }, [editId, posts, toast, navigate]);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You need administrator privileges to access this page.",
        variant: "destructive"
      });
    }
  }, [isAdmin, navigate, toast]);

  // Create a new post with default values
  const createNewPost = () => {
    const newPost: BlogPost = {
      id: (Math.max(...posts.map(p => parseInt(p.id))) + 1).toString(),
      title: "New Post Title",
      excerpt: "Brief description of your post",
      content: "Start writing your post here...",
      date: format(new Date(), "MMMM d, yyyy"),
      language: "English",
      status: "draft", // New posts start as drafts
      translations: []
    };
    
    setSelectedPost(newPost);
    setIsEditing(true);
  };

  // Edit an existing post
  const editPost = (post: BlogPost) => {
    setSelectedPost({...post});
    setIsEditing(true);
  };

  // Save the post (either new or edited)
  const savePost = (post: BlogPost) => {
    // If it's a new post, add it to the array
    if (!posts.some(p => p.id === post.id)) {
      setPosts([...posts, post]);
    } else {
      // If it's an existing post, update it
      setPosts(posts.map(p => p.id === post.id ? post : p));
    }
    
    setIsEditing(false);
    setSelectedPost(null);
    
    toast({
      title: "Success",
      description: "Post saved successfully. The changes will be reflected in the blogPosts.ts file.",
    });
    
    // Clear the editId parameter if it exists
    if (editId) {
      navigate("/admin");
    }
    
    // In a real application, we would send this to a backend to update the blogPosts.ts file
    console.log("Updated posts:", JSON.stringify(posts, null, 2));
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setSelectedPost(null);
    
    // Clear the editId parameter if it exists
    if (editId) {
      navigate("/admin");
    }
  };

  // Change post status to published
  const publishPost = (post: BlogPost) => {
    const updatedPosts = posts.map(p => 
      p.id === post.id ? { ...p, status: "published" as const } : p
    );
    setPosts(updatedPosts);
    
    toast({
      title: "Success",
      description: `"${post.title}" has been published.`,
    });
  };

  // Change post status to draft
  const unpublishPost = (post: BlogPost) => {
    const updatedPosts = posts.map(p => 
      p.id === post.id ? { ...p, status: "draft" as const } : p
    );
    setPosts(updatedPosts);
    
    toast({
      title: "Success",
      description: `"${post.title}" has been unpublished and is now a draft.`,
    });
  };

  // Delete a post
  const deletePost = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      const updatedPosts = posts.filter(p => p.id !== postId);
      setPosts(updatedPosts);
      
      toast({
        title: "Success",
        description: "Post has been deleted.",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Access Denied</h1>
          <p>You need administrator privileges to access this page.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {!isEditing ? (
          <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="posts">Blog Posts</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts">
              <PostsList 
                posts={posts}
                onEditPost={editPost}
                onDeletePost={deletePost}
                onPublishPost={publishPost}
                onUnpublishPost={unpublishPost}
                onCreateNewPost={createNewPost}
              />
            </TabsContent>
            
            <TabsContent value="users">
              <AdminRoleManager />
            </TabsContent>
          </Tabs>
        ) : (
          <MarkdownEditor 
            post={selectedPost!} 
            onSave={savePost}
            onCancel={cancelEditing}
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
