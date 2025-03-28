
import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useToast } from '../use-toast';
import { TagData, TagRecord } from './TagTypes';

export function useTagData() {
  const [tags, setTags] = useState<string[]>([]);
  const [tagData, setTagData] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  useEffect(() => {
    loadTags();
  }, []);

  return {
    tags,
    setTags,
    tagData,
    setTagData,
    loading
  };
}
