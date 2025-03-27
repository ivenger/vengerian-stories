
import React from 'react';
import { Save, X } from 'lucide-react';
import { TableRow, TableCell } from '../ui/table';
import { TagData } from '../../hooks/useTagManagement';

interface TagEditProps {
  editingTagData: TagData;
  onInputChange: (language: keyof TagData['translations'], value: string) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const TagEdit: React.FC<TagEditProps> = ({
  editingTagData,
  onInputChange,
  onNameChange,
  onSave,
  onCancel
}) => {
  return (
    <TableRow>
      <TableCell>
        <input
          type="text"
          value={editingTagData.name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded"
        />
      </TableCell>
      <TableCell>
        <input
          type="text"
          value={editingTagData.translations.en}
          onChange={(e) => onInputChange('en', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded"
        />
      </TableCell>
      <TableCell>
        <input
          type="text"
          value={editingTagData.translations.he}
          onChange={(e) => onInputChange('he', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded"
        />
      </TableCell>
      <TableCell>
        <input
          type="text"
          value={editingTagData.translations.ru}
          onChange={(e) => onInputChange('ru', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded"
        />
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <button
            onClick={onSave}
            className="p-1 bg-gray-900 text-white rounded hover:bg-gray-700"
            title="Save"
          >
            <Save size={16} />
          </button>
          <button
            onClick={onCancel}
            className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            title="Cancel"
          >
            <X size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TagEdit;
