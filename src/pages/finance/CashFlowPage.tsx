import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCashFlow } from '../../hooks/useCashFlow';
import { getLocalDateISO } from '../../lib/utils';

export function CashFlowPage() {
  const navigate = useNavigate();
  const {
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
  } = useCashFlow(getLocalDateISO().slice(0, 7));

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

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
            <button onClick={() => setShowExpenseForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg">
              Cancelar
            </button>
            <button onClick={handleCreateExpense} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
              Salvar
            </button>
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
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  Nenhuma conta a receber
                </td>
              </tr>
            ) : (
              installments.map((inst) => (
                <tr key={inst.id} className="border-t border-slate-100">
                  <td className="p-3">{inst.responsibility?.client_id}</td>
                  <td className="p-3">{inst.responsibility?.descricao}</td>
                  <td className="p-3">{inst.numero_parcela || '-'}</td>
                  <td className="p-3">{formatDate(inst.data_vencimento)}</td>
                  <td className="p-3 font-medium">{formatCurrency(inst.valor_previsto)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inst.status === 'pago'
                          ? 'bg-emerald-100 text-emerald-700'
                          : inst.status === 'atrasado'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
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
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  Nenhuma despesa cadastrada
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="border-t border-slate-100">
                  <td className="p-3">{exp.descricao}</td>
                  <td className="p-3">{exp.categoria}</td>
                  <td className="p-3">{formatDate(exp.data_vencimento)}</td>
                  <td className="p-3 font-medium">{formatCurrency(exp.valor)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exp.status === 'pago' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
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