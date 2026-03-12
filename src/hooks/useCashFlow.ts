import { useState, useEffect } from 'react';
import { fetchInstallments, fetchExpenses, createExpense, payExpense } from '../services/financeService';
import { FinancialExpense, FinancialExpenseInput } from '../types/finance';
import { useToast } from './use-toast';
import { getLocalDateISO } from '../lib/utils';

export function useCashFlow(initialMonth: string) {
  const { toast } = useToast();
  const [installments, setInstallments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<FinancialExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState<Partial<FinancialExpenseInput>>({
    descricao: '',
    categoria: 'Custas',
    valor: 0,
    data_vencimento: getLocalDateISO(),
    status: 'pendente'
  });
  const [filterMonth, setFilterMonth] = useState(initialMonth);

  useEffect(() => {
    loadData();
  }, [filterMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inst, exp] = await Promise.all([fetchInstallments(), fetchExpenses()]);
      const [year, month] = filterMonth.split('-').map(Number);
      const filteredInst = inst.filter(i => {
        const d = new Date(i.data_vencimento);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      const filteredExp = exp.filter(e => {
        const d = new Date(e.data_vencimento);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      setInstallments(filteredInst);
      setExpenses(filteredExp);
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalReceber = installments.filter(i => i.status !== 'pago').reduce((acc, i) => acc + i.valor_previsto, 0);
  const totalPagar = expenses.filter(e => e.status !== 'pago').reduce((acc, e) => acc + e.valor, 0);
  const saldoProjetado = totalReceber - totalPagar;

  const handleCreateExpense = async () => {
    if (!expenseForm.descricao || !expenseForm.valor || !expenseForm.data_vencimento) {
      toast({ title: 'Atenção', description: 'Preencha descrição, valor e data', variant: 'destructive' });
      return;
    }
    try {
      await createExpense(expenseForm as FinancialExpenseInput);
      toast({ title: 'Sucesso', description: 'Despesa cadastrada', variant: 'success' });
      setShowExpenseForm(false);
      setExpenseForm({ descricao: '', categoria: 'Custas', valor: 0, data_vencimento: getLocalDateISO(), status: 'pendente' });
      loadData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar', variant: 'destructive' });
    }
  };

  const handlePayExpense = async (id: number) => {
    try {
      await payExpense(id, getLocalDateISO());
      toast({ title: 'Sucesso', description: 'Despesa marcada como paga', variant: 'success' });
      loadData();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao atualizar', variant: 'destructive' });
    }
  };

  return {
    loading,
    installments,
    expenses,
    filterMonth,
    setFilterMonth,
    showExpenseForm,
    setShowExpenseForm,
    expenseForm,
    setExpenseForm,
    totalReceber,
    totalPagar,
    saldoProjetado,
    handleCreateExpense,
    handlePayExpense,
    refresh: loadData,
  };
}