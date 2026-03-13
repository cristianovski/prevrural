import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './use-toast';
import { Client } from '../types';
import {
  fetchResponsibilities,
  fetchInstallments,
  createResponsibility,
  payInstallment
} from '../services/financeService';
import { FinancialResponsibility, FinancialInstallment } from '../types/finance';
import { getLocalDateISO } from '../lib/utils';

export function useClientFinance(clientId: number) {
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [responsibilities, setResponsibilities] = useState<FinancialResponsibility[]>([]);
  const [installments, setInstallments] = useState<FinancialInstallment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    valor_total: '',
    tipo: 'parcelado_fixo' as 'parcelado_fixo' | 'exito' | 'ambos',
    numero_parcelas: '',
    data_inicio: getLocalDateISO(),
    observacoes: ''
  });

  useEffect(() => {
    if (clientId) loadData();
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: clientData } = await supabase.from('clients').select('*').eq('id', clientId).single();
      setClient(clientData);

      const respList = await fetchResponsibilities(clientId);
      setResponsibilities(respList);

      const instList = await fetchInstallments();
      const filteredInst = instList.filter(i => respList.some(r => r.id === i.responsibility_id));
      setInstallments(filteredInst);
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao carregar dados financeiros', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResponsibility = async () => {
    if (!formData.descricao || !formData.valor_total || !formData.data_inicio) {
      toast({ title: 'Atenção', description: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    try {
      const novaResp = await createResponsibility({
        client_id: clientId,
        descricao: formData.descricao,
        valor_total: Number(formData.valor_total),
        tipo: formData.tipo,
        numero_parcelas: formData.numero_parcelas ? Number(formData.numero_parcelas) : null,
        data_inicio: formData.data_inicio,
        observacoes: formData.observacoes
      });

      if (formData.tipo === 'parcelado_fixo' && formData.numero_parcelas) {
        const numParcelas = Number(formData.numero_parcelas);
        const valorParcela = novaResp.valor_total / numParcelas;
        const dataInicio = new Date(novaResp.data_inicio);

        const installmentsToInsert = [];
        for (let i = 1; i <= numParcelas; i++) {
          const vencimento = new Date(dataInicio);
          vencimento.setMonth(vencimento.getMonth() + i - 1);
          installmentsToInsert.push({
            responsibility_id: novaResp.id,
            numero_parcela: i,
            valor_previsto: valorParcela,
            data_vencimento: vencimento.toISOString().split('T')[0],
            status: 'pendente'
          });
        }

        if (installmentsToInsert.length > 0) {
          const { error } = await supabase.from('financial_installments').insert(installmentsToInsert);
          if (error) throw error;
        }
      }

      toast({ title: 'Sucesso', description: 'Obrigação cadastrada', variant: 'success' });
      setShowForm(false);
      setFormData({ descricao: '', valor_total: '', tipo: 'parcelado_fixo', numero_parcelas: '', data_inicio: getLocalDateISO(), observacoes: '' });
      loadData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar', variant: 'destructive' });
    }
  };

  const handlePayInstallment = async (installment: FinancialInstallment) => {
    const dataPagamento = getLocalDateISO();
    try {
      await payInstallment(installment.id, dataPagamento, installment.valor_previsto);
      toast({ title: 'Sucesso', description: 'Parcela marcada como paga', variant: 'success' });
      loadData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar', variant: 'destructive' });
    }
  };

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const totals = {
    aReceber: installments.filter(i => i.status !== 'pago').reduce((acc, i) => acc + i.valor_previsto, 0),
    atrasadas: installments.filter(i => i.status === 'atrasado').length,
    pagas: installments.filter(i => i.status === 'pago').length,
  };

  return {
    client,
    responsibilities,
    installments,
    loading,
    showForm,
    setShowForm,
    formData,
    setFormData,
    totals,
    formatCurrency,
    formatDate,
    handleCreateResponsibility,
    handlePayInstallment,
    refresh: loadData,
  };
}