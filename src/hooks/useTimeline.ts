import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client } from '../types';

export interface UnifiedTimelineItem {
  id: string | number;
  type: string;
  customName: string;
  issueDate: string;
  displayYear: string | number;
  fileUrl: string | null;
  fileName: string | null;
  source: string;
  law: string;
}

export function useTimeline(cliente: Client) {
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<UnifiedTimelineItem[]>([]);

  useEffect(() => {
    if (cliente?.id) loadUnifiedTimeline();
  }, [cliente]);

  const loadUnifiedTimeline = async () => {
    setLoading(true);
    let combinedDocs: UnifiedTimelineItem[] = [];

    try {
      const [interviewRes, clientRes, newDocsRes] = await Promise.all([
        supabase.from('interviews').select('timeline_json').eq('client_id', cliente.id).maybeSingle(),
        supabase.from('clients').select('personal_docs').eq('id', cliente.id).single(),
        supabase.from('client_documents').select('*').eq('client_id', cliente.id)
      ]);

      // 1. Da entrevista
      const interviewData = interviewRes.data;
      if (interviewData?.timeline_json && Array.isArray(interviewData.timeline_json)) {
        const docsFicha = interviewData.timeline_json.map((doc: Record<string, any>) => ({
          id: doc.id || crypto.randomUUID(),
          type: doc.type || "Registro Ficha",
          customName: doc.description || "",
          issueDate: doc.issueDate || (doc.year ? `${doc.year}-01-01` : 'S/D'),
          displayYear: doc.year || (doc.issueDate ? doc.issueDate.split('-')[0] : "?"),
          fileUrl: doc.fileUrl || null,
          fileName: doc.fileName || null,
          source: 'Entrevista Rural',
          law: doc.law || ""
        }));
        combinedDocs = [...combinedDocs, ...docsFicha];
      }

      // 2. Do cadastro legado
      const clientData = clientRes.data;
      if (clientData?.personal_docs && Array.isArray(clientData.personal_docs)) {
        const docsCadastro = clientData.personal_docs.map((doc: Record<string, any>, idx: number) => ({
          id: `ged-${idx}`,
          type: doc.category || "Documento Pessoal",
          customName: doc.name || "Upload",
          issueDate: doc.issueDate || new Date().toISOString().split('T')[0],
          displayYear: doc.issueDate ? doc.issueDate.split('-')[0] : new Date().getFullYear(),
          fileUrl: doc.url || null,
          fileName: doc.fileName || "arquivo_anexo",
          source: 'GED / Cadastro',
          law: ""
        }));
        combinedDocs = [...combinedDocs, ...docsCadastro];
      }

      // 3. Da nova tabela client_documents
      const newDocs = newDocsRes.data;
      if (newDocs) {
        const docsDb = newDocs.map((doc: Record<string, any>) => ({
          id: doc.id,
          type: doc.category || "Geral",
          customName: doc.title || doc.original_name || "Sem Título",
          issueDate: doc.reference_date || doc.created_at,
          displayYear: new Date(doc.reference_date || doc.created_at).getFullYear(),
          fileUrl: doc.file_url || null,
          fileName: doc.title || doc.original_name || "arquivo",
          source: 'GED (Novo)',
          law: ""
        }));
        combinedDocs = [...combinedDocs, ...docsDb];
      }

      // Ordenar por data
      const sorted = combinedDocs.sort((a, b) => {
        const dateA = new Date(a.issueDate === 'S/D' ? '1900-01-01' : a.issueDate).getTime();
        const dateB = new Date(b.issueDate === 'S/D' ? '1900-01-01' : b.issueDate).getTime();
        return dateA - dateB;
      });

      setTimeline(sorted);
    } catch (err) {
      console.error("Erro ao carregar timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, timeline };
}