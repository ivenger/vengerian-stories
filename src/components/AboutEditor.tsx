
import React, { useState, useEffect } from "react";
import { Image, Save, X } from "lucide-react";
import { fetchAboutContent, saveAboutContent } from "../services/aboutService";
import { useToast } from "../hooks/use-toast";
import { Button } from "@/components/ui/button";

const AboutEditor: React.FC = () => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadAboutContent = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAboutContent();
        
        if (typeof data === 'string') {
          setContent(data);
          setImageUrl(null);
        } else {
          setContent(data.content || "");
          setImageUrl(data.image_url);
        }
      } catch (error) {
        console.error("Error loading about content:", error);
        toast({
          title: "Error",
          description: "Failed to load about content. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAboutContent();
  }, [toast]);

  const handleSave = async () => {
    try {
      await saveAboutContent({ 
        content: content,
        image_url: imageUrl
      });
      
      toast({
        title: "Success",
        description: "About content saved successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error("Error saving about content:", error);
      toast({
        title: "Error",
        description: "Failed to save about content. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit About Page</h2>
        <div className="flex space-x-2">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex items-center"
          >
            <X size={16} className="mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="default"
            className="flex items-center bg-gray-900 hover:bg-gray-700"
          >
            <Save size={16} className="mr-1" />
            Save
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write the content for the About page..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[300px] focus:outline-none focus:ring-2 focus:ring-gray-200"
          rows={15}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center">
            <Image size={16} className="mr-1" />
            Featured Image URL
          </div>
        </label>
        <input
          type="text"
          value={imageUrl || ""}
          onChange={(e) => setImageUrl(e.target.value || null)}
          placeholder="Enter image URL"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200"
        />
      </div>

      {imageUrl && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Image Preview:</h3>
          <img
            src={imageUrl}
            alt="Featured"
            className="max-w-full max-h-[300px] object-contain rounded"
          />
        </div>
      )}
    </div>
  );
};

export default AboutEditor;
