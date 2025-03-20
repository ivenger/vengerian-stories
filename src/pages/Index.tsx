
import { useEffect, useState } from "react";
import BlogCard from "../components/BlogCard";
import Navigation from "../components/Navigation";
import { fetchFilteredPosts, fetchAllTags } from "../services/blogService";
import { BlogEntry } from "../types/blogTypes";
import { useToast } from "@/components/ui/use-toast";
import { Tag, X, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Index = () => {
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["Russian"]);
  const { toast } = useToast();
  const languages = ["English", "Hebrew", "Russian"];

  // Load saved filters from localStorage on initial render
  useEffect(() => {
    const savedTags = localStorage.getItem('selectedTags');
    const savedLanguages = localStorage.getItem('selectedLanguages');
    
    if (savedTags) {
      setSelectedTags(JSON.parse(savedTags));
    }
    
    if (savedLanguages) {
      setSelectedLanguages(JSON.parse(savedLanguages));
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedTags', JSON.stringify(selectedTags));
    localStorage.setItem('selectedLanguages', JSON.stringify(selectedLanguages));
  }, [selectedTags, selectedLanguages]);

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
        const langsToFilter = selectedLanguages.length > 0 ? selectedLanguages : undefined;
        const filteredPosts = await fetchFilteredPosts(tagsToFilter, langsToFilter);
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
  }, [selectedTags, selectedLanguages, toast]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleLanguage = (language: string) => {
    if (selectedLanguages.includes(language)) {
      // Don't allow removing the last language
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== language));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedLanguages(["Russian"]);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedTags.length > 0 || 
    (selectedLanguages.length !== 1 || selectedLanguages[0] !== "Russian");

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
                  <Filter size={14} className="text-gray-400" />
                  <span className="hidden sm:inline">Filter</span>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Filter Stories</DialogTitle>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Filter Stories</h3>
                    {hasActiveFilters && (
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
                            onClick={() => toggleLanguage(lang)} 
                            className={`px-3 py-1 text-sm rounded-full flex items-center ${
                              selectedLanguages.includes(lang) 
                                ? "bg-gray-400 text-white" 
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
                                ? "bg-gray-400 text-white" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <Tag size={12} className="mr-1" />
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <div className="mt-2">
                        <h3 className="text-sm font-medium">Active Filters:</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedLanguages.map(lang => (
                            <span 
                              key={lang} 
                              className="px-3 py-1 bg-gray-400 text-white text-sm rounded-full flex items-center"
                            >
                              {lang}
                              {selectedLanguages.length > 1 && (
                                <button 
                                  onClick={() => toggleLanguage(lang)} 
                                  className="ml-1 text-white hover:text-gray-200"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </span>
                          ))}
                          {selectedTags.map(tag => (
                            <span 
                              key={tag} 
                              className="px-3 py-1 bg-gray-400 text-white text-sm rounded-full flex items-center"
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
          
          {/* Only show filters section if there are active filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Filters:</span>
                {selectedLanguages.map(lang => (
                  <span 
                    key={lang} 
                    className="px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full flex items-center mr-1"
                  >
                    {lang}
                    {selectedLanguages.length > 1 && (
                      <button 
                        onClick={() => toggleLanguage(lang)} 
                        className="ml-1 text-white hover:text-gray-200"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
                {selectedTags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full flex items-center mr-1"
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
                {hasActiveFilters 
                  ? "No stories found with the selected filters. Try different filters or clear them." 
                  : "No stories found. Check back later for new content."
                }
              </p>
              {hasActiveFilters && (
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
