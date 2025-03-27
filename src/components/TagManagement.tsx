
import React from 'react';
import { Tag } from 'lucide-react';
import { useTagManagement } from '../hooks/useTagManagement';
import TagForm from './tags/TagForm';
import TagTable from './tags/TagTable';
import { Spinner } from './ui/spinner';

const TagManagement: React.FC = () => {
  const {
    tagData,
    loading,
    isEditing,
    editingTag,
    editingTagData,
    newTagData,
    handleNewTagChange,
    handleAddTag,
    handleDeleteTag,
    startEditing,
    cancelEditing,
    saveEditing,
    handleTranslationChange
  } = useTagManagement();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Tag className="mr-2" size={20} />
        Tag Management
      </h2>

      <TagForm
        newTagData={newTagData}
        onInputChange={handleNewTagChange}
        onAddTag={() => handleAddTag(newTagData)}
      />

      <TagTable
        tags={tagData}
        isEditing={isEditing}
        editingTag={editingTag}
        editingTagData={editingTagData}
        onStartEditing={startEditing}
        onDeleteTag={handleDeleteTag}
        onSaveEditing={saveEditing}
        onCancelEditing={cancelEditing}
        onEditingNameChange={(name) => {
          if (editingTagData) {
            handleTranslationChange('name' as any, name); // Type assertion to make TypeScript happy
          }
        }}
        onTranslationChange={handleTranslationChange}
      />
    </div>
  );
};

export default TagManagement;
