
import React from 'react';
import { Tag, Calendar } from 'lucide-react';

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
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
  
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

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  title, 
  date, 
  language, 
  content, 
  tags,
  imageUrl 
}) => {
  const isRtlTitle = hasHebrew(title);
  const isRtlContent = hasHebrew(content);
  const titleFontClass = hasCyrillic(title) ? 'font-cursive-cyrillic' : 'font-cursive';

  return (
    <article className="max-w-3xl mx-auto">
      <div className="flex items-start gap-6">
        {imageUrl && (
          <div className="flex-none">
            <img 
              src={imageUrl} 
              alt={title} 
              className="max-w-[300px] max-h-[300px] object-contain rounded-lg"
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
              {date}
            </span>
            {language && <span className="ml-2">• {language}</span>}
          </div>
          
          {tags && tags.length > 0 && (
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
      </div>
      
      <div 
        className={`prose max-w-none mt-8 ${isRtlContent ? 'text-right' : 'text-left'}`}
        dir={isRtlContent ? 'rtl' : 'ltr'}
        style={isRtlContent ? { unicodeBidi: 'bidi-override', direction: 'rtl' } : {}}
        dangerouslySetInnerHTML={{ __html: getFormattedContent(content) }}
      />
    </article>
  );
};

export default MarkdownPreview;
