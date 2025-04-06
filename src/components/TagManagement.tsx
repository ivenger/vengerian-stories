import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllTags, saveTag, deleteTag } from '../services/tagService';
import { useToast } from '../hooks/use-toast';
import { Tag, Plus, Trash2, Save, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { supabase } from '../integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Spinner } from './ui/spinner';

type TagData = {
  name: string;
  translations: {
    en: string;
    he: string;
    ru: string;
  };
};

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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTag, setEditingTag] = useState('');
  const [editingTagData, setEditingTagData] = useState<TagData | null>(null);
  const { toast } = useToast();

  const validateSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error || !data.session) {
          throw new Error("Session expired");
        }
      }
      return true;
    } catch (err) {
      console.error("Session validation failed:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const loadTags = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validate session before proceeding
        const isValid = await validateSession();
        if (!isValid) {
          throw new Error("Session expired");
        }

        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name');

        if (!isMounted) return;

        if (error) throw error;

        const tagsData = data.map(tag => ({
          name: tag.name,
          translations: {
            en: tag.en || tag.name,
            he: tag.he || '',
            ru: tag.ru || ''
          }
        }));

        setTagData(tagsData);
        setTags(tagsData.map(t => t.name));
        setRetryCount(0); // Reset retry count on success
      } catch (error: any) {
        console.error('Error loading tags:', error);
        
        if (!isMounted) return;

        if (error.message === "Session expired") {
          setError("Your session has expired. Please refresh the page to continue.");
        } else if (retryCount < 3) {
          // Implement exponential backoff for retries
          const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 1000, 10000);
          console.log(`TagManagement: Retrying in ${delay}ms (attempt ${retryCount + 1})`);
          
          setRetryCount(prev => prev + 1);
          retryTimeout = setTimeout(() => {
            if (isMounted) {
              loadTags();
            }
          }, delay);
        } else {
          setError("Failed to load tags. Please try again later.");
          toast({
            title: 'Error',
            description: 'Failed to load tags. Please try again.',
            variant: 'destructive'
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTags();

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [toast, retryCount, validateSession]);

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
      setLoading(true);
      
      // Validate session before proceeding
      const isValid = await validateSession();
      if (!isValid) {
        throw new Error("Session expired");
      }

      await saveTag(newTagData.name, newTagData.translations);

      setTagData([...tagData, newTagData]);
      setTags([...tags, newTagData.name]);
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
        description: 'Tag added successfully'
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to add tag. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tagName: string) => {
    if (window.confirm(`Are you sure you want to delete tag "${tagName}"? This will remove it from all posts.`)) {
      try {
        setLoading(true);

        // Validate session before proceeding
        const isValid = await validateSession();
        if (!isValid) {
          throw new Error("Session expired");
        }

        await deleteTag(tagName);

        setTagData(tagData.filter(t => t.name !== tagName));
        setTags(tags.filter(t => t !== tagName));

        toast({
          title: 'Success',
          description: 'Tag deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting tag:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete tag. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const startEditing = (tag: string) => {
    const tagToEdit = tagData.find(t => t.name === tag);
    if (tagToEdit) {
      setIsEditing(true);
      setEditingTag(tag);
      setEditingTagData({ ...tagToEdit });
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingTag('');
    setEditingTagData(null);
  };

  const saveEditing = async () => {
    if (!editingTagData) return;
    
    try {
      setLoading(true);

      // Validate session before proceeding
      const isValid = await validateSession();
      if (!isValid) {
        throw new Error("Session expired");
      }

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
      
      // Update posts using this tag if the name changed
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
        description: 'Tag updated successfully'
      });
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tag. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Add New Tag</h2>
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Tag name"
            value={newTagData.name}
            onChange={e => setNewTagData({ ...newTagData, name: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="English translation"
            value={newTagData.translations.en}
            onChange={e => setNewTagData({
              ...newTagData,
              translations: { ...newTagData.translations, en: e.target.value }
            })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Hebrew translation"
            value={newTagData.translations.he}
            onChange={e => setNewTagData({
              ...newTagData,
              translations: { ...newTagData.translations, he: e.target.value }
            })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Russian translation"
            value={newTagData.translations.ru}
            onChange={e => setNewTagData({
              ...newTagData,
              translations: { ...newTagData.translations, ru: e.target.value }
            })}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={handleAddTag}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Existing Tags</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>English</TableHead>
              <TableHead>Hebrew</TableHead>
              <TableHead>Russian</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tagData.map(tag => (
              <TableRow key={tag.name}>
                {isEditing && editingTag === tag.name ? (
                  // Editing mode
                  <>
                    <TableCell>
                      <input
                        type="text"
                        value={editingTagData?.name || ''}
                        onChange={e => setEditingTagData(prev => prev ? {
                          ...prev,
                          name: e.target.value
                        } : null)}
                        className="p-2 border rounded w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={editingTagData?.translations.en || ''}
                        onChange={e => setEditingTagData(prev => prev ? {
                          ...prev,
                          translations: { ...prev.translations, en: e.target.value }
                        } : null)}
                        className="p-2 border rounded w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={editingTagData?.translations.he || ''}
                        onChange={e => setEditingTagData(prev => prev ? {
                          ...prev,
                          translations: { ...prev.translations, he: e.target.value }
                        } : null)}
                        className="p-2 border rounded w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={editingTagData?.translations.ru || ''}
                        onChange={e => setEditingTagData(prev => prev ? {
                          ...prev,
                          translations: { ...prev.translations, ru: e.target.value }
                        } : null)}
                        className="p-2 border rounded w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditing}
                          className="p-2 text-green-600 hover:text-green-800"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 text-gray-600 hover:text-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  // View mode
                  <>
                    <TableCell>{tag.name}</TableCell>
                    <TableCell>{tag.translations.en}</TableCell>
                    <TableCell>{tag.translations.he}</TableCell>
                    <TableCell>{tag.translations.ru}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(tag.name)}
                          className="p-2 text-blue-600 hover:text-blue-800"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.name)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TagManagement;
