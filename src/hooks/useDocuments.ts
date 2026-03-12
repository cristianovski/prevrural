import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { ClientDocument } from '../types';

export function useDocuments(clientId: number) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (clientId) fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('reference_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setDocs(data as ClientDocument[]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = docs.filter(doc => {
    const title = doc.title || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'Todos' || doc.category === filter;
    return matchesSearch && matchesFilter;
  });

  return {
    docs,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    filteredDocs,
    refresh: fetchDocuments,
  };
}