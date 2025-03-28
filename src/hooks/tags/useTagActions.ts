
import { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../use-toast';
import { TagData } from './TagTypes';

export function useTagActions(
  tags: string[],
  setTags: (tags: string[]) => void,
  tagData: TagData[],
  setTagData: (data: TagData[]) => void
) {
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

  return {
    isEditing,
    editingTag,
    editingTagData,
    newTagData,
    setNewTagData,
    setIsEditing,
    setEditingTag,
    setEditingTagData,
    handleAddTag,
    handleDeleteTag
  };
}
