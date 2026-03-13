import { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Calculator,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  HelpCircle,
  Paperclip,
  Eye,
  Edit2,
  X,
  ChevronDown,
  Activity,
  Heart,
  FileText,
} from 'lucide-react';
import { useBenefitAnalysis, Periodo } from '../../hooks/useBenefitAnalysis';
import { Client } from '../../types';
import { getLocalDateISO } from '../../lib/utils';
import { ResultCard } from '../../components/analysis/ResultCard';
import { PeriodForm } from '../../components/analysis/PeriodForm';
import { PeriodList } from '../../components/analysis/PeriodList';
import { SidebarDocuments } from '../../components/analysis/SidebarDocuments';

const BENEFIT_TYPES = [
  'Aposentadoria por Idade Rural',
  'Salário Maternidade Rural',
  'Aposentadoria Híbrida',
  'Auxílio por incapacidade temporária',
  'Auxílio por incapacidade permanente',
  'Pensão por morte',
];

interface AnalysisPageProps {
  cliente: Client;
  onBack: () => void;
}

export function AnalysisPage({ cliente, onBack }: AnalysisPageProps) {
  const {
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
  } = useBenefitAnalysis(cliente);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Periodo>>({
    tipo: 'rural',
    inicio: '',
    fim: '',
    obs: '',
    linkedDocId: '',
    law: '',
  });

  const handleEditClick = (p: Periodo) => {
    setEditingId(p.id);
    setForm(p);
    document.getElementById('form-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ tipo: 'rural', inicio: '', fim: '', obs: '', linkedDocId: '', law: '' });
  };

  const onSavePeriod = () => {
    handleSavePeriod(form, editingId);
    if (!editingId) {
      setForm({ tipo: 'rural', inicio: '', fim: '', obs: '', linkedDocId: '', law: '' });
    } else {
      setEditingId(null);
      setForm({ tipo: 'rural', inicio: '', fim: '', obs: '', linkedDocId: '', law: '' });
    }
  };

  const showDII = selectedBenefit.toLowerCase().includes('incapacidade');
  const showPensao = selectedBenefit.toLowerCase().includes('pensão');

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b p-4 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-10 shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
            <ArrowLeft className="text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calculator className="text-amber-600" /> Calculadora Estratégica
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{cliente.nome}</span>
              <span className="text-slate-300">|</span>
              <div className="relative group">
                <select
                  value={selectedBenefit}
                  onChange={(e) => setSelectedBenefit(e.target.value)}
                  className="appearance-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold py-1 pl-2 pr-8 rounded cursor-pointer outline-none border border-emerald-200 transition-colors"
                >
                  {BENEFIT_TYPES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1.5 text-emerald-600 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2 disabled:opacity-50 w-full md:w-auto justify-center"
        >
          {loading ? 'Salvando...' : (
            <>
              <Save size={16} /> Salvar Análise
            </>
          )}
        </button>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cards de totais */}
          <ResultCard
            der={der}
            setDer={setDer}
            totalRural={totalRural}
            totalHibrido={totalHibrido}
          />

          {/* Parâmetros específicos */}
          {(showDII || showPensao) && (
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-sm">
                {showDII ? <Activity size={16} /> : <Heart size={16} />} Parâmetros Específicos: {selectedBenefit}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {showDII && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-blue-700/70 mb-1 block">Data Início Incapacidade (DII)</label>
                      <input
                        type="date"
                        value={extraParams.data_dii}
                        onChange={(e) => setExtraParams({ ...extraParams, data_dii: e.target.value })}
                        className="w-full p-2 border border-blue-200 rounded-lg bg-white text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-blue-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={extraParams.is_acidente}
                          onChange={(e) => setExtraParams({ ...extraParams, is_acidente: e.target.checked })}
                          className="w-5 h-5 accent-blue-600"
                        />{' '}
                        Acidente / Doença Grave?
                      </label>
                    </div>
                  </>
                )}
                {showPensao && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-blue-700/70 mb-1 block">Data do Óbito</label>
                      <input
                        type="date"
                        value={extraParams.data_obito}
                        onChange={(e) => setExtraParams({ ...extraParams, data_obito: e.target.value })}
                        className="w-full p-2 border border-blue-200 rounded-lg bg-white text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-blue-700/70 mb-1 block">Data Casamento/União</label>
                      <input
                        type="date"
                        value={extraParams.data_casamento}
                        onChange={(e) => setExtraParams({ ...extraParams, data_casamento: e.target.value })}
                        className="w-full p-2 border border-blue-200 rounded-lg bg-white text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-blue-700/70 mb-1 block">Idade Cônjuge (no Óbito)</label>
                      <input
                        type="number"
                        value={extraParams.idade_conjuge_obito}
                        onChange={(e) => setExtraParams({ ...extraParams, idade_conjuge_obito: Number(e.target.value) })}
                        className="w-full p-2 border border-blue-200 rounded-lg bg-white text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Resultado da análise jurídica */}
          {analiseJuridica && (
            <div
              className={`p-5 rounded-2xl border shadow-sm transition-all animate-in zoom-in-95 ${
                analiseJuridica.status === 'aprovado'
                  ? 'bg-emerald-50 border-emerald-200'
                  : analiseJuridica.status === 'rejeitado'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-full ${
                    analiseJuridica.status === 'aprovado'
                      ? 'bg-emerald-100 text-emerald-600'
                      : analiseJuridica.status === 'rejeitado'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {analiseJuridica.status === 'aprovado' ? (
                    <CheckCircle size={24} />
                  ) : analiseJuridica.status === 'rejeitado' ? (
                    <XCircle size={24} />
                  ) : (
                    <AlertTriangle size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-bold text-lg mb-2 capitalize ${
                      analiseJuridica.status === 'aprovado'
                        ? 'text-emerald-800'
                        : analiseJuridica.status === 'rejeitado'
                        ? 'text-red-800'
                        : 'text-amber-800'
                    }`}
                  >
                    {analiseJuridica.status === 'aprovado'
                      ? 'Viável Juridicamente'
                      : analiseJuridica.status === 'rejeitado'
                      ? 'Inviável (Requisitos não cumpridos)'
                      : 'Atenção: Risco Moderado'}
                  </h3>
                  <ul className="space-y-1">
                    {analiseJuridica.messages.map((msg, idx) => (
                      <li key={idx} className="text-sm font-medium opacity-90 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0"></span>
                        {msg}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Formulário de adicionar/editar período */}
          <PeriodForm
            form={form}
            setForm={setForm}
            editingId={editingId}
            onCancelEdit={handleCancelEdit}
            onSavePeriod={onSavePeriod}
          />

          {/* Lista de períodos */}
          <PeriodList
            periodos={periodos}
            onEditClick={handleEditClick}
            onRemoveClick={handleRemovePeriod}
          />
        </div>

        {/* Barra lateral de documentos */}
        <SidebarDocuments documentos={documentos} />
      </main>
    </div>
  );
}