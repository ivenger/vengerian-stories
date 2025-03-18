import React, { useState, useEffect } from 'react';
import { fetchAllTags, saveTag, deleteTag } from '../services/blogService';
import { useToast } from '../hooks/use-toast';
import { Tag, Plus, Trash2, Save, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { supabase } from '../integrations/supabase/client';

type TagData = {
  name: string;
  translations: {
    en: string;
    he: string;
    ru: string;
  };
};

interface TagRecord {
  id: string;
  name: string;
  en: string | null;
  he: string | null;
  ru: string | null;
  created_at: string;
  updated_at: string;
}

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [tagData, setTagData] = useState<TagData[]>([]);
  const [newTagData, setNewTagData] = useState<TagData>({
    name: '',
    translations: {
      en: '',
      he: '',
      ru: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTag, setEditingTag] = useState('');
  const [editingTagData, setEditingTagData] = useState<TagData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      
      // Fetch tag records from the tags table
      const { data: tagRecords, error } = await supabase
        .from('tags')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      const allTags = (tagRecords as TagRecord[]).map(record => record.name);
      setTags(allTags);
      
      // Initialize tag data structure from tag records
      const initialTagData = (tagRecords as TagRecord[]).map(record => ({
        name: record.name,
        translations: {
          en: record.en || record.name,
          he: record.he || "",
          ru: record.ru || ""
        }
      }));
      
      setTagData(initialTagData);
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
    if (!newTagData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    if (tags.includes(newTagData.name.trim())) {
      toast({
        title: 'Error',
        description: 'Tag already exists',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Insert into the tags table
      const { error } = await supabase
        .from('tags')
        .insert({
          name: newTagData.name.trim(),
          en: newTagData.translations.en.trim() || newTagData.name.trim(),
          he: newTagData.translations.he.trim() || null,
          ru: newTagData.translations.ru.trim() || null
        });
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setTags([...tags, newTagData.name.trim()]);
      setTagData([...tagData, {
        name: newTagData.name.trim(),
        translations: {
          en: newTagData.translations.en.trim() || newTagData.name.trim(),
          he: newTagData.translations.he.trim(),
          ru: newTagData.translations.ru.trim()
        }
      }]);
      
      // Reset the new tag form
      setNewTagData({
        name: '',
        translations: {
          en: '',
          he: '',
          ru: ''
        }
      });
      
      toast({
        title: 'Success',
        description: `Tag "${newTagData.name}" added successfully`
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
        // Delete from tags table
        const { error } = await supabase
          .from('tags')
          .delete()
          .eq('name', tagName);
        
        if (error) {
          throw error;
        }
        
        // Also update any posts that have this tag
        await deleteTag(tagName);
        
        // Update local state
        setTags(tags.filter(t => t !== tagName));
        setTagData(tagData.filter(t => t.name !== tagName));
        
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

  const startEditing = (tag: TagData) => {
    setEditingTag(tag.name);
    setEditingTagData({...tag});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingTag('');
    setEditingTagData(null);
  };

  const handleTranslationChange = (language: keyof TagData['translations'], value: string) => {
    if (editingTagData) {
      setEditingTagData({
        ...editingTagData,
        translations: {
          ...editingTagData.translations,
          [language]: value
        }
      });
    }
  };

  const saveEditing = async () => {
    if (!editingTagData) return;
    
    try {
      // Update tag in database
      const { error } = await supabase
        .from('tags')
        .update({
          name: editingTagData.name,
          en: editingTagData.translations.en || null,
          he: editingTagData.translations.he || null,
          ru: editingTagData.translations.ru || null
        })
        .eq('name', editingTag);
      
      if (error) {
        throw error;
      }
      
      // If the name has changed, also update any posts that use this tag
      if (editingTag !== editingTagData.name) {
        // Find posts with the old tag name
        const { data: postsWithTag, error: findError } = await supabase
          .from('entries')
          .select('id, tags')
          .contains('tags', [editingTag]);
        
        if (findError) {
          throw findError;
        }
        
        if (postsWithTag && postsWithTag.length > 0) {
          // Update each post to replace the old tag with the new one
          const updates = postsWithTag.map(post => {
            const updatedTags = (post.tags || []).map(tag => 
              tag === editingTag ? editingTagData.name : tag
            );
            
            return {
              id: post.id,
              tags: updatedTags
            };
          });
          
          // Execute all updates
          const { error: updateError } = await supabase
            .from('entries')
            .upsert(updates);
          
          if (updateError) {
            throw updateError;
          }
        }
      }
      
      // Update local state
      setTagData(tagData.map(t => t.name === editingTag ? editingTagData : t));
      setTags(tags.map(t => t === editingTag ? editingTagData.name : t));
      
      setIsEditing(false);
      setEditingTag('');
      setEditingTagData(null);
      
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
        <div className="grid grid-cols-1 gap-4 mb-4 border p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">Add New Tag</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag Name</label>
              <input
                type="text"
                value={newTagData.name}
                onChange={(e) => setNewTagData({...newTagData, name: e.target.value})}
                placeholder="Primary tag name"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">English</label>
              <input
                type="text"
                value={newTagData.translations.en}
                onChange={(e) => setNewTagData({
                  ...newTagData, 
                  translations: {
                    ...newTagData.translations,
                    en: e.target.value
                  }
                })}
                placeholder="English translation"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hebrew</label>
              <input
                type="text"
                value={newTagData.translations.he}
                onChange={(e) => setNewTagData({
                  ...newTagData, 
                  translations: {
                    ...newTagData.translations,
                    he: e.target.value
                  }
                })}
                placeholder="Hebrew translation"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Russian</label>
              <input
                type="text"
                value={newTagData.translations.ru}
                onChange={(e) => setNewTagData({
                  ...newTagData, 
                  translations: {
                    ...newTagData.translations,
                    ru: e.target.value
                  }
                })}
                placeholder="Russian translation"
                className="px-3 py-2 border border-gray-300 rounded-md w-full"
              />
            </div>
          </div>
          
          <div className="mt-2">
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700 flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Add Tag
            </button>
          </div>
        </div>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No tags available. Add your first tag using the form above.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag Name</TableHead>
                <TableHead>English</TableHead>
                <TableHead>Hebrew</TableHead>
                <TableHead>Russian</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEditing && editingTagData ? (
                <TableRow>
                  <TableCell>
                    <input
                      type="text"
                      value={editingTagData.name}
                      onChange={(e) => setEditingTagData({...editingTagData, name: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      value={editingTagData.translations.en}
                      onChange={(e) => handleTranslationChange('en', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      value={editingTagData.translations.he}
                      onChange={(e) => handleTranslationChange('he', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      value={editingTagData.translations.ru}
                      onChange={(e) => handleTranslationChange('ru', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button
                        onClick={saveEditing}
                        className="p-1 bg-gray-900 text-white rounded hover:bg-gray-700"
                        title="Save"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tagData.map((tag) => (
                  <TableRow key={tag.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Tag size={14} className="mr-1 text-gray-500" />
                        {tag.name}
                      </div>
                    </TableCell>
                    <TableCell>{tag.translations.en}</TableCell>
                    <TableCell>{tag.translations.he}</TableCell>
                    <TableCell>{tag.translations.ru}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(tag)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.name)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TagManagement;
