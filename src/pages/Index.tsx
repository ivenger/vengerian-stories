
import { useEffect, useState } from "react";
import BlogCard from "../components/BlogCard";
import Navigation from "../components/Navigation";
import { fetchFilteredPosts, fetchAllTags } from "../services/blogService";
import { BlogEntry } from "../types/blogTypes";
import { useToast } from "@/components/ui/use-toast";
import { Tag, X, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const Index = () => {
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Russian");
  const { toast } = useToast();
  const languages = ["English", "Hebrew", "Russian"];

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await fetchAllTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Failed to load tags:", error);
      }
    };
    loadTags();
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const tagsToFilter = selectedTags.length > 0 ? selectedTags : undefined;
        const langToFilter = selectedLanguage || undefined;
        const filteredPosts = await fetchFilteredPosts(tagsToFilter, langToFilter);
        setPosts(filteredPosts);
      } catch (error) {
        console.error("Failed to load posts:", error);
        toast({
          title: "Error",
          description: "Failed to load blog posts. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, [selectedTags, selectedLanguage, toast]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedLanguage("Russian");
  };

  return <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center relative">
          <h1 className="font-caraterre tracking-tight text-4xl">
            Vengerian Stories
          </h1>
          <div className="flex items-center justify-center gap-2">
            <p className="text-gray-600">
              Короткое, длиннее и странное
            </p>
            
            <Dialog>
              <DialogTrigger asChild>
                <button className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
                  <Filter size={14} />
                  <span className="hidden sm:inline">Filter</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Filter Stories</h3>
                    {(selectedTags.length > 0 || selectedLanguage !== "Russian") && (
                      <button 
                        onClick={clearFilters} 
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                      >
                        <X size={14} className="mr-1" />
                        Clear All
                      </button>
                    )}
                  </div>
                
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Filter by Language</h3>
                      <div className="flex flex-wrap gap-2">
                        {languages.map(lang => (
                          <button 
                            key={lang} 
                            onClick={() => setSelectedLanguage(lang === selectedLanguage ? "" : lang)} 
                            className={`px-3 py-1 text-sm rounded-full ${
                              lang === selectedLanguage 
                                ? "bg-gray-600 text-white" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Filter by Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                          <button 
                            key={tag} 
                            onClick={() => toggleTag(tag)} 
                            className={`px-3 py-1 text-sm rounded-full flex items-center ${
                              selectedTags.includes(tag) 
                                ? "bg-gray-600 text-white" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <Tag size={12} className="mr-1" />
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(selectedTags.length > 0 || selectedLanguage !== "Russian") && (
                      <div className="mt-2">
                        <h3 className="text-sm font-medium">Active Filters:</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedLanguage && selectedLanguage !== "Russian" && (
                            <span className="px-3 py-1 bg-gray-600 text-white text-sm rounded-full flex items-center">
                              {selectedLanguage}
                              <button 
                                onClick={() => setSelectedLanguage("Russian")} 
                                className="ml-1 text-white hover:text-gray-200"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          )}
                          {selectedTags.map(tag => (
                            <span 
                              key={tag} 
                              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-full flex items-center"
                            >
                              <Tag size={12} className="mr-1" />
                              {tag}
                              <button 
                                onClick={() => toggleTag(tag)} 
                                className="ml-1 text-white hover:text-gray-200"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {(selectedTags.length > 0 || selectedLanguage !== "Russian") && (
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Filters:</span>
                {selectedLanguage && selectedLanguage !== "Russian" && (
                  <span className="px-2 py-0.5 bg-gray-500 text-white text-xs rounded-full flex items-center mr-1">
                    {selectedLanguage}
                    <button 
                      onClick={() => setSelectedLanguage("Russian")} 
                      className="ml-1 text-white hover:text-gray-200"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedTags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 bg-gray-500 text-white text-xs rounded-full flex items-center mr-1"
                  >
                    {tag}
                    <button 
                      onClick={() => toggleTag(tag)} 
                      className="ml-1 text-white hover:text-gray-200"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {selectedTags.length > 0 || selectedLanguage !== "Russian" 
                  ? "No stories found with the selected filters. Try different filters or clear them." 
                  : "No stories found. Check back later for new content."
                }
              </p>
              {(selectedTags.length > 0 || selectedLanguage !== "Russian") && (
                <button 
                  onClick={clearFilters} 
                  className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-8">
              {posts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>;
};

export default Index;
