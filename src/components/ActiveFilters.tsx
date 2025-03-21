
import React from 'react';
import { X } from 'lucide-react';

interface ActiveFiltersProps {
  selectedLanguages: string[];
  selectedTags: string[];
  toggleLanguage: (language: string) => void;
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  selectedLanguages,
  selectedTags,
  toggleLanguage,
  toggleTag,
  hasActiveFilters
}) => {
  if (!hasActiveFilters) return null;
  
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      <div className="flex items-center flex-wrap">
        <span className="text-sm text-gray-500 mr-2">Viewing:</span>
        {selectedLanguages.map(lang => (
          <span 
            key={lang} 
            className="px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full flex items-center mr-1"
          >
            {lang}
            <button 
              onClick={() => toggleLanguage(lang)} 
              className="ml-1 text-white hover:text-gray-200"
            >
              <X size={12} />
            </button>
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
  );
};

export default ActiveFilters;
