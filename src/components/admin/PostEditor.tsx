
import { BlogEntry } from "@/types/blogTypes";
import MarkdownEditor from "../MarkdownEditor";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { savePost } from "@/services/blogService";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const [sessionOk, setSessionOk] = useState(false);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (!session) {
        console.log("No session in auth context, checking directly with Supabase");
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          toast({
            title: "Session Error",
            description: "No valid session found. Please log in again.",
            variant: "destructive"
          });
          navigate("/auth");
          return;
        }
        console.log("Valid session found directly from Supabase");
      }
      setSessionOk(true);
    };
    
    checkSession();
  }, [session, navigate, toast]);

  const handleSavePost = async (post: BlogEntry) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save posts",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    try {
      setIsSaving(true);
      console.log("Saving post with data:", {
        title: post.title,
        id: post.id,
        tags: post.tags,
        status: post.status
      });

      // Ensure post has the current user's ID
      const postWithUserId = {
        ...post,
        user_id: user.id
      };
      
      // Force session refresh before save
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn("Session refresh before save failed:", error);
        } else {
          console.log("Session refreshed before saving post");
        }
      } catch (e) {
        console.warn("Exception during session refresh:", e);
      }
      
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
      
      // Handle specific error cases
      if (error.message?.includes("Authentication")) {
        toast({
          title: "Session Expired",
          description: "Your login session has expired. Please sign in again.",
          variant: "destructive"
        });
        navigate("/auth");
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to save post. Please try again.",
          variant: "destructive"
        });
      }
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

  if (!sessionOk) {
    return (
      <div className="p-4 text-center">
        <p>Checking session...</p>
      </div>
    );
  }

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
