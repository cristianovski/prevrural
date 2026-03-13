import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
import { Client, Period } from '../types';
import { analisarViabilidade, AnalysisResult, ClientData } from '../utils/benefitRules';
import { getLocalDateISO } from '../lib/utils';

export type PeriodoType = 'rural' | 'urbano' | 'beneficio' | 'lacuna' | 'prova de retorno';

export interface Periodo {
  id: string;
  inicio: string;
  fim: string;
  tipo: PeriodoType;
  obs?: string;
  is_safra?: boolean;
  linkedDocId?: string;
  linkedDocTitle?: string;
  law?: string;
}

interface DocumentTimelineItem {
  id: string;
  type: string;
  issueDate: string;
  displayYear: string | number;
  fileUrl: string | null;
  origem: string;
}

export function useBenefitAnalysis(cliente: Client) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [der, setDer] = useState(getLocalDateISO());
  const [selectedBenefit, setSelectedBenefit] = useState('Aposentadoria por Idade Rural');
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [documentos, setDocumentos] = useState<DocumentTimelineItem[]>([]);
  const [extraParams, setExtraParams] = useState({
    data_dii: '',
    is_acidente: false,
    data_obito: '',
    data_casamento: '',
    idade_conjuge_obito: 0,
  });
  const [analiseJuridica, setAnaliseJuridica] = useState<AnalysisResult | null>(null);
  const [totalRural, setTotalRural] = useState(0);
  const [totalHibrido, setTotalHibrido] = useState(0);

  useEffect(() => {
    if (cliente?.id) loadAllData();
  }, [cliente]);

  useEffect(() => {
    calcularTotais();
    executarAnaliseJuridica();
  }, [periodos, selectedBenefit, extraParams, der]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [interviewRes, newDocsRes] = await Promise.all([
        supabase
          .from('interviews')
          .select('analise_periodos, data_der, timeline_json, tipo_beneficio, analise_params')
          .eq('client_id', cliente.id)
          .maybeSingle(),
        supabase.from('client_documents').select('*').eq('client_id', cliente.id),
      ]);

      const interviewData = interviewRes.data;
      if (interviewData) {
        if (interviewData.analise_periodos) setPeriodos(interviewData.analise_periodos);
        if (interviewData.data_der) setDer(interviewData.data_der);
        if (interviewData.tipo_beneficio) setSelectedBenefit(interviewData.tipo_beneficio);
        if (interviewData.analise_params) setExtraParams(interviewData.analise_params);
      }

      const newDocs = newDocsRes.data;
      if (newDocs) {
        const docsDb = newDocs
          .filter((doc: any) => doc.category === 'Provas')
          .map((doc: any) => ({
            id: doc.id,
            type: doc.title || doc.original_name || 'Sem Título',
            issueDate: doc.reference_date || doc.created_at,
            displayYear: new Date(doc.reference_date || doc.created_at).getFullYear(),
            fileUrl: doc.file_url || null,
            origem: 'GED (Novo)',
          }));
        docsDb.sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
        setDocumentos(docsDb);
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar dados da análise.' });
    } finally {
      setLoading(false);
    }
  };

  const diffMonths = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const months = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()) + 1;
    return months > 0 ? months : 0;
  };

  const diffDays = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calcularTotais = () => {
    let rural = 0;
    let urbano = 0;
    periodos.forEach((p) => {
      const meses = diffMonths(p.inicio, p.fim);
      if (p.tipo === 'rural') rural += meses;
      else if (p.tipo === 'urbano') urbano += meses;
      else if (p.tipo === 'beneficio') rural += meses;
    });
    setTotalRural(rural);
    setTotalHibrido(rural + urbano);
  };

  const executarAnaliseJuridica = () => {
    const clientData: ClientData = {
      sexo: cliente.sexo || 'Masculino',
      data_nascimento: cliente.data_nascimento || '',
      profissao: cliente.profissao || 'Rural',
      tempo_rural_anos: totalRural / 12,
      tempo_urbano_anos: (totalHibrido - totalRural) / 12,
      possui_cnpj: cliente.possui_cnpj || false,
      possui_outra_renda: cliente.possui_outra_renda || false,
      ...extraParams,
    };
    const resultado = analisarViabilidade(selectedBenefit, clientData);
    setAnaliseJuridica(resultado);
  };

  const handleSavePeriod = (form: Partial<Periodo>, editingId: string | null) => {
    if (!form.inicio || !form.fim) {
      toast({ title: 'Atenção', description: 'Preencha as datas de início e fim.', variant: 'destructive' });
      return;
    }
    let isSafra = false;
    if (form.tipo === 'urbano') {
      const dias = diffDays(form.inicio, form.fim);
      if (dias <= 120) isSafra = true;
    }
    const item: Periodo = {
      id: editingId || crypto.randomUUID(),
      inicio: form.inicio!,
      fim: form.fim!,
      tipo: form.tipo as PeriodoType,
      obs: form.obs,
      is_safra: isSafra,          // corrigido: is_safra (com underline) recebe isSafra (camelCase)
      linkedDocId: form.linkedDocId,
      linkedDocTitle: form.linkedDocTitle,
      law: form.law,
    };
    if (editingId) {
      setPeriodos((prev) =>
        prev.map((p) => (p.id === editingId ? item : p)).sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
      );
    } else {
      setPeriodos((prev) => [...prev, item].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()));
    }
  };

  const handleRemovePeriod = (id: string) => {
    setPeriodos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('interviews').upsert(
        {
          client_id: cliente.id,
          analise_periodos: periodos,
          data_der: der,
          tipo_beneficio: selectedBenefit,
          analise_params: extraParams,
          updated_at: getLocalDateISO(),
        },
        { onConflict: 'client_id' }
      );
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Cálculo salvo.', variant: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    der,
    setDer,
    selectedBenefit,
    setSelectedBenefit,
    periodos,
    documentos,
    extraParams,
    setExtraParams,
    analiseJuridica,
    totalRural,
    totalHibrido,
    handleSavePeriod,
    handleRemovePeriod,
    handleSave,
  };
}