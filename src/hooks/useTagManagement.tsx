import { useState, useEffect } from 'react';
import { fetchAllTags, saveTag, deleteTag } from '../services/tagService';
import { useToast } from './use-toast';
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

export const useTagManagement = () => {
  const [tags, setTags] = useState<string[]>([]);
  const [tagData, setTagData] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTag, setEditingTag] = useState('');
  const [editingTagData, setEditingTagData] = useState<TagData | null>(null);
  const [newTagData, setNewTagData] = useState<TagData>({
    name: '',
    translations: {
      en: '',
      he: '',
      ru: ''
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      
      const { data: tagRecords, error } = await supabase
        .from('tags')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      const allTags = (tagRecords as TagRecord[]).map(record => record.name);
      setTags(allTags);
      
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

  const handleAddTag = async (newTagToAdd: TagData) => {
    if (!newTagToAdd.name.trim()) {
      toast({
        title: 'Error',
        description: 'Tag name cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    if (tags.includes(newTagToAdd.name.trim())) {
      toast({
        title: 'Error',
        description: 'Tag already exists',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tags')
        .insert({
          name: newTagToAdd.name.trim(),
          en: newTagToAdd.translations.en.trim() || newTagToAdd.name.trim(),
          he: newTagToAdd.translations.he.trim() || null,
          ru: newTagToAdd.translations.ru.trim() || null
        });
      
      if (error) {
        throw error;
      }
      
      setTags([...tags, newTagToAdd.name.trim()]);
      setTagData([...tagData, {
        name: newTagToAdd.name.trim(),
        translations: {
          en: newTagToAdd.translations.en.trim() || newTagToAdd.name.trim(),
          he: newTagToAdd.translations.he.trim(),
          ru: newTagToAdd.translations.ru.trim()
        }
      }]);
      
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
        description: `Tag "${newTagToAdd.name}" added successfully`
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
        const { error } = await supabase
          .from('tags')
          .delete()
          .eq('name', tagName);
        
        if (error) {
          throw error;
        }
        
        const { data: postsWithTag, error: findError } = await supabase
          .from('entries')
          .select('id, tags')
          .contains('tags', [tagName]);
        
        if (findError) {
          throw findError;
        }
        
        if (postsWithTag && postsWithTag.length > 0) {
          for (const post of postsWithTag) {
            const updatedTags = (post.tags || []).filter(tag => tag !== tagName);
            
            const { error: updateError } = await supabase
              .from('entries')
              .update({ tags: updatedTags })
              .eq('id', post.id);
            
            if (updateError) {
              throw updateError;
            }
          }
        }
        
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
      
      if (editingTag !== editingTagData.name) {
        const { data: postsWithTag, error: findError } = await supabase
          .from('entries')
          .select('id, tags')
          .contains('tags', [editingTag]);
        
        if (findError) {
          throw findError;
        }
        
        if (postsWithTag && postsWithTag.length > 0) {
          for (const post of postsWithTag) {
            const updatedTags = (post.tags || []).map(tag => 
              tag === editingTag ? editingTagData.name : tag
            );
            
            const { error: updateError } = await supabase
              .from('entries')
              .update({ tags: updatedTags })
              .eq('id', post.id);
            
            if (updateError) {
              throw updateError;
            }
          }
        }
      }
      
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

  const handleNewTagChange = (field: string, value: string) => {
    if (field === 'name') {
      setNewTagData({...newTagData, name: value});
    } else {
      setNewTagData({
        ...newTagData, 
        translations: {
          ...newTagData.translations,
          [field]: value
        }
      });
    }
  };

  return {
    tags,
    tagData,
    loading,
    isEditing,
    editingTag,
    editingTagData,
    newTagData,
    setNewTagData,
    handleNewTagChange,
    handleAddTag,
    handleDeleteTag,
    startEditing,
    cancelEditing,
    saveEditing,
    handleTranslationChange
  };
};

export type { TagData };
