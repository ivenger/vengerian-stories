
import { BlogEntry } from "@/types/blogTypes";
import MarkdownEditor from "../MarkdownEditor";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { savePost } from "@/services/blogService";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSessionRefresh } from "@/hooks/filters/useSessionRefresh";

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
  const { getActiveSession, refreshSession } = useSessionRefresh();

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      console.log("PostEditor: Checking session");
      
      if (!session) {
        console.log("PostEditor: No session in auth context, checking directly");
        const activeSession = await getActiveSession();
        
        if (!activeSession) {
          console.error("PostEditor: No valid session found");
          toast({
            title: "Session Error",
            description: "No valid session found. Please log in again.",
            variant: "destructive"
          });
          navigate("/auth");
          return;
        }
        
        console.log("PostEditor: Valid session found with user ID:", activeSession.user.id);
      } else {
        console.log("PostEditor: Session exists in auth context with user ID:", session.user.id);
      }
      
      setSessionOk(true);
    };
    
    checkSession();
  }, [session, navigate, toast, getActiveSession]);

  const handleSavePost = async (post: BlogEntry) => {
    console.log("PostEditor: Starting save post operation");
    
    if (!user) {
      console.error("PostEditor: No user found in auth context");
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
      console.log("PostEditor: Saving post with data:", {
        title: post.title,
        id: post.id,
        tags: post.tags,
        status: post.status,
        userId: user.id
      });

      // Ensure post has the current user's ID
      const postWithUserId = {
        ...post,
        user_id: user.id
      };
      
      // Force session refresh before save
      console.log("PostEditor: Refreshing session before saving post");
      await refreshSession();
      
      // Get the current session to verify we have a valid one
      const currentSession = await getActiveSession();
      if (!currentSession || !currentSession.user) {
        throw new Error("No valid session available. Please log in again.");
      }
      
      console.log("PostEditor: Session verified, proceeding with save. User ID:", currentSession.user.id);
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
      console.error("PostEditor: Error saving post:", error);
      
      // Handle specific error cases
      if (error.message?.includes("Authentication") || error.message?.includes("Cannot read properties of null")) {
        console.error("PostEditor: Authentication error detected:", error.message);
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
        <p className="text-sm text-gray-500 mt-2">If this takes too long, try refreshing the page or logging in again.</p>
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
