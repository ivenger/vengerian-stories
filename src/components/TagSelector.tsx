
import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TagSelectorProps {
  availableTags: string[];
  selectedTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  availableTags,
  selectedTags,
  onAddTag,
  onRemoveTag
}) => {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    if (tagInput && !selectedTags.includes(tagInput)) {
      onAddTag(tagInput);
      setTagInput("");
    }
  };

  const handleSelectTag = (value: string) => {
    if (!selectedTags.includes(value)) {
      onAddTag(value);
    }
  };

  return (
    <div>
      <div className="flex">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="flex-grow px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="Add a tag"
        />
        <button
          onClick={handleAddTag}
          className="px-3 py-2 bg-gray-200 border border-gray-300 border-l-0 rounded-r hover:bg-gray-300"
        >
          Add
        </button>
      </div>
      
      {availableTags.length > 0 && (
        <div className="mt-2">
          <Select onValueChange={handleSelectTag}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select existing tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {selectedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm"
            >
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagSelector;
