
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead } from '../ui/table';
import TagRow from './TagRow';
import TagEdit from './TagEdit';
import { TagData } from '../../hooks/useTagManagement';

interface TagTableProps {
  tags: TagData[];
  isEditing: boolean;
  editingTag: string;
  editingTagData: TagData | null;
  onStartEditing: (tag: TagData) => void;
  onDeleteTag: (tagName: string) => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
  onEditingNameChange: (name: string) => void;
  onTranslationChange: (language: keyof TagData['translations'], value: string) => void;
}

const TagTable: React.FC<TagTableProps> = ({
  tags,
  isEditing,
  editingTag,
  editingTagData,
  onStartEditing,
  onDeleteTag,
  onSaveEditing,
  onCancelEditing,
  onEditingNameChange,
  onTranslationChange
}) => {
  if (tags.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tags available. Add your first tag using the form above.
      </div>
    );
  }

  return (
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
            <TagEdit
              editingTagData={editingTagData}
              onInputChange={onTranslationChange}
              onNameChange={onEditingNameChange}
              onSave={onSaveEditing}
              onCancel={onCancelEditing}
            />
          ) : (
            tags.map((tag) => (
              <TagRow
                key={tag.name}
                tag={tag}
                onEdit={() => onStartEditing(tag)}
                onDelete={() => onDeleteTag(tag.name)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TagTable;
