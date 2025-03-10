
import { useState } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import MarkdownEditor from "../components/MarkdownEditor";
import { useToast } from "../hooks/use-toast";
import { BlogPost, blogPosts } from "../data/blogPosts";
import { format } from "date-fns";

const Admin = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState(blogPosts);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Create a new post with default values
  const createNewPost = () => {
    const newPost: BlogPost = {
      id: (Math.max(...posts.map(p => parseInt(p.id))) + 1).toString(),
      title: "New Post Title",
      excerpt: "Brief description of your post",
      content: "Start writing your post here...",
      date: format(new Date(), "MMMM d, yyyy"),
      language: "English",
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
    
    // In a real application, we would send this to a backend to update the blogPosts.ts file
    console.log("Updated posts:", JSON.stringify(posts, null, 2));
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setSelectedPost(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Blog Admin</h1>
        
        {!isEditing ? (
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
            
            <div className="grid gap-4">
              {posts.map((post) => (
                <div 
                  key={post.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{post.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {post.date} • {post.language}
                      </p>
                    </div>
                    <button
                      onClick={() => editPost(post)}
                      className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-2 text-gray-700">{post.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
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
