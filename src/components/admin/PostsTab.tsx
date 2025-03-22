
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { BlogEntry } from "@/types/blogTypes";
import { format } from "date-fns";
import { Globe, FileText, Trash2, XCircle, Tag } from "lucide-react";
import { fetchAllPosts, savePost, deletePost } from "@/services/blogService";
import { Spinner } from "@/components/ui/spinner";

interface PostsTabProps {
  editId: string | null;
  setIsEditing: (isEditing: boolean) => void;
  setSelectedPost: (post: BlogEntry | null) => void;
}

const PostsTab = ({ editId, setIsEditing, setSelectedPost }: PostsTabProps) => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const allPosts = await fetchAllPosts();
        setPosts(allPosts);
      } catch (error) {
        console.error("Failed to load posts:", error);
        toast({
          title: "Error",
          description: "Failed to load blog posts. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [toast]);

  useEffect(() => {
    if (editId && posts.length > 0) {
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
  }, [editId, posts, toast, navigate, setIsEditing, setSelectedPost]);

  const createNewPost = () => {
    const newPost: BlogEntry = {
      id: crypto.randomUUID(),
      title: "New Post Title",
      excerpt: "Brief description of your post",
      content: "Start writing your post here...",
      date: format(new Date(), "MMMM d, yyyy"),
      language: ["English"],
      title_language: ["en"],
      status: "draft",
      translations: []
    };
    
    setSelectedPost(newPost);
    setIsEditing(true);
  };

  const editPost = (post: BlogEntry) => {
    setSelectedPost({...post});
    setIsEditing(true);
  };

  const publishPost = async (post: BlogEntry) => {
    try {
      const updatedPost = { ...post, status: "published" as const };
      const savedPost = await savePost(updatedPost);
      
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === savedPost.id ? savedPost : p)
      );
      
      toast({
        title: "Success",
        description: `"${post.title}" has been published.`,
      });
    } catch (error) {
      console.error("Error publishing post:", error);
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const unpublishPost = async (post: BlogEntry) => {
    try {
      const updatedPost = { ...post, status: "draft" as const };
      const savedPost = await savePost(updatedPost);
      
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === savedPost.id ? savedPost : p)
      );
      
      toast({
        title: "Success",
        description: `"${post.title}" has been unpublished and is now a draft.`,
      });
    } catch (error) {
      console.error("Error unpublishing post:", error);
      toast({
        title: "Error",
        description: "Failed to unpublish post. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await deletePost(postId);
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
        
        toast({
          title: "Success",
          description: "Post has been deleted.",
        });
      } catch (error) {
        console.error("Error deleting post:", error);
        toast({
          title: "Error",
          description: "Failed to delete post. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    return status === "published" 
      ? "bg-green-100 text-green-800" 
      : "bg-amber-100 text-amber-800";
  };

  const getStatusIcon = (status: string) => {
    return status === "published" 
      ? <Globe size={16} className="text-green-700" /> 
      : <FileText size={16} className="text-amber-700" />;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All Posts</h2>
        <button
          onClick={createNewPost}
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Create New Post
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No posts found. Create your first post using the button above.</p>
        </div>
      ) : (
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
                    {post.date} • {post.language.join(', ')}
                  </p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {post.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center"
                        >
                          <Tag size={10} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
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
                    onClick={() => handleDeletePost(post.id)}
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
      )}
    </div>
  );
};

export default PostsTab;
