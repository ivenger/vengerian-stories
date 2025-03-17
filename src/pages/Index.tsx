
import { useEffect, useState } from "react";
import BlogCard from "../components/BlogCard";
import Footer from "../components/Footer";
import Navigation from "../components/Navigation";
import { fetchFilteredPosts, fetchAllTags } from "../services/blogService";
import { BlogEntry } from "../types/blogTypes";
import { useToast } from "@/components/ui/use-toast";
import { Tag, X, Filter } from "lucide-react";

const Index = () => {
  const [posts, setPosts] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Available languages for filtering - reduced to only English, Hebrew, Russian
  const languages = ["English", "Hebrew", "Russian"];

  useEffect(() => {
    // Load all available tags
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
          variant: "destructive",
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
    setSelectedLanguage("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-cursive font-bold text-gray-900 mb-3">
            Vengerian Stories
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Welcome to our collection of wonderful stories. Explore the magic of storytelling.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters section - moved to the left side */}
          <div className="md:w-1/4">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                <Filter size={16} />
                Filter
              </button>
              
              {(selectedTags.length > 0 || selectedLanguage) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-800 flex items-center"
                >
                  <X size={14} className="mr-1" />
                  Clear
                </button>
              )}
            </div>
            
            {showFilters && (
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="flex flex-col gap-4">
                  {/* Language filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Filter by Language</h3>
                    <div className="flex flex-wrap gap-2">
                      {languages.map(lang => (
                        <button
                          key={lang}
                          onClick={() => setSelectedLanguage(lang === selectedLanguage ? "" : lang)}
                          className={`px-3 py-1 text-sm rounded-full ${
                            lang === selectedLanguage
                              ? "bg-gray-800 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags filter */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Filter by Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 text-sm rounded-full flex items-center ${
                            selectedTags.includes(tag)
                              ? "bg-gray-800 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <Tag size={12} className="mr-1" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active filters display */}
                  {(selectedTags.length > 0 || selectedLanguage) && (
                    <div className="mt-2">
                      <h3 className="text-sm font-medium">Active Filters:</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedLanguage && (
                          <span className="px-3 py-1 bg-gray-800 text-white text-sm rounded-full flex items-center">
                            {selectedLanguage}
                            <button
                              onClick={() => setSelectedLanguage("")}
                              className="ml-1 text-white hover:text-gray-200"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        )}
                        {selectedTags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-gray-800 text-white text-sm rounded-full flex items-center"
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
            )}
          </div>

          {/* Main content area */}
          <div className="md:w-3/4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  {selectedTags.length > 0 || selectedLanguage
                    ? "No stories found with the selected filters. Try different filters or clear them."
                    : "No stories found. Check back later for new content."}
                </p>
                {(selectedTags.length > 0 || selectedLanguage) && (
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
                {posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
