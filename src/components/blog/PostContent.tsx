
import React from "react";
import { Calendar, Tag, Globe } from "lucide-react";
import { BlogEntry } from "../../types/blogTypes";
import MarkdownPreview from "../MarkdownPreview";
import ReadStatus from "./ReadStatus";
import { Badge } from "../ui/badge";

interface PostContentProps {
  post: BlogEntry;
}

const getLanguageAbbreviation = (language: string): string => {
  const languageMap: Record<string, string> = {
    'English': 'en',
    'Hebrew': 'he',
    'Russian': 'ru'
  };
  
  return languageMap[language] || language.toLowerCase().substring(0, 2);
};

const hasHebrew = (text: string): boolean => {
  return /[\u0590-\u05FF]/.test(text);
};

const PostContent: React.FC<PostContentProps> = ({ post }) => {
  const isRtl = post.language?.includes('Hebrew') || hasHebrew(post.title);
  const contentDirection = isRtl ? 'rtl' : 'ltr';
  const textAlignment = isRtl ? 'text-right' : 'text-left';
  const flexDirection = isRtl ? 'flex-row-reverse' : 'flex-row';
  
  return (
    <article 
      className={`bg-white rounded-lg shadow-md overflow-hidden relative max-w-4xl mx-auto ${textAlignment}`}
      dir={contentDirection}
    >
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

        <div className={`flex flex-wrap items-center text-gray-500 mb-6 gap-4 ${isRtl ? 'justify-end' : 'justify-start'}`}>
          <div className="flex items-center">
            <Calendar className={`h-4 w-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
            <span>{post.date}</span>
          </div>

          {/* Language badges */}
          {post.language && post.language.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${isRtl ? 'justify-end' : 'justify-start'}`}>
              {post.language.map((lang, index) => (
                <Badge 
                  key={`lang-${index}`}
                  variant="secondary"
                  className={`flex items-center text-xs px-2 py-1 ${flexDirection}`}
                >
                  <Globe className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                  {getLanguageAbbreviation(lang)}
                </Badge>
              ))}
            </div>
          )}

          {/* Post tags */}
          {post.tags && post.tags.length > 0 && (
            <div className={`flex flex-wrap gap-2 ${isRtl ? 'justify-end' : 'justify-start'}`}>
              {post.tags.map((tag, index) => (
                <span
                  key={`tag-${index}`}
                  className={`flex items-center text-xs px-2 py-1 bg-gray-100 rounded-full ${flexDirection}`}
                >
                  <Tag className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="prose max-w-none">
          <MarkdownPreview 
            title={post.title}
            date={post.date}
            language={post.language?.[0] || 'English'}
            content={post.content}
            tags={post.tags || []}
            imageUrl={post.image_url || null}
          />
        </div>
      </div>
    </article>
  );
};

export default PostContent;
