
import React, { useState, useEffect } from 'react';
import { fetchAllTags, saveTag, deleteTag } from '../services/blogService';
import { useToast } from '../hooks/use-toast';
import { Tag, Plus, Trash2, Save, X } from 'lucide-react';

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagLanguage, setNewTagLanguage] = useState('English');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTag, setEditingTag] = useState('');
  const { toast } = useToast();

  // Available languages - reduced to only English, Hebrew, Russian
  const languages = ["English", "Hebrew", "Russian"];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const allTags = await fetchAllTags();
      setTags(allTags);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tags. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    if (tags.includes(newTagName.trim())) {
      toast({
        title: 'Error',
        description: 'Tag already exists',
        variant: 'destructive'
      });
      return;
    }

    try {
      await saveTag(newTagName.trim(), newTagLanguage);
      setTags([...tags, newTagName.trim()]);
      setNewTagName('');
      
      toast({
        title: 'Success',
        description: `Tag "${newTagName}" added successfully`
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tag. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    if (window.confirm(`Are you sure you want to delete tag "${tagName}"? This will remove it from all posts.`)) {
      try {
        await deleteTag(tagName);
        setTags(tags.filter(t => t !== tagName));
        toast({
          title: 'Success',
          description: `Tag "${tagName}" deleted successfully`
        });
      } catch (error) {
        console.error('Error deleting tag:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete tag. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const startEditing = (tagName: string) => {
    setEditingTag(tagName);
    setNewTagName(tagName);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingTag('');
    setNewTagName('');
  };

  const saveEditing = async () => {
    if (!newTagName.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    if (tags.includes(newTagName.trim()) && newTagName.trim() !== editingTag) {
      toast({
        title: 'Error',
        description: 'Tag already exists',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Delete old tag and create new one
      await deleteTag(editingTag);
      await saveTag(newTagName.trim(), newTagLanguage);
      
      setTags(tags.map(t => t === editingTag ? newTagName.trim() : t));
      setIsEditing(false);
      setEditingTag('');
      setNewTagName('');
      
      toast({
        title: 'Success',
        description: `Tag updated successfully`
      });
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tag. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Tag className="mr-2" size={20} />
        Tag Management
      </h2>

      <div className="mb-6">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Enter tag name"
            className="px-3 py-2 border border-gray-300 rounded-md flex-grow"
          />
          <select
            value={newTagLanguage}
            onChange={(e) => setNewTagLanguage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          {isEditing ? (
            <>
              <button
                onClick={saveEditing}
                className="px-3 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 flex items-center"
              >
                <Save size={16} className="mr-1" />
                Update
              </button>
              <button
                onClick={cancelEditing}
                className="px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center"
              >
                <X size={16} className="mr-1" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleAddTag}
              className="px-3 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Add Tag
            </button>
          )}
        </div>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tags available. Add your first tag using the form above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {tags.map(tag => (
            <div 
              key={tag}
              className="flex items-center justify-between p-2 border border-gray-200 rounded-md"
            >
              <span className="flex items-center">
                <Tag size={14} className="mr-1 text-gray-500" />
                {tag}
              </span>
              <div className="flex items-center">
                <button
                  onClick={() => startEditing(tag)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTag(tag)}
                  className="p-1 text-red-600 hover:text-red-800 ml-2"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagManagement;
