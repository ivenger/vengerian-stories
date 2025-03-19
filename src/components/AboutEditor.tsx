
import { useState, useEffect } from "react";
import { fetchAboutContent, saveAboutContent } from "../services/blogService";
import { useToast } from "../hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AboutEditor = () => {
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("Russian");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const languages = ["English", "Hebrew", "Russian"];

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const aboutContent = await fetchAboutContent(language);
        setContent(aboutContent);
      } catch (error) {
        console.error("Failed to load about content:", error);
        toast({
          title: "Error",
          description: "Failed to load the about page content. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [language, toast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveAboutContent(content, language);
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
