
import React from 'react';
import { Tag, Calendar } from 'lucide-react';
import { sanitizeHtml } from '../utils/htmlSanitizer';

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
  // Ensure markdown is a string before applying string methods
  if (!markdown) {
    return '';
  }
  
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
  if (!text) return false;
  return /[\u0590-\u05FF]/.test(text);
};

// Function to detect if text has Cyrillic characters
const hasCyrillic = (text: string): boolean => {
  if (!text) return false;
  return /[А-Яа-яЁё]/.test(text);
};

// Function to format date properly for RTL languages
const formatDateForRTL = (date: string): string => {
  // If the date contains numbers and is in a format like "Month DD, YYYY"
  if (date && /\d/.test(date)) {
    // Split into parts (assuming format like "Month DD, YYYY")
    const parts = date.split(/,\s*/);
    if (parts.length > 1) {
      // Keep the month and day part
      let monthDay = parts[0];
      // Keep the year part
      let year = parts[1].trim();
      return `${monthDay}, ${year}`;
    }
  }
  return date || '';
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
  const hasCyrillicTitle = hasCyrillic(title);
  
  // Get font class based on language
  const getTitleFontClass = () => {
    if (isRtlTitle) return 'font-raleway font-semibold';
    // Both English and Cyrillic titles now use Pacifico
    return 'font-pacifico text-[44px]'; // 44px for MarkdownPreview
  };
  
  // Format date for RTL display if needed
  const displayDate = isRtlTitle ? formatDateForRTL(date) : date;

  return (
    <article className="max-w-3xl mx-auto">
      <div className="flex items-start gap-6">
        {imageUrl && (
          <div className="flex-none">
            <div className="relative">
              <img 
                src={imageUrl} 
                alt={title || ''} 
                className="max-w-[300px] max-h-[300px] object-contain rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 text-xs p-1 text-gray-700 bg-white bg-opacity-75">
                Illustration by Levi Pritzker
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-grow">
          <h1 
            className={`${getTitleFontClass()} mb-4 ${isRtlTitle ? 'text-right' : 'text-left'}`}
            dir={isRtlTitle ? 'rtl' : 'ltr'}
          >
            {title}
          </h1>
          
          <div className={`flex items-center text-gray-500 mb-6 ${isRtlTitle ? 'justify-end' : 'justify-start'}`}>
            <Calendar size={16} className={isRtlTitle ? 'ml-1' : 'mr-1'} />
            <span 
              dir={isRtlTitle ? 'rtl' : 'ltr'} 
            >
              {displayDate}
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
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(getFormattedContent(content || '')) }}
      />
    </article>
  );
};

export default MarkdownPreview;
