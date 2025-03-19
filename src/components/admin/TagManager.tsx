
import React, { useState } from 'react';
import { 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash, Tag as TagIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tag {
  id: string;
  name: string;
  en: string | null;
  he: string | null;
  ru: string | null;
}

interface TagManagerProps {
  tags: Tag[];
  onCreateTag: (tagName: string, translations: { en: string, he: string, ru: string }) => void;
  onDeleteTag: (tag: Tag) => void;
  onClose: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onCreateTag,
  onDeleteTag,
  onClose
}) => {
  const [newTag, setNewTag] = useState('');
  const [tagTranslations, setTagTranslations] = useState({
    en: '',
    he: '',
    ru: '',
  });
  const { toast } = useToast();

  const handleNewTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value);
  };

  const handleTranslationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    lang: string
  ) => {
    setTagTranslations({
      ...tagTranslations,
      [lang]: e.target.value,
    });
  };

  const handleCreateTag = () => {
    if (!newTag.trim()) {
      toast({
        title: "Error",
        description: "Tag name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (tags.some(tag => tag.name === newTag.trim())) {
      toast({
        title: "Error",
        description: "Tag already exists",
        variant: "destructive"
      });
      return;
    }

    onCreateTag(newTag, tagTranslations);
    setNewTag('');
    setTagTranslations({ en: '', he: '', ru: '' });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Tag Management</DialogTitle>
        <DialogDescription>
          Create, edit, and delete tags.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input 
            type="text" 
            id="name" 
            value={newTag} 
            onChange={handleNewTagChange} 
            className="col-span-3" 
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="en" className="text-right">
            English
          </Label>
          <Input 
            type="text" 
            id="en" 
            value={tagTranslations.en} 
            onChange={(e) => handleTranslationChange(e, 'en')} 
            className="col-span-3" 
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="he" className="text-right">
            Hebrew
          </Label>
          <Input 
            type="text" 
            id="he" 
            value={tagTranslations.he} 
            onChange={(e) => handleTranslationChange(e, 'he')} 
            className="col-span-3" 
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="ru" className="text-right">
            Russian
          </Label>
          <Input 
            type="text" 
            id="ru" 
            value={tagTranslations.ru} 
            onChange={(e) => handleTranslationChange(e, 'ru')} 
            className="col-span-3" 
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" onClick={handleCreateTag}>
          Create Tag
        </Button>
      </DialogFooter>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Existing Tags</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  English
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hebrew
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Russian
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <TagIcon size={14} className="mr-1 text-gray-500" />
                      {tag.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tag.en || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tag.he || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tag.ru || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteTag(tag)}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TagManager;
