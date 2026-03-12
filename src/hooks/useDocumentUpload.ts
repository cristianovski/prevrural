import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { getLocalDateISO } from '../lib/utils';
import { ClientDocument } from '../types';

export function useDocumentUpload(clientId: number, onSuccess: () => void) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    category: 'Provas' as ClientDocument['category'],
    customName: '',
    date: getLocalDateISO(),
    userObs: '',
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const baseName = file.name.split('.').slice(0, -1).join('.') || file.name;
    setFileToUpload(file);
    setUploadMetadata({
      category: 'Provas',
      customName: baseName,
      date: getLocalDateISO(),
      userObs: '',
    });
    setIsUploadModalOpen(true);
    e.target.value = '';
  };

  const confirmUpload = async () => {
    if (!fileToUpload) return;

    const finalTitle = uploadMetadata.customName.trim();
    if (!finalTitle) {
      toast({ title: 'Atenção', description: 'Digite o nome do documento.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const cleanName = finalTitle.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${clientId}/${Date.now()}_${cleanName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('evidence-files')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('evidence-files')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          title: finalTitle,
          category: uploadMetadata.category,
          file_url: publicUrl,
          reference_date: uploadMetadata.date || null,
          description: uploadMetadata.userObs,
          source_origin: 'GED Novo',
        });

      if (dbError) throw dbError;

      toast({ title: 'Sucesso', description: 'Documento salvo.', variant: 'success' });
      setIsUploadModalOpen(false);
      setFileToUpload(null);
      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido no upload';
      toast({ title: 'Erro no upload', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    isUploadModalOpen,
    setIsUploadModalOpen,
    fileToUpload,
    uploadMetadata,
    setUploadMetadata,
    handleFileSelect,
    confirmUpload,
  };
}