import { BlogEntry } from "@/types/blogTypes";
import MarkdownEditor from "../MarkdownEditor";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { savePost } from "@/services/blogService";

interface PostEditorProps {
  selectedPost: BlogEntry;
  setIsEditing: (value: boolean) => void;
  setSelectedPost: (post: BlogEntry | null) => void;
  editId: string | null;
}

const PostEditor = ({ selectedPost, setIsEditing, setSelectedPost, editId }: PostEditorProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSavePost = async (post: BlogEntry) => {
    try {
      const savedPost = await savePost(post);
      
      toast({
        title: "Success",
        description: "Post saved successfully.",
      });
      
      setIsEditing(false);
      setSelectedPost(null);
      
      if (editId) {
        navigate("/admin");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive"
      });
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
    />
  );
};

export default PostEditor;
