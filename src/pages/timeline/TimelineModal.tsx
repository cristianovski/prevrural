import { useState, useEffect } from "react";
import { X, Calendar, CheckCircle, Briefcase, Trash2, Plus, ArrowRight, Save } from "lucide-react";

// --- A CORREÇÃO ESTÁ AQUI: 'export' antes de interface ---
export interface Periodo {
  id: string;
  tipo: 'rural' | 'urbano';
  descricao: string;
  inicio: string;
  fim: string;
  meses: number;
  bloqueado?: boolean;
}

export interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  vinculos: any[];
  provas: any[];
  dataDer: string;
  dadosSalvos?: Periodo[]; 
  onSave: (periodos: Periodo[]) => Promise<void>; 
}

export function TimelineModal({ isOpen, onClose, vinculos, provas, dataDer, dadosSalvos, onSave }: TimelineModalProps) {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [salvando, setSalvando] = useState(false);
  
  const [docSelecionado, setDocSelecionado] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    if (isOpen) {
      // 1. Carrega Urbanos
      const urbanos: Periodo[] = vinculos.map(v => ({
        id: `urb_${v.id}`, 
        tipo: 'urbano',
        descricao: `🏢 ${v.empresa}`,
        inicio: v.inicio,
        fim: v.fim,
        meses: calcularMeses(v.inicio, v.fim),
        bloqueado: true
      }));

      // 2. Carrega Rurais Salvos
      const ruraisSalvos = dadosSalvos ? dadosSalvos.filter(p => p.tipo === 'rural') : [];
      
      const listaCompleta = [...urbanos, ...ruraisSalvos].sort((a, b) => b.inicio.localeCompare(a.inicio));
      setPeriodos(listaCompleta);
    }
  }, [isOpen, vinculos, dadosSalvos]);

  const calcularMeses = (inicio: string, fim: string) => {
    if (!inicio || !fim) return 0;
    const d1 = new Date(inicio);
    const d2 = new Date(fim);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return Math.floor(diffDays / 30);
  };

  const totalRural = periodos.filter(p => p.tipo === 'rural').reduce((acc, p) => acc + p.meses, 0);
  const meta = 180;
  const progresso = Math.min((totalRural / meta) * 100, 100);

  const handleAddPeriodo = () => {
    if (!dataInicio || !dataFim || !docSelecionado) return alert("Preencha as datas e escolha o documento.");
    const docLabel = provas.find(p => p.id === docSelecionado)?.label || "Documento Manual";

    const novo: Periodo = {
      id: Date.now().toString(),
      tipo: 'rural',
      descricao: `🚜 ${docLabel}`,
      inicio: dataInicio,
      fim: dataFim,
      meses: calcularMeses(dataInicio, dataFim)
    };

    setPeriodos(prev => [...prev, novo].sort((a, b) => b.inicio.localeCompare(a.inicio)));
    setDocSelecionado(""); setDataInicio(""); setDataFim("");
  };

  const removePeriodo = (id: string) => {
    setPeriodos(prev => prev.filter(p => p.id !== id));
  };

  const aoSelecionarDoc = (id: string) => {
    setDocSelecionado(id);
    const doc = provas.find(p => p.id === id);
    if (doc && doc.data) {
        setDataFim(doc.data);
        const d = new Date(doc.data);
        d.setFullYear(d.getFullYear() - 1);
        setDataInicio(d.toISOString().split('T')[0]);
    }
  };

  const handleConcluir = async () => {
      setSalvando(true);
      await onSave(periodos);
      setSalvando(false);
      onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2"><Calendar className="text-emerald-400"/> Montagem da Linha do Tempo</h2>
            <p className="text-xs text-slate-400">DER: {dataDer.split('-').reverse().join('/')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition"><X size={20}/></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            <div className="w-1/3 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto flex flex-col gap-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-600">Carência (Meses)</span>
                        <span className={`text-2xl font-black ${totalRural >= 180 ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {totalRural} <span className="text-sm text-slate-400 font-normal">/ 180</span>
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{width: `${progresso}%`}}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">Faltam {Math.max(0, 180 - totalRural)} meses</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm border-b pb-2">
                        <Plus size={16} className="text-emerald-600"/> Adicionar Período Rural
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="label-mini">1. Escolha a Prova Base</label>
                            <select className="input-mini" value={docSelecionado} onChange={(e) => aoSelecionarDoc(e.target.value)}>
                                <option value="">Selecione um documento...</option>
                                {provas.map(p => (<option key={p.id} value={p.id}>{p.data.split('-')[0]} - {p.label}</option>))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="label-mini">Início</label><input type="date" className="input-mini" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
                            <div><label className="label-mini">Fim</label><input type="date" className="input-mini" value={dataFim} onChange={e => setDataFim(e.target.value)} /></div>
                        </div>
                        <div className="pt-2">
                            <button onClick={handleAddPeriodo} disabled={!docSelecionado || !dataInicio} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-sm shadow flex justify-center items-center gap-2 disabled:opacity-50">
                                <ArrowRight size={16}/> Inserir
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-2/3 bg-slate-100 p-6 overflow-y-auto">
                <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wide">Linha Cronológica</h3>
                {periodos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-300 rounded-xl"><Calendar size={48} className="mb-2 opacity-50"/><p>Nenhum período adicionado.</p></div>
                ) : (
                    <div className="space-y-3 relative">
                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-300 z-0"></div>
                        {periodos.map((p) => (
                            <div key={p.id} className={`relative z-10 flex gap-4 bg-white p-4 rounded-lg shadow-sm border-l-4 ${p.tipo === 'rural' ? 'border-l-emerald-500' : 'border-l-red-400'}`}>
                                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white shadow-sm ${p.tipo === 'rural' ? 'bg-emerald-500' : 'bg-red-400'}`}>
                                    {p.tipo === 'rural' ? <CheckCircle size={16}/> : <Briefcase size={16}/>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{p.descricao}</h4>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{p.inicio.split('-').reverse().join('/')} até {p.fim.split('-').reverse().join('/')}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${p.tipo === 'rural' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{p.meses} Meses</span>
                                            {!p.bloqueado && (<button onClick={() => removePeriodo(p.id)} className="block mt-2 ml-auto text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-sm">Cancelar</button>
            <button onClick={handleConcluir} disabled={salvando} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2">
                {salvando ? "Salvando..." : <><Save size={16}/> Salvar Linha do Tempo</>}
            </button>
        </div>
      </div>
      <style>{` .label-mini { @apply block text-[10px] font-bold text-slate-500 uppercase mb-1; } .input-mini { @apply w-full p-2 border border-slate-300 rounded text-sm outline-none focus:border-emerald-500 transition-colors; } `}</style>
    </div>
  );
}