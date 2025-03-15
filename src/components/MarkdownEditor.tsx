
import React, { useState } from "react";
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
  Upload
} from "lucide-react";
import { format, parse } from "date-fns";
import { uploadImage } from "../services/blogService";

interface MarkdownEditorProps {
  post: BlogEntry;
  onSave: (post: BlogEntry) => void;
  onCancel: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ post, onSave, onCancel }) => {
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [content, setContent] = useState<string | Record<string, string>>(post.content);
  const [date, setDate] = useState(post.date);
  const [language, setLanguage] = useState(post.language[0] || "English");
  const [translations, setTranslations] = useState<string[]>(post.translations || []);
  const [translationInput, setTranslationInput] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [imageUrl, setImageUrl] = useState<string | null>(post.image_url || null);
  const [uploading, setUploading] = useState(false);

  // Available languages for selection
  const languages = ["English", "Spanish", "French", "German", "Russian", "Hebrew", "Chinese", "Japanese"];

  // Format the content with basic HTML when in preview mode
  const getFormattedContent = () => {
    // This is a very basic markdown-to-html conversion
    // In a real app, you'd use a proper markdown parser
    let formatted = typeof content === 'string' 
      ? content
          .replace(/# (.*)/g, '<h1>$1</h1>')
          .replace(/## (.*)/g, '<h2>$1</h2>')
          .replace(/### (.*)/g, '<h3>$1</h3>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br />')
      : JSON.stringify(content);

    // Convert URL-like text to actual links
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
    );

    return formatted;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;
    try {
      // Parse the input date (DD/MM/YYYY) to a Date object
      const parsedDate = parse(inputDate, "dd/MM/yyyy", new Date());
      // Format it to the blog post format (Month D, YYYY)
      const formattedDate = format(parsedDate, "MMMM d, yyyy");
      setDate(formattedDate);
    } catch (error) {
      // If parsing fails, just use the input as is
      setDate(inputDate);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        const imageUrl = await uploadImage(file);
        setImageUrl(imageUrl);
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive"
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = () => {
    const updatedPost: BlogEntry = {
      ...post,
      title,
      excerpt,
      content,
      date,
      language: [language],
      title_language: post.title_language || ["en"],
      translations: translations.length > 0 ? translations : undefined,
      image_url: imageUrl
    };
    onSave(updatedPost);
  };

  const addTranslation = () => {
    if (translationInput && !translations.includes(translationInput)) {
      setTranslations([...translations, translationInput]);
      setTranslationInput("");
    }
  };

  const removeTranslation = (id: string) => {
    setTranslations(translations.filter(t => t !== id));
  };

  // Get the current date in DD/MM/YYYY format for the date input field
  const getInputDateFormat = () => {
    try {
      // Try to parse the current date string to a Date object
      // This assumes the date is in "Month D, YYYY" format
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        // If the date is invalid, return an empty string
        return "";
      }
      // Format to DD/MM/YYYY
      return format(dateObj, "dd/MM/yyyy");
    } catch (error) {
      return "";
    }
  };

  // Helper function for toast notification
  const toast = {
    title: "",
    description: "",
    variant: "default" as "default" | "destructive"
  };

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
          {/* Title Field */}
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
          
          {/* Excerpt Field */}
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

          {/* Featured Image */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Upload size={16} className="mr-1" />
                Featured Image
              </div>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
              {imageUrl && (
                <div className="relative w-16 h-16 border border-gray-200 rounded overflow-hidden">
                  <img src={imageUrl} alt="Featured" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageUrl(null)}
                    className="absolute top-0 right-0 p-0.5 bg-white bg-opacity-75 rounded-bl text-red-600 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Date Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  Date (DD/MM/YYYY)
                </div>
              </label>
              <input
                type="text"
                value={getInputDateFormat()}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="DD/MM/YYYY"
              />
            </div>
            
            {/* Language Field */}
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
            
            {/* Translations Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <LinkIcon size={16} className="mr-1" />
                  Related Translations (IDs)
                </div>
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={translationInput}
                  onChange={(e) => setTranslationInput(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-gray-900"
                  placeholder="Post ID"
                />
                <button
                  onClick={addTranslation}
                  className="px-3 py-2 bg-gray-200 border border-gray-300 border-l-0 rounded-r hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              {translations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {translations.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      {id}
                      <button
                        onClick={() => removeTranslation(id)}
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
          
          {/* Content Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <FileText size={16} className="mr-1" />
                Content (Markdown)
              </div>
            </label>
            <textarea
              value={typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono text-sm"
              placeholder="Write your post content here using Markdown..."
              rows={20}
            />
          </div>
        </div>
      ) : (
        <div className="p-4">
          {imageUrl && (
            <div className="mb-4">
              <img src={imageUrl} alt={title} className="w-full max-h-64 object-cover rounded-lg" />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <div className="text-sm text-gray-500 mb-4">
            {date} • {language}
          </div>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: getFormattedContent() }} />
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;
