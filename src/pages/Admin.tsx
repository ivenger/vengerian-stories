
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import MarkdownEditor from "../components/MarkdownEditor";
import { useToast } from "../hooks/use-toast";
import { BlogPost, blogPosts } from "../data/blogPosts";
import { format } from "date-fns";
import { Globe, FileText, Trash2, XCircle, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminRoleManager from "../components/AdminRoleManager";
import { useAuth } from "../context/AuthContext";

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

  // Get status tag color
  const getStatusColor = (status: string) => {
    return status === "published" 
      ? "bg-green-100 text-green-800" 
      : "bg-amber-100 text-amber-800";
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    return status === "published" 
      ? <Globe size={16} className="text-green-700" /> 
      : <FileText size={16} className="text-amber-700" />;
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">All Posts</h2>
                <button
                  onClick={createNewPost}
                  className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Create New Post
                </button>
              </div>
              
              <div className="grid gap-4">
                {posts.map((post) => (
                  <div 
                    key={post.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-lg">{post.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(post.status || 'draft')}`}>
                            {getStatusIcon(post.status || 'draft')}
                            {post.status || 'draft'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {post.date} • {post.language}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {post.status === "draft" ? (
                          <button
                            onClick={() => publishPost(post)}
                            className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                            title="Publish post"
                          >
                            <Globe size={14} />
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => unpublishPost(post)}
                            className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded hover:bg-amber-200 transition-colors flex items-center gap-1"
                            title="Unpublish post"
                          >
                            <XCircle size={14} />
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => editPost(post)}
                          className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                          title="Delete post"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-700">{post.excerpt}</p>
                  </div>
                ))}
              </div>
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
