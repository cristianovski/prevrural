import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client, Lawyer, Period } from '../types';

export interface LegacyPeriod extends Period {
  start?: string;
  end?: string;
}

export function useProcuracaoData(cliente: Client) {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [timeline, setTimeline] = useState<LegacyPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [officeAddress, setOfficeAddress] = useState('Endereço não configurado');

  useEffect(() => {
    const fetchData = async () => {
      const savedAddress = localStorage.getItem('officeAddress');
      if (savedAddress) setOfficeAddress(savedAddress);

      const [advRes, interviewRes] = await Promise.all([
        supabase.from('lawyers').select('*'),
        supabase.from('interviews').select('timeline_json').eq('client_id', cliente.id).maybeSingle(),
      ]);

      if (advRes.data) setLawyers(advRes.data as Lawyer[]);

      if (interviewRes.data?.timeline_json) {
        const rurais = (interviewRes.data.timeline_json as LegacyPeriod[])
          .filter((t) => t.type === 'rural')
          .sort((a, b) => new Date(getStart(a)).getTime() - new Date(getStart(b)).getTime());
        setTimeline(rurais);
      }

      setLoading(false);
    };
    fetchData();
  }, [cliente]);

  const getStart = (p: LegacyPeriod) => p.start_date || p.start || '';
  const getEnd = (p: LegacyPeriod) => p.end_date || p.end || '';

  return {
    lawyers,
    timeline,
    loading,
    officeAddress,
    getStart,
    getEnd,
  };
}