
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../use-toast';
import { TagData } from './TagTypes';

export function useTagEditing(
  tags: string[],
  setTags: (tags: string[]) => void,
  tagData: TagData[],
  setTagData: (data: TagData[]) => void,
  editingTag: string,
  editingTagData: TagData | null,
  setIsEditing: (editing: boolean) => void,
  setEditingTag: (tag: string) => void,
  setEditingTagData: (data: TagData | null) => void
) {
  const { toast } = useToast();

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
    if (editingTagData) {
      if (field === 'name') {
        setEditingTagData({...editingTagData, name: value});
      } else {
        setEditingTagData({
          ...editingTagData, 
          translations: {
            ...editingTagData.translations,
            [field]: value
          }
        });
      }
    }
  };

  return {
    startEditing,
    cancelEditing,
    saveEditing,
    handleTranslationChange,
    handleNewTagChange
  };
}
