
import { useState, useEffect, useContext } from "react";
import Navigation from "../components/Navigation";
import { fetchAboutContent } from "../services/blogService";
import { useToast } from "@/hooks/use-toast";
import { LanguageContext } from "../App";
import { Book, GraduationCap, Lightbulb, Puzzle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Function to detect if text has Hebrew characters
const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

const About = () => {
  const [content, setContent] = useState("");
  const [authorImage, setAuthorImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentLanguage } = useContext(LanguageContext);
  
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const aboutData = await fetchAboutContent(currentLanguage);
        if (typeof aboutData === 'string') {
          setContent(aboutData);
        } else {
          setContent(aboutData.content || "");
          setAuthorImage(aboutData.image_url || null);
        }
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
  }, [toast, currentLanguage]);

  // Determine if content has Hebrew characters to set text direction
  const isRtlContent = hasHebrew(content);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-violet-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-caraterre mb-4 text-violet-900 relative inline-block">
              <span className="relative z-10">About Me</span>
              <span className="absolute -bottom-2 left-0 w-full h-3 bg-yellow-200 -z-10 transform -rotate-1"></span>
            </h1>
            <div className="flex justify-center space-x-4 mt-6">
              <Sparkles className="text-yellow-500" size={24} />
              <Book className="text-violet-600" size={24} />
              <Puzzle className="text-emerald-500" size={24} />
              <Lightbulb className="text-amber-500" size={24} />
              <GraduationCap className="text-blue-600" size={24} />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {authorImage && (
                <div className="mb-12 relative">
                  <div className="overflow-hidden rounded-lg shadow-xl transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                    <img 
                      src={authorImage} 
                      alt="Author" 
                      className="w-full h-auto object-cover"
                    />
                    <div className="absolute bottom-4 right-4 text-xs p-2 bg-white bg-opacity-90 rounded-md shadow-md">
                      <p className="text-violet-800 font-medium">Illustration by Levi Pritzker</p>
                    </div>
                  </div>
                </div>
              )}
              
              <Card className="overflow-hidden border-none shadow-xl bg-white bg-opacity-80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div 
                    className={`prose prose-lg max-w-none prose-headings:text-violet-900 prose-a:text-violet-600 ${isRtlContent ? 'text-right' : 'text-left'}`}
                    dir={isRtlContent ? 'rtl' : 'ltr'}
                  >
                    {content.split('\n').map((paragraph, index) => (
                      paragraph ? (
                        <p key={index} className="mb-4 leading-relaxed">{paragraph}</p>
                      ) : <br key={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 p-6 rounded-lg shadow-md transform hover:-translate-y-1 transition-transform duration-300">
                  <Puzzle className="text-emerald-600 mb-3" size={28} />
                  <h3 className="text-lg font-semibold text-emerald-800 mb-2">Creative Thinking</h3>
                  <p className="text-emerald-700">Approaching challenges with innovative solutions and unique perspectives.</p>
                </div>
                
                <div className="bg-amber-50 p-6 rounded-lg shadow-md transform hover:-translate-y-1 transition-transform duration-300">
                  <Lightbulb className="text-amber-600 mb-3" size={28} />
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">Bright Ideas</h3>
                  <p className="text-amber-700">Generating insightful concepts that illuminate new possibilities.</p>
                </div>
                
                <div className="bg-violet-50 p-6 rounded-lg shadow-md transform hover:-translate-y-1 transition-transform duration-300">
                  <Book className="text-violet-600 mb-3" size={28} />
                  <h3 className="text-lg font-semibold text-violet-800 mb-2">Continuous Learning</h3>
                  <p className="text-violet-700">Always exploring new knowledge and expanding horizons.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default About;
