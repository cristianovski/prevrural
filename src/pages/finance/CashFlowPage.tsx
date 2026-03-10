// src/pages/finance/CashFlowPage.tsx
import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchInstallments, fetchExpenses, createExpense, payExpense } from '../../services/financeService';
import { FinancialExpense, FinancialExpenseInput } from '../../types/finance';
import { useToast } from '../../hooks/use-toast';
import { getLocalDateISO } from '../../lib/utils';

export function CashFlowPage() {
  const navigate = useNavigate();
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
  const [filterMonth, setFilterMonth] = useState(getLocalDateISO().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    loadData();
  }, [filterMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inst, exp] = await Promise.all([
        fetchInstallments(),
        fetchExpenses()
      ]);
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

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Fluxo de Caixa</h1>
      </div>

      {/* Filtro de mês */}
      <div className="mb-6 flex items-center gap-2">
        <Calendar size={18} className="text-slate-400" />
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-slate-300 rounded-lg p-2"
        />
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <TrendingUp size={20} />
            <span className="font-semibold">A Receber (mês)</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalReceber)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <TrendingDown size={20} />
            <span className="font-semibold">A Pagar (mês)</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totalPagar)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <DollarSign size={20} />
            <span className="font-semibold">Saldo Projetado</span>
          </div>
          <p className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatCurrency(saldoProjetado)}
          </p>
        </div>
      </div>

      {/* Botão nova despesa */}
      <button
        onClick={() => setShowExpenseForm(!showExpenseForm)}
        className="mb-6 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
      >
        <Plus size={18} /> Nova Despesa
      </button>

      {showExpenseForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-8">
          <h2 className="font-bold text-lg mb-4">Cadastrar Despesa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição*</label>
              <input
                type="text"
                value={expenseForm.descricao}
                onChange={(e) => setExpenseForm({ ...expenseForm, descricao: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria*</label>
              <select
                value={expenseForm.categoria}
                onChange={(e) => setExpenseForm({ ...expenseForm, categoria: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              >
                <option value="Custas">Custas</option>
                <option value="Salários">Salários</option>
                <option value="Aluguel">Aluguel</option>
                <option value="Marketing">Marketing</option>
                <option value="Impostos">Impostos</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor*</label>
              <input
                type="number"
                step="0.01"
                value={expenseForm.valor}
                onChange={(e) => setExpenseForm({ ...expenseForm, valor: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Vencimento*</label>
              <input
                type="date"
                value={expenseForm.data_vencimento}
                onChange={(e) => setExpenseForm({ ...expenseForm, data_vencimento: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowExpenseForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg">Cancelar</button>
            <button onClick={handleCreateExpense} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Salvar</button>
          </div>
        </div>
      )}

      {/* Tabela de Contas a Receber */}
      <h2 className="text-xl font-bold mb-4">Contas a Receber</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-left">Parcela</th>
              <th className="p-3 text-left">Vencimento</th>
              <th className="p-3 text-left">Valor</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {installments.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Nenhuma conta a receber</td></tr>
            ) : (
              installments.map(inst => (
                <tr key={inst.id} className="border-t border-slate-100">
                  <td className="p-3">{inst.responsibility?.client_id}</td>
                  <td className="p-3">{inst.responsibility?.descricao}</td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tabela de Contas a Pagar */}
      <h2 className="text-xl font-bold mb-4">Contas a Pagar</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-left">Categoria</th>
              <th className="p-3 text-left">Vencimento</th>
              <th className="p-3 text-left">Valor</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">Nenhuma despesa cadastrada</td></tr>
            ) : (
              expenses.map(exp => (
                <tr key={exp.id} className="border-t border-slate-100">
                  <td className="p-3">{exp.descricao}</td>
                  <td className="p-3">{exp.categoria}</td>
                  <td className="p-3">{formatDate(exp.data_vencimento)}</td>
                  <td className="p-3 font-medium">{formatCurrency(exp.valor)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      exp.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {exp.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="p-3">
                    {exp.status !== 'pago' && (
                      <button
                        onClick={() => handlePayExpense(exp.id)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium text-xs"
                      >
                        Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}