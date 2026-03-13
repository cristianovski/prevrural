import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client } from '../types';
import { gerarResumoIA } from '../lib/aiService';

export interface InterviewExtended {
  historico_locais?: string;
  dados_rurais?: {
    nome_imovel?: string;
    area_total?: string;
    condicao_posse?: string;
    culturas?: string;
    destinacao?: string;
  };
  analise_periodos?: Array<{
    inicio?: string;
    fim?: string;
    is_safra?: boolean;
    tipo?: string;
    obs?: string;
  }>;
  ai_summary?: string;
}

export interface OfficeProfileExtended {
  nome_advogado?: string;
  cidade_uf?: string;
  oab?: string;
  endereco_profissional?: string;
}

export function useMasterReport(cliente: Client) {
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<InterviewExtended | null>(null);
  const [periods, setPeriods] = useState<InterviewExtended['analise_periodos']>([]);
  const [officeProfile, setOfficeProfile] = useState<OfficeProfileExtended | null>(null);
  const [stats, setStats] = useState({ rural: 0, carencia: 0 });
  const [aiSummary, setAiSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const [sections, setSections] = useState({
    capa: true,
    resumo_ia: true,
    dados_cadastrais: true,
    tabela_periodos: true,
    parecer: true,
    procuracao: false,
  });

  useEffect(() => {
    if (cliente?.id) fetchData();
  }, [cliente]);

  const getStart = (p: Record<string, unknown>) => String(p.inicio || p.start_date || '');
  const getEnd = (p: Record<string, unknown>) => String(p.fim || p.end_date || '');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const [invRes, offRes] = await Promise.all([
        supabase.from('interviews').select('*').eq('client_id', cliente.id).maybeSingle(),
        user.user ? supabase.from('office_profile').select('*').eq('user_id', user.user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      if (invRes.data) {
        const invData = invRes.data as InterviewExtended;
        setInterview(invData);
        if (invData.ai_summary) setAiSummary(invData.ai_summary);
        if (invData.analise_periodos) {
          setPeriods(invData.analise_periodos);
          let rural = 0,
            carencia = 0;
          invData.analise_periodos.forEach((p) => {
            const startDate = getStart(p);
            const endDate = getEnd(p);
            if (!startDate || !endDate) return;
            const d1 = new Date(startDate);
            const d2 = new Date(endDate);
            const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
            if (months > 0) {
              if (p.tipo === 'rural') {
                rural += months;
                carencia += months;
              }
              if (p.tipo === 'beneficio') {
                carencia += months;
              }
              if (p.tipo === 'urbano' && p.is_safra) {
                rural += months;
                carencia += months;
              }
            }
          });
          setStats({ rural, carencia });
        }
      }
      if (offRes.data) setOfficeProfile(offRes.data as OfficeProfileExtended);
    } catch (err) {
      console.error('Erro ao carregar dados do relatório:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAiSummary = async () => {
    if (!interview) return alert('Ficha de entrevista não encontrada.');
    setGeneratingSummary(true);
    try {
      const text = await gerarResumoIA(cliente, interview);
      setAiSummary(text);
      await supabase.from('interviews').update({ ai_summary: text }).eq('client_id', cliente.id);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Falha ao gerar resumo: ' + msg);
    } finally {
      setGeneratingSummary(false);
    }
  };

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '___/___/____';
    return dateString.split('-').reverse().join('/');
  };

  return {
    loading,
    interview,
    periods,
    officeProfile,
    stats,
    aiSummary,
    generatingSummary,
    sections,
    generateAiSummary,
    toggleSection,
    formatDate,
    getStart,
    getEnd,
  };
}