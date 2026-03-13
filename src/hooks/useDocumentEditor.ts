import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/use-toast';
import { ClientDocument } from '../types';

const OPCOES_DOCUMENTOS: Record<string, string[]> = {
  'Pessoal': [
    'Documento de Identificação (RG/CNH)',
    'CPF',
    'Comprovante de Endereço',
    'Certidão de Casamento / Nascimento',
    'Outros Documentos Pessoais'
  ],
  'Provas': [
    'Autodeclaração do Segurado Especial',
    'Contratos Rurais (Arrendamento, parceria, meação, comodato)',
    'DAP / CAF',
    'Comprovantes de Venda / Notas Fiscais (Bloco de Notas)',
    'Comprovante de Recolhimento (Funrural/GPS)',
    'Imposto de Renda Rural (IRPF)',
    'Documentos de Terra e Posse (INCRA, ITR, DIAC/DIAT, Escritura)',
    'Certidão FUNAI',
    'Documentos Civis (com indicação de profissão rural)',
    'Documentos Eleitorais (Ficha de cadastro, Certidão)',
    'Documentos Militares (Alistamento, Quitação)',
    'Documentos Escolares (Matrícula, boletim em escola rural)',
    'Documentos de Saúde (Posto de saúde, vacinação, gestante)',
    'Associações e Sindicatos (Ficha, recibos de contribuição)',
    'Insumos e Crédito (Recibos agrícolas, empréstimo rural)',
    'Programas do Governo (Emater, assistência técnica)',
    'Registros Diversos (Processos judiciais, religiosas, comunitárias)'
  ],
  'Processual': [
    'Procuração',
    'Contrato de Honorários',
    'Declaração de Hipossuficiência',
    'Termo de Renúncia',
    'Petição Inicial',
    'Outros Documentos Processuais'
  ],
  'Diversos': ['Outros']
};

const LEGAL_BASIS: Record<string, { law: string; obs: string }> = {
  "Autodeclaração do Segurado Especial": { law: "Lei 8.213/91, Art. 38-B, § 2º; IN 128/2022, Art. 115", obs: "Prova central, devendo ser ratificada." },
  // ... (complete com as demais se quiser, mas não é obrigatório para o funcionamento)
};

export function useDocumentEditor(
  onSuccess: () => void,
  confirmFn: (msg: string) => Promise<boolean>
) {
  const { toast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState<ClientDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    customTitle: '',
    category: 'Provas' as ClientDocument['category'],
    reference_date: '',
    description: '',
  });

  const handleSelectDoc = (doc: ClientDocument) => {
    setSelectedDoc(doc);
    const isStandard = Object.values(OPCOES_DOCUMENTOS).flat().includes(doc.title);
    setEditForm({
      title: isStandard ? doc.title : 'Outros',
      customTitle: isStandard ? '' : doc.title,
      category: doc.category,
      reference_date: doc.reference_date || '',
      description: doc.description || '',
    });
    setIsEditing(false);
  };

  const handleSaveEdits = async () => {
    if (!selectedDoc) return;
    setSaving(true);

    let finalTitle = editForm.title;
    if (finalTitle === 'Outros') {
      if (!editForm.customTitle.trim()) {
        setSaving(false);
        toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' });
        return;
      }
      finalTitle = editForm.customTitle;
    }

    try {
      const { error } = await supabase
        .from('client_documents')
        .update({
          title: finalTitle,
          category: editForm.category,
          reference_date: editForm.reference_date || null,
          description: editForm.description,
        })
        .eq('id', selectedDoc.id);

      if (error) throw error;

      toast({ title: 'Atualizado', description: 'Dados alterados com sucesso.', variant: 'success' });
      setIsEditing(false);
      onSuccess();
      setSelectedDoc(prev => prev ? { ...prev, title: finalTitle, category: editForm.category, reference_date: editForm.reference_date || null, description: editForm.description } : null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!selectedDoc) return;
    if (!(await confirmFn('Excluir este documento permanentemente?'))) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', selectedDoc.id);

      if (error) throw error;

      toast({ title: 'Excluído', description: 'Documento removido.', variant: 'success' });
      setSelectedDoc(null);
      onSuccess();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido ao excluir';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getLegalInfo = (title: string) => {
    return LEGAL_BASIS[title] || null;
  };

  return {
    selectedDoc,
    isEditing,
    saving,
    editForm,
    setEditForm,
    handleSelectDoc,
    handleSaveEdits,
    handleDeleteDoc,
    getLegalInfo,
    setIsEditing,
    OPCOES_DOCUMENTOS,
  };
}