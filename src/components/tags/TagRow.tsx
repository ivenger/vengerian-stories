
import React from 'react';
import { Tag, Trash2 } from 'lucide-react';
import { TableRow, TableCell } from '../ui/table';
import { TagData } from '../../hooks/useTagManagement';

interface TagRowProps {
  tag: TagData;
  onEdit: () => void;
  onDelete: () => void;
}

const TagRow: React.FC<TagRowProps> = ({ tag, onEdit, onDelete }) => {
  return (
    <TableRow>
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
            onClick={onEdit}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TagRow;
