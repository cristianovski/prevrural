import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LibraryThesis } from '../types';

export function useDocumentTemplates() {
  const [templates, setTemplates] = useState<LibraryThesis[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('library_theses')
        .select('*')
        .ilike('category', '%Modelo%')
        .eq('active', true);
      if (data) setTemplates(data as LibraryThesis[]);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    loading,
  };
}