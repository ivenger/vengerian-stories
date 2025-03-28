
import { useState } from 'react';
import { useTagData } from './tags/useTagData';
import { useTagActions } from './tags/useTagActions';
import { useTagEditing } from './tags/useTagEditing';
import { TagData } from './tags/TagTypes';

export { TagData } from './tags/TagTypes';

export function useTagManagement() {
  const { tags, setTags, tagData, setTagData, loading } = useTagData();
  
  const {
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
  } = useTagActions(tags, setTags, tagData, setTagData);
  
  const {
    startEditing,
    cancelEditing,
    saveEditing,
    handleTranslationChange,
    handleNewTagChange
  } = useTagEditing(
    tags,
    setTags,
    tagData,
    setTagData,
    editingTag,
    editingTagData,
    setIsEditing,
    setEditingTag,
    setEditingTagData
  );

  const handleNewTagInputChange = (field: string, value: string) => {
    const updatedNewTagData = { ...newTagData };
    
    if (field === 'name') {
      updatedNewTagData.name = value;
    } else {
      updatedNewTagData.translations = {
        ...updatedNewTagData.translations,
        [field]: value
      };
    }
    
    setNewTagData(updatedNewTagData);
  };

  return {
    tagData,
    loading,
    isEditing,
    editingTag,
    editingTagData,
    newTagData,
    handleNewTagChange: handleNewTagInputChange,
    handleAddTag,
    handleDeleteTag,
    startEditing,
    cancelEditing,
    saveEditing,
    handleTranslationChange
  };
}
