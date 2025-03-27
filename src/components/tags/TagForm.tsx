
import React from 'react';
import { Plus } from 'lucide-react';
import { TagData } from '../../hooks/useTagManagement';

interface TagFormProps {
  newTagData: TagData;
  onInputChange: (field: string, value: string) => void;
  onAddTag: () => void;
}

const TagForm: React.FC<TagFormProps> = ({ 
  newTagData, 
  onInputChange, 
  onAddTag 
}) => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 gap-4 mb-4 border p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">Add New Tag</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
            <input
              type="text"
              value={newTagData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="Primary tag name"
              className="px-3 py-2 border border-gray-300 rounded-md w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">English</label>
            <input
              type="text"
              value={newTagData.translations.en}
              onChange={(e) => onInputChange('en', e.target.value)}
              placeholder="English translation"
              className="px-3 py-2 border border-gray-300 rounded-md w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hebrew</label>
            <input
              type="text"
              value={newTagData.translations.he}
              onChange={(e) => onInputChange('he', e.target.value)}
              placeholder="Hebrew translation"
              className="px-3 py-2 border border-gray-300 rounded-md w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Russian</label>
            <input
              type="text"
              value={newTagData.translations.ru}
              onChange={(e) => onInputChange('ru', e.target.value)}
              placeholder="Russian translation"
              className="px-3 py-2 border border-gray-300 rounded-md w-full"
            />
          </div>
        </div>
        
        <div className="mt-2">
          <button
            onClick={onAddTag}
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Tag
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagForm;
