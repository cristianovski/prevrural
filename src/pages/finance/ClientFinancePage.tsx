// src/pages/finance/ClientFinancePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, Calendar, CheckCircle, AlertCircle, Eye, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/use-toast';
import { Client } from '../../types';
import {
  fetchResponsibilities,
  fetchInstallments,
  createResponsibility,
  payInstallment
} from '../../services/financeService';
import { FinancialResponsibility, FinancialInstallment } from '../../types/finance';
import { getLocalDateISO } from '../../lib/utils';

export function ClientFinancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: clientData } = await supabase.from('clients').select('*').eq('id', id).single();
      setClient(clientData);

      const respList = await fetchResponsibilities(Number(id));
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
        client_id: Number(id),
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

        for (let i = 1; i <= numParcelas; i++) {
          const vencimento = new Date(dataInicio);
          vencimento.setMonth(vencimento.getMonth() + i - 1);
          await supabase.from('financial_installments').insert({
            responsibility_id: novaResp.id,
            numero_parcela: i,
            valor_previsto: valorParcela,
            data_vencimento: vencimento.toISOString().split('T')[0],
            status: 'pendente'
          });
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

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!client) return <div className="p-8 text-center">Cliente não encontrado</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(`/cliente/${id}`)} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Financeiro - {client.nome}</h1>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <DollarSign size={20} />
            <span className="font-semibold">Total a Receber</span>
          </div>
          <p className="text-2xl font-bold">
            {formatCurrency(installments.filter(i => i.status !== 'pago').reduce((acc, i) => acc + i.valor_previsto, 0))}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertCircle size={20} />
            <span className="font-semibold">Parcelas em Atraso</span>
          </div>
          <p className="text-2xl font-bold">
            {installments.filter(i => i.status === 'atrasado').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <CheckCircle size={20} />
            <span className="font-semibold">Parcelas Pagas</span>
          </div>
          <p className="text-2xl font-bold">
            {installments.filter(i => i.status === 'pago').length}
          </p>
        </div>
      </div>

      {/* Botão nova obrigação */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
      >
        <Plus size={18} /> Nova Obrigação
      </button>

      {/* Formulário nova obrigação */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-8">
          <h2 className="font-bold text-lg mb-4">Cadastrar Obrigação Financeira</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição*</label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
                placeholder="Ex: Honorários advocatícios"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor Total*</label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo*</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className="w-full border border-slate-300 rounded-lg p-2"
              >
                <option value="parcelado_fixo">Parcelado Fixo</option>
                <option value="exito">Êxito (único)</option>
                <option value="ambos">Parcelado + Êxito</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de Parcelas</label>
              <input
                type="number"
                value={formData.numero_parcelas}
                onChange={(e) => setFormData({ ...formData, numero_parcelas: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
                disabled={formData.tipo === 'exito'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Início*</label>
              <input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg">Cancelar</button>
            <button onClick={handleCreateResponsibility} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Salvar</button>
          </div>
        </div>
      )}

      {/* Lista de obrigações e parcelas */}
      {responsibilities.length === 0 ? (
        <p className="text-center text-slate-500 py-8">Nenhuma obrigação financeira cadastrada.</p>
      ) : (
        <div className="space-y-6">
          {responsibilities.map(resp => (
            <div key={resp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b">
                <h3 className="font-bold text-slate-800">{resp.descricao}</h3>
                <p className="text-sm text-slate-600">Total: {formatCurrency(resp.valor_total)} | Início: {formatDate(resp.data_inicio)}</p>
                {resp.observacoes && <p className="text-xs text-slate-500 mt-1">{resp.observacoes}</p>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-3 text-left">Parcela</th>
                      <th className="p-3 text-left">Vencimento</th>
                      <th className="p-3 text-left">Valor</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Pagamento</th>
                      <th className="p-3 text-left">Comprovante</th>
                      <th className="p-3 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments
                      .filter(i => i.responsibility_id === resp.id)
                      .map(inst => (
                        <tr key={inst.id} className="border-t border-slate-100">
                          <td className="p-3">{inst.numero_parcela || '-'}</td>
                          <td className="p-3">{formatDate(inst.data_vencimento)}</td>
                          <td className="p-3 font-medium">{formatCurrency(inst.valor_previsto)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              inst.status === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                              inst.status === 'atrasado' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {inst.status === 'pago' ? 'Pago' : inst.status === 'atrasado' ? 'Atrasado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="p-3">
                            {inst.data_pagamento ? formatDate(inst.data_pagamento) : '-'}
                          </td>
                          <td className="p-3">
                            {inst.comprovante_id ? (
                              <button className="text-blue-600 hover:text-blue-800">
                                <Eye size={16} />
                              </button>
                            ) : (
                              <button className="text-slate-400 hover:text-slate-600" title="Anexar comprovante">
                                <Upload size={16} />
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            {inst.status !== 'pago' && (
                              <button
                                onClick={() => handlePayInstallment(inst)}
                                className="text-emerald-600 hover:text-emerald-800 font-medium text-xs"
                              >
                                Marcar pago
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}