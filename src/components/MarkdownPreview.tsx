
import React from 'react';
import { Tag } from 'lucide-react';

interface MarkdownPreviewProps {
  title: string;
  date: string;
  language: string;
  content: string;
  tags: string[];
  imageUrl: string | null;
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

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  title, 
  date, 
  language, 
  content, 
  tags,
  imageUrl 
}) => {
  return (
    <div className="p-4">
      {imageUrl && (
        <div className="mb-4">
          <img src={imageUrl} alt={title} className="w-full max-h-64 object-cover rounded-lg" />
        </div>
      )}
      <h1 className="text-3xl font-cursive mb-2">{title}</h1>
      <div className="text-sm text-gray-500 mb-4">
        {date} • {language}
      </div>
      
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs">
              <Tag size={12} className="mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: getFormattedContent(content) }} />
    </div>
  );
};

export default MarkdownPreview;
