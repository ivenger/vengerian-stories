
import { useState, useEffect } from "react";
import { fetchAboutContent, saveAboutContent, fetchBucketImages } from "../services/blogService";
import { useToast } from "../hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, X } from "lucide-react";

interface AboutData {
  content: string;
  image_url?: string | null;
}

const AboutEditor = () => {
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("Russian");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const { toast } = useToast();
  const languages = ["English", "Hebrew", "Russian"];

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const aboutData = await fetchAboutContent(language);
        if (typeof aboutData === 'string') {
          setContent(aboutData);
          setImageUrl(null);
        } else {
          setContent(aboutData.content || "");
          setImageUrl(aboutData.image_url || null);
        }
        
        // Load available images
        setIsLoadingImages(true);
        const images = await fetchBucketImages();
        setAvailableImages(images);
      } catch (error) {
        console.error("Failed to load about content:", error);
        toast({
          title: "Error",
          description: "Failed to load the about page content. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
        setIsLoadingImages(false);
      }
    };

    loadContent();
  }, [language, toast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveAboutContent({ content, image_url: imageUrl }, language);
      toast({
        title: "Success",
        description: `About page content for ${language} saved successfully.`,
      });
    } catch (error) {
      console.error("Failed to save about content:", error);
      toast({
        title: "Error",
        description: "Failed to save the about page content. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const handleSelectImage = (url: string) => {
    setImageUrl(url);
  };

  const getImageFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Edit About Page</h2>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="author-image">Author Image</Label>
            <div>
              <Select onValueChange={handleSelectImage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an image from storage" />
                </SelectTrigger>
                <SelectContent>
                  {availableImages.map((url) => (
                    <SelectItem key={url} value={url}>
                      {getImageFileName(url)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative w-24 h-24 border border-gray-200 rounded overflow-hidden">
                    <img src={imageUrl} alt="Author" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImageUrl(null)}
                      className="absolute top-0 right-0 p-1 bg-white bg-opacity-75 rounded-bl text-red-600 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500 break-all">{getImageFileName(imageUrl)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="about-content">Content ({language})</Label>
            <Textarea
              id="about-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px]"
              placeholder={`Write about content in ${language}...`}
              dir={language === "Hebrew" ? "rtl" : "ltr"}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              {saving ? "Saving..." : "Save Content"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutEditor;
