
import { BlogEntry } from "@/types/blogTypes";
import MarkdownEditor from "../MarkdownEditor";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { savePost } from "@/services/postService";
import { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";

interface PostEditorProps {
  selectedPost: BlogEntry;
  setIsEditing: (value: boolean) => void;
  setSelectedPost: (post: BlogEntry | null) => void;
  editId: string | null;
}

const PostEditor = ({ selectedPost, setIsEditing, setSelectedPost, editId }: PostEditorProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePost = async (post: BlogEntry) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save posts",
        variant: "destructive"
      });
      return;
    }

    if (!session) {
      toast({
        title: "Session Error",
        description: "Your session has expired. Please log in again.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    try {
      setIsSaving(true);

      // Ensure post has the current user's ID
      const postWithUserId = {
        ...post,
        user_id: user.id
      };
      
      console.log("Saving post with user ID:", user.id);
      const savedPost = await savePost(postWithUserId);
      
      toast({
        title: "Success",
        description: "Post saved successfully.",
      });
      
      setIsEditing(false);
      setSelectedPost(null);
      
      if (editId) {
        navigate("/admin");
      }
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setSelectedPost(null);
    
    if (editId) {
      navigate("/admin");
    }
  };

  return (
    <MarkdownEditor 
      post={selectedPost} 
      onSave={handleSavePost}
      onCancel={handleCancelEditing}
      disabled={isSaving}
    />
  );
};

export default PostEditor;
