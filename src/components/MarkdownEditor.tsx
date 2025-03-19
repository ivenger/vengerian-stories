
import React, { useState, useEffect } from "react";
import { BlogEntry } from "../types/blogTypes";
import { 
  Calendar, 
  Languages, 
  Tags, 
  FileText, 
  Save, 
  X, 
  Link as LinkIcon,
  ArrowLeft,
  Tag,
  Image
} from "lucide-react";
import { format, parse } from "date-fns";
import { fetchAllPosts, fetchAllTags, fetchBucketImages, fetchTagsByLanguage } from "../services/blogService";
import { useToast } from "../hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MarkdownEditorProps {
  post: BlogEntry;
  onSave: (post: BlogEntry) => void;
  onCancel: () => void;
}

// Function to convert markdown to HTML
const getFormattedContent = (markdown: string): string => {
  // This is a simple markdown parsing implementation
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Convert bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Convert links
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Convert images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" class="w-full max-h-96 object-contain my-4" />');
  
  // Convert paragraphs
  html = html.replace(/^\s*(\n)?(.+)/gim, function(m) {
    return /\<(\/)?(h1|h2|h3|ul|ol|li|blockquote|pre|img)/.test(m) ? m : '<p>' + m + '</p>';
  });
  
  // Convert line breaks
  html = html.replace(/\n/gim, '<br>');
  
  return html;
};

// Function to detect if text has Hebrew characters
const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

