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
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const diffMonths = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const months = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()) + 1;
    return months > 0 ? months : 0;
  };

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <label className="text-xs font-bold text-slate-500 mb-1">Data do Requerimento (DER)</label>
              <input
                type="date"
                value={der}
                onChange={(e) => setDer(e.target.value)}
                className="w-full p-2 border rounded font-mono text-lg text-slate-700 bg-slate-50 focus:bg-white transition"
              />
            </div>
            <div
              className={`p-4 rounded-xl border shadow-sm flex flex-col justify-center ${
                totalRural >= 180 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-500">Tempo Rural</span>
                {totalRural >= 180 && <CheckCircle size={16} className="text-emerald-600" />}
              </div>
              <div className="text-3xl font-bold text-slate-800">
                {totalRural} <span className="text-sm font-normal text-slate-500">/ 180 meses</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min((totalRural / 180) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-500 mb-1">Total Híbrido</span>
              <div className="text-3xl font-bold text-slate-800">
                {totalHibrido} <span className="text-sm font-normal text-slate-500">meses</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Soma Rural + Urbano</p>
            </div>
          </div>

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
          <div
            id="form-anchor"
            className={`p-6 rounded-2xl border shadow-sm transition-colors ${
              editingId ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold flex items-center gap-2 ${editingId ? 'text-amber-700' : 'text-slate-700'}`}>
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />} {editingId ? 'Editando Período' : 'Adicionar Período'}
              </h3>
              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 px-3 py-1 rounded border border-slate-300 bg-white"
                >
                  <X size={12} /> Cancelar Edição
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-slate-500 block mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
                  className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-amber-500 text-sm"
                >
                  <option value="rural">🌾 Atividade Rural</option>
                  <option value="urbano">🏭 Urbano / CNIS</option>
                  <option value="beneficio">🏥 Benefício INSS</option>
                  <option value="lacuna">🕊️ Sem Atividade</option>
                  <option value="prova de retorno">📄 Prova de Retorno</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1">Início</label>
                <input
                  type="date"
                  value={form.inicio}
                  onChange={(e) => setForm({ ...form, inicio: e.target.value })}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1">Fim</label>
                <input
                  type="date"
                  value={form.fim}
                  onChange={(e) => setForm({ ...form, fim: e.target.value })}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <div className="md:col-span-9">
                <label className="text-xs font-bold text-slate-500 block mb-1">Observação / Justificativa</label>
                <input
                  type="text"
                  placeholder="Ex: Safra de milho, Sítio do Pai..."
                  value={form.obs}
                  onChange={(e) => setForm({ ...form, obs: e.target.value })}
                  className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm"
                />
              </div>
              <div className="md:col-span-3">
                <button
                  onClick={onSavePeriod}
                  className={`w-full text-white p-2.5 rounded-lg font-bold text-sm transition flex justify-center gap-2 ${
                    editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  {editingId ? (
                    <>
                      <Save size={16} /> Salvar Alteração
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Inserir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Lista de períodos */}
          <div className="space-y-3">
            {periodos.map((p) => {
              const meses = diffMonths(p.inicio, p.fim);
              let bgColor = 'bg-white',
                borderColor = 'border-slate-200',
                icon = <Calendar size={18} className="text-slate-400" />,
                statusText = '';
              if (p.tipo === 'rural') {
                bgColor = 'bg-emerald-50';
                borderColor = 'border-emerald-200';
                icon = <CheckCircle size={18} className="text-emerald-600" />;
                statusText = 'Conta como Carência';
              } else if (p.tipo === 'urbano') {
                bgColor = 'bg-red-50';
                borderColor = 'border-red-200';
                icon = <XCircle size={18} className="text-red-600" />;
                statusText = 'Interrupção (>120 dias)';
              } else if (p.tipo === 'beneficio') {
                bgColor = 'bg-blue-50';
                borderColor = 'border-blue-200';
                icon = <HelpCircle size={18} className="text-blue-600" />;
                statusText = 'Benefício Intercalado (Conta Carência)';
              } else if (p.tipo === 'prova de retorno') {
                bgColor = 'bg-purple-50';
                borderColor = 'border-purple-200';
                icon = <Paperclip size={18} className="text-purple-600" />;
                statusText = 'Prova de Retorno';
              }
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border ${bgColor} ${borderColor} shadow-sm transition-all hover:shadow-md relative group`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 uppercase text-sm tracking-wide">{p.tipo}</h4>
                          <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {meses} meses
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium mt-1">
                          {fmtDate(p.inicio)} até {fmtDate(p.fim)}
                        </p>
                        <p className="text-xs text-slate-500 italic mt-1">{p.obs || 'Sem observações'}</p>
                        <div className="mt-2 text-xs font-bold opacity-80">{statusText}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditClick(p)}
                        className="text-slate-400 hover:text-amber-500 p-2 rounded hover:bg-amber-50 transition"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleRemovePeriod(p.id)}
                        className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barra lateral de documentos */}
        <div className="w-full md:w-80 bg-slate-100 border-l border-slate-200 p-4 overflow-y-auto hidden md:block">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Paperclip size={14} /> Documentos de Prova
          </h3>
          {documentos.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">Nenhum documento da categoria "Provas" encontrado.</div>
          ) : (
            <div className="space-y-3">
              {documentos.map((doc, i) => {
                let dataFormatada = '';
                if (doc.issueDate && doc.issueDate !== 'S/D') {
                  const [ano, mes, dia] = doc.issueDate.split('T')[0].split('-');
                  dataFormatada = `${dia}/${mes}/${ano}`;
                } else {
                  dataFormatada = 'S/D';
                }
                return (
                  <div
                    key={`${doc.id}-${i}`}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {dataFormatada}
                      </span>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                          <Eye size={14} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-700 leading-tight mb-1">{doc.type}</p>
                    <div className="flex items-center gap-1">
                      <FileText size={10} className="text-slate-400" />
                      <span className="text-[9px] text-slate-400">{doc.origem}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}