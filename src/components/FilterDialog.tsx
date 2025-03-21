
import React from 'react';
import { Tag, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FilterDialogProps {
  allTags: string[];
  selectedTags: string[];
  selectedLanguages: string[];
  toggleTag: (tag: string) => void;
  toggleLanguage: (language: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  languages: string[];
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  allTags,
  selectedTags,
  selectedLanguages,
  toggleTag,
  toggleLanguage,
  clearFilters,
  hasActiveFilters,
  languages
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="hidden sm:inline">Browse</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Browse Stories</DialogTitle>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Story Options</h3>
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
              <h3 className="text-sm font-medium mb-2">By Language</h3>
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
              <h3 className="text-sm font-medium mb-2">By Tag</h3>
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
                <h3 className="text-sm font-medium">Current Selection:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedLanguages.map(lang => (
                    <span 
                      key={lang} 
                      className="px-3 py-1 bg-gray-400 text-white text-sm rounded-full flex items-center"
                    >
                      {lang}
                      <button 
                        onClick={() => toggleLanguage(lang)} 
                        className="ml-1 text-white hover:text-gray-200"
                      >
                        <X size={14} />
                      </button>
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
  );
};

export default FilterDialog;