// Function to detect if text has Cyrillic characters
const hasCyrillic = (text: string): boolean => {
  return /[А-Яа-яЁё]/.test(text);
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ post, onSave, onCancel }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [content, setContent] = useState<string>(post.content || "");
  const [date, setDate] = useState(post.date || "");
  const [language, setLanguage] = useState(post.language?.[0] || "English");
  const [translations, setTranslations] = useState<string[]>(post.translations || []);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [imageUrl, setImageUrl] = useState<string | null>(post.image_url || null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [availablePosts, setAvailablePosts] = useState<BlogEntry[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [filteredTags, setFilteredTags] = useState<string[]>([]);

  const languages = ["English", "Hebrew", "Russian"];

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingPosts(true);
        setIsLoadingImages(true);
        
        const posts = await fetchAllPosts();
        setAvailablePosts(posts.filter(p => p.id !== post.id));
        
        const tags = await fetchAllTags();
        setAvailableTags(tags);
        
        const images = await fetchBucketImages();
        setAvailableImages(images);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingPosts(false);
        setIsLoadingImages(false);
      }
    };

    loadData();
  }, [post.id, toast]);

  useEffect(() => {
    const getTagsForLanguage = async () => {
      try {
        const tags = await fetchTagsByLanguage(language);
        setFilteredTags(tags);
      } catch (error) {
        console.error("Error fetching tags for language:", error);
        setFilteredTags([]);
      }
    };
    
    getTagsForLanguage();
  }, [language]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;
    setDate(inputDate);
  };

  const handleSave = () => {
    const updatedPost: BlogEntry = {
      ...post,
      title,
      excerpt: excerpt || null,
      content,
      date: date || format(new Date(), "MMMM d, yyyy"),
      language: [language],
      title_language: post.title_language || ["en"],
      translations: translations.length > 0 ? translations : undefined,
      image_url: imageUrl,
      tags: tags.length > 0 ? tags : undefined
    };
    onSave(updatedPost);
  };

  const addTranslation = (id: string) => {
    if (id && !translations.includes(id)) {
      setTranslations([...translations, id]);
    }
  };

  const removeTranslation = (id: string) => {
    setTranslations(translations.filter(t => t !== id));
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
      
      if (!availableTags.includes(tagInput)) {
        setAvailableTags([...availableTags, tagInput]);
        setFilteredTags([...filteredTags, tagInput]);
      }
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSelectTag = (value: string) => {
    if (!tags.includes(value)) {
      setTags([...tags, value]);
    }
  };

  const handleSelectImage = (url: string) => {
    setImageUrl(url);
  };

  const filteredPosts = availablePosts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImageFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  // Determine if the content needs RTL
  const isRtlTitle = hasHebrew(title);
  const isRtlContent = hasHebrew(content);
  const titleFontClass = hasCyrillic(title) ? 'font-cursive-cyrillic' : 'font-cursive';

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <button
          onClick={onCancel}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to posts
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("edit")}
            className={`px-3 py-1 rounded ${
              activeTab === "edit" 
                ? "bg-gray-200 text-gray-900" 
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1 rounded ${
              activeTab === "preview" 
                ? "bg-gray-200 text-gray-900" 
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            Preview
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="flex items-center px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
          >
            <X size={16} className="mr-1" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-3 py-1 bg-gray-900 text-white rounded hover:bg-gray-700"
          >
            <Save size={16} className="mr-1" />
            Save
          </button>
        </div>
      </div>
      
      {activeTab === "edit" ? (
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Post title"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Brief description of your post"
              rows={2}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Image size={16} className="mr-1" />
                Featured Image
              </div>
            </label>
            
            {isLoadingImages ? (
              <div className="py-2 text-sm text-gray-500">Loading images...</div>
            ) : (
              <div>
                <Select onValueChange={handleSelectImage}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an image from storage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availableImages.map((url) => (
                        <SelectItem key={url} value={url}>
                          {getImageFileName(url)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                
                {imageUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="relative w-24 h-24 border border-gray-200 rounded overflow-hidden">
                      <img src={imageUrl} alt="Featured" className="w-full h-full object-cover" />
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
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  Date
                </div>
              </label>
              <input
                type="text"
                value={date}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Enter date"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Languages size={16} className="mr-1" />
                  Language
                </div>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Tag size={16} className="mr-1" />
                  Tags
                </div>
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Add a tag"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-gray-200 border border-gray-300 border-l-0 rounded-r hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              
              {filteredTags.length > 0 && (
                <div className="mt-2">
                  <Select onValueChange={handleSelectTag}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select existing tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {filteredTags.map((tag) => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <LinkIcon size={16} className="mr-1" />
                Related Translations
              </div>
            </label>
            <div className="mb-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for posts by title"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            
            {isLoadingPosts ? (
              <div className="text-sm text-gray-500">Loading posts...</div>
            ) : (
              <Select onValueChange={addTranslation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a post" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filteredPosts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title} ({p.language?.join(', ')})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
            
            {translations.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Selected Translations:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {translations.map((id) => {
                    const relatedPost = availablePosts.find(p => p.id === id);
                    const displayName = relatedPost 
                      ? `${relatedPost.title} (${relatedPost.language?.join(', ')})` 
                      : id;
                    
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        {displayName}
                        <button
                          onClick={() => removeTranslation(id)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <FileText size={16} className="mr-1" />
                Content (Markdown)
              </div>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono text-sm"
              placeholder="Write your post content here using Markdown..."
              rows={20}
            />
          </div>
        </div>
      ) : (
        <div className="p-4 max-w-3xl mx-auto">
          <article>
            {imageUrl && (
              <div className="flex-none mb-4">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="max-w-full max-h-[300px] object-contain rounded-lg"
                />
              </div>
            )}
            
            <div className="flex-grow">
              <h1 
                className={`${titleFontClass} text-4xl mb-4 ${isRtlTitle ? 'text-right' : 'text-left'}`}
                dir={isRtlTitle ? 'rtl' : 'ltr'}
                style={isRtlTitle ? { unicodeBidi: 'bidi-override', direction: 'rtl' } : {}}
              >
                {title}
              </h1>
              
              <div className={`flex items-center text-gray-500 mb-6 ${isRtlTitle ? 'justify-end' : 'justify-start'}`}>
                <Calendar size={16} className={isRtlTitle ? 'ml-1' : 'mr-1'} />
                <span 
                  dir={isRtlTitle ? 'rtl' : 'ltr'} 
                  style={isRtlTitle ? { unicodeBidi: 'bidi-override', direction: 'rtl' } : {}}
                >
                  {date || format(new Date(), "MMMM d, yyyy")}
                </span>
              </div>
              
              {tags.length > 0 && (
                <div className={`flex flex-wrap gap-2 mb-6 ${isRtlTitle ? 'justify-end' : 'justify-start'}`}>
                  {tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      <Tag size={14} className={isRtlTitle ? 'ml-1' : 'mr-1'} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div 
              className={`prose max-w-none mt-8 ${isRtlContent ? 'text-right' : 'text-left'}`}
              dir={isRtlContent ? 'rtl' : 'ltr'}
              style={isRtlContent ? { unicodeBidi: 'bidi-override', direction: 'rtl' } : {}}
              dangerouslySetInnerHTML={{ __html: getFormattedContent(content) }}
            />
          </article>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
