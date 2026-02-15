import { useState, useEffect } from "react";
import { 
  ArrowLeft, Save, Calculator, Plus, Trash2, 
  AlertTriangle, CheckCircle, XCircle, Calendar,
  HelpCircle, Paperclip, Eye, Edit2, Link as LinkIcon, X, Scale
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- LISTA DE DOCUMENTOS (REFERÊNCIA PARA PUXAR LEIS) ---
const DOCUMENT_OPTIONS = [
  { type: "Autodeclaração do Segurado Especial", law: "Lei 8.213/91, Art. 38-B, § 2º; IN 128/2022, Art. 115" },
  { type: "Bloco de Notas do Produtor Rural", law: "Lei 8.213/91, Art. 106, V; IN 128/2022, Art. 116, III" },
  { type: "Carta de Concessão de Benefício Anterior", law: "IN 128/2022, Art. 115 e 116; Portaria 993/2022" },
  { type: "Carteira de Vacinação", law: "IN 128/2022, Art. 116, XXV" },
  { type: "Certidão da FUNAI (Indígena)", law: "IN 128/2022, Art. 116, X; Súmula 657 STJ" },
  { type: "Certidão da Justiça Eleitoral", law: "PUIL 0006786-13.2011.4.01.4300" },
  { type: "Certidão de Casamento/União Estável", law: "IN 128/2022, Art. 116, XI; Súmula 6 TNU" },
  { type: "Certidão de Nascimento/Batismo Filhos", law: "IN 128/2022, Art. 116, XII" },
  { type: "Certidão de Óbito de Familiares", law: "STJ (Jurisprudência em Teses Ed. 94)" },
  { type: "Certificado de Alistamento Militar", law: "IN 128/2022, Art. 116, XVI" },
  { type: "Comprovantes de Recolhimento (GPS)", law: "Lei 8.213/91, Art. 106, VIII" },
  { type: "Contratos Agrários (Arrendamento/Parceria)", law: "Lei 8.213/91, Art. 106, II; IN 128/2022, Art. 116, I" },
  { type: "DAP ou CAF (Pronaf)", law: "Lei 8.213/91, Art. 106, IV; IN 128/2022, Art. 116, II" },
  { type: "Declaração de Imposto de Renda (IRPF)", law: "Lei 8.213/91, Art. 106, IX; IN 128/2022, Art. 116, VII" },
  { type: "Documentos do 'Pater Familiae'", law: "Súmula 73 TRF4; Enunciado 8, V do CRPS" },
  { type: "Documentos Escolares", law: "IN 128/2022, Art. 116, XVII" },
  { type: "Escritura Pública de Imóvel", law: "IN 128/2022, Art. 116, XXI" },
  { type: "Ficha de Atendimento Médico/Odontológico", law: "IN 128/2022, Art. 116, XXXV" },
  { type: "Ficha de Crediário (Comércio/Insumos)", law: "Manual Aposentadoria Rural; IN 128/2022, Art. 116, XXVII" },
  { type: "Ficha de Sindicato / Cooperativa", law: "IN 128/2022, Art. 116, XVIII e XXIX" },
  { type: "ITR ou CCIR", law: "IN 128/2022, Art. 116, IX; Tema 1115 STJ" },
  { type: "Licença de Ocupação / Permissão INCRA", law: "Lei 8.213/91, Art. 106, X; IN 128/2022, Art. 116, VIII" },
  { type: "Notas Fiscais de Entrada", law: "Lei 8.213/91, Art. 106, VI; IN 128/2022, Art. 116, IV" },
  { type: "Prontuário Médico / Ficha Agente Saúde", law: "IN 128/2022, Art. 116, XXIV; TNU PEDILEF" },
  { type: "Publicação na Imprensa", law: "IN 128/2022, Art. 116, XXXI" },
  { type: "Recibo de Compra de Insumos/Implementos", law: "IN 128/2022, Art. 116, XXVII" },
  { type: "Recibo de Vacina (Febre Aftosa)", law: "IN 128/2022, Art. 116, XXVII" },
  { type: "Registro em Livros Religiosos (Sacramentos)", law: "IN 128/2022, Art. 116, XXXII" },
  { type: "Título de Eleitor (Ficha Cadastro)", law: "IN 128/2022, Art. 116, XV" },
  { type: "Outros", law: "Súmula 149 STJ" }
];

interface AnalysisPageProps {
  cliente: any;
  onBack: () => void;
}

// Tipos de Período
type PeriodoType = 'rural' | 'urbano' | 'beneficio' | 'lacuna';

interface Periodo {
  id: string;
  inicio: string;
  fim: string;
  tipo: PeriodoType;
  obs?: string;
  is_safra?: boolean;
  linkedDocId?: string;
  linkedDocTitle?: string;
  law?: string; // Fundamentação Legal
}

export function AnalysisPage({ cliente, onBack }: AnalysisPageProps) {
  const [loading, setLoading] = useState(false);
  
  // Dados da Análise
  const [der, setDer] = useState(new Date().toISOString().split('T')[0]); 
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);

  // Estado de Edição
  const [editingId, setEditingId] = useState<string | null>(null);

  // Formulário
  const [form, setForm] = useState<Partial<Periodo>>({
    tipo: 'rural',
    inicio: "",
    fim: "",
    is_safra: false,
    obs: "",
    linkedDocId: "",
    law: ""
  });

  // Totais
  const [totalRural, setTotalRural] = useState(0);
  const [totalHibrido, setTotalHibrido] = useState(0);

  useEffect(() => {
    if (cliente?.id) loadAllData();
  }, [cliente]);

  useEffect(() => {
    calcularTotais();
  }, [periodos]);

  const loadAllData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('interviews')
      .select('analise_periodos, data_der, timeline_json')
      .eq('client_id', cliente.id)
      .maybeSingle();

    if (data) {
      if (data.analise_periodos) setPeriodos(data.analise_periodos);
      if (data.data_der) setDer(data.data_der);
      
      if (data.timeline_json && Array.isArray(data.timeline_json)) {
        const docsOrdenados = data.timeline_json.sort((a: any, b: any) => (a.year || 0) - (b.year || 0));
        setDocumentos(docsOrdenados);
      }
    }
    setLoading(false);
  };

  const diffMonths = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const months = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()) + 1;
    return months > 0 ? months : 0;
  };

  const diffDays = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  };

  const calcularTotais = () => {
    let rural = 0;
    let urbano = 0;

    periodos.forEach(p => {
        const meses = diffMonths(p.inicio, p.fim);
        if (p.tipo === 'rural') {
            rural += meses;
        } else if (p.tipo === 'urbano') {
            if (p.is_safra) urbano += meses; else urbano += meses;
        } else if (p.tipo === 'beneficio') {
            rural += meses; 
        }
    });

    setTotalRural(rural);
    setTotalHibrido(rural + urbano);
  };

  // --- AÇÃO: VINCULAR DOCUMENTO E PUXAR LEI ---
  const handleLinkDocument = (docId: string) => {
    if (!docId) {
        setForm(prev => ({ ...prev, linkedDocId: "", law: "" }));
        return;
    }
    const doc = documentos.find(d => d.id === docId);
    if (doc) {
        // Tenta pegar a lei do documento salvo OU busca na lista mestra pelo tipo
        const leiEncontrada = doc.law || DOCUMENT_OPTIONS.find(opt => opt.type === doc.type)?.law || "";
        
        setForm(prev => ({
            ...prev,
            linkedDocId: doc.id,
            linkedDocTitle: doc.type,
            law: leiEncontrada, // Aqui está a mágica
            obs: prev.obs ? prev.obs : `Prova: ${doc.type} (${doc.year || 'S/D'})`
        }));
    }
  };

  const handleSavePeriod = () => {
    if (!form.inicio || !form.fim) return alert("Preencha as datas");

    let isSafra = false;
    if (form.tipo === 'urbano') {
        const dias = diffDays(form.inicio, form.fim);
        if (dias <= 120) isSafra = true;
    }

    const item: Periodo = {
        id: editingId || Math.random().toString(36).substr(2, 9),
        inicio: form.inicio!,
        fim: form.fim!,
        tipo: form.tipo as PeriodoType,
        obs: form.obs,
        is_safra: isSafra,
        linkedDocId: form.linkedDocId,
        linkedDocTitle: form.linkedDocTitle,
        law: form.law
    };

    if (editingId) {
        setPeriodos(prev => prev.map(p => p.id === editingId ? item : p).sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()));
        setEditingId(null);
    } else {
        setPeriodos(prev => [...prev, item].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()));
    }

    setForm({ tipo: 'rural', inicio: "", fim: "", obs: "", is_safra: false, linkedDocId: "", law: "" });
  };

  const handleEditClick = (p: Periodo) => {
    setEditingId(p.id);
    setForm(p);
    document.getElementById('form-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ tipo: 'rural', inicio: "", fim: "", obs: "", is_safra: false, linkedDocId: "", law: "" });
  };

  const handleRemovePeriod = (id: string) => {
    if (confirm("Remover este período?")) {
        setPeriodos(prev => prev.filter(p => p.id !== id));
        if (editingId === id) handleCancelEdit();
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        const { error } = await supabase.from('interviews').upsert({
            client_id: cliente.id,
            analise_periodos: periodos,
            data_der: der,
            updated_at: new Date()
        }, { onConflict: 'client_id' });

        if (error) throw error;
        alert("Análise salva!");
    } catch (err: any) {
        alert("Erro: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* HEADER */}
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
                <ArrowLeft className="text-slate-600"/>
            </button>
            <div>
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calculator className="text-amber-600"/> Calculadora Estratégica
                </h1>
                <p className="text-xs text-slate-500">Analise a carência e fundamente com provas</p>
            </div>
        </div>
        <button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2 disabled:opacity-50">
            {loading ? "Salvando..." : <><Save size={16}/> Salvar Análise</>}
        </button>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* --- ESQUERDA: CALCULADORA (SCROLLÁVEL) --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* PLACAR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <label className="text-xs font-bold text-slate-500 mb-1">Data do Requerimento (DER)</label>
                    <input type="date" value={der} onChange={e => setDer(e.target.value)} className="w-full p-2 border rounded font-mono text-lg text-slate-700 bg-slate-50 focus:bg-white transition"/>
                </div>
                <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-center ${totalRural >= 180 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-500">Tempo Rural (Puro)</span>
                        {totalRural >= 180 && <CheckCircle size={16} className="text-emerald-600"/>}
                    </div>
                    <div className="text-3xl font-bold text-slate-800">
                        {totalRural} <span className="text-sm font-normal text-slate-500">/ 180 meses</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.min((totalRural/180)*100, 100)}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-500 mb-1">Tempo Total (Híbrido)</span>
                    <div className="text-3xl font-bold text-slate-800">
                        {totalHibrido} <span className="text-sm font-normal text-slate-500">meses</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Soma Rural + Urbano</p>
                </div>
            </div>

            {/* FORMULÁRIO */}
            <div id="form-anchor" className={`p-6 rounded-2xl border shadow-sm transition-colors ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-bold flex items-center gap-2 ${editingId ? 'text-amber-700' : 'text-slate-700'}`}>
                        {editingId ? <Edit2 size={18}/> : <Plus size={18}/>} 
                        {editingId ? "Editando Período" : "Adicionar Período"}
                    </h3>
                    {editingId && (
                        <button onClick={handleCancelEdit} className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 px-3 py-1 rounded border border-slate-300 bg-white">
                            <X size={12}/> Cancelar Edição
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Tipo</label>
                        <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value as PeriodoType})} className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-amber-500 text-sm">
                            <option value="rural">🌾 Atividade Rural</option>
                            <option value="urbano">🏭 Urbano / CNIS</option>
                            <option value="beneficio">🏥 Benefício INSS</option>
                            <option value="lacuna">🕊️ Sem Atividade</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Início</label>
                        <input type="date" value={form.inicio} onChange={e => setForm({...form, inicio: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm"/>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Fim</label>
                        <input type="date" value={form.fim} onChange={e => setForm({...form, fim: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm"/>
                    </div>
                    
                    {/* SELEÇÃO DE DOCUMENTO */}
                    <div className="md:col-span-5">
                         <label className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1"><LinkIcon size={12}/> Vincular Prova (Opcional)</label>
                         <select 
                            value={form.linkedDocId || ""} 
                            onChange={(e) => handleLinkDocument(e.target.value)}
                            className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-amber-500 text-sm"
                        >
                            <option value="">-- Selecione um documento --</option>
                            {documentos.map((doc: any) => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.type} ({doc.year || 'S/D'})
                                </option>
                            ))}
                         </select>
                    </div>

                    <div className="md:col-span-9">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Observação / Justificativa</label>
                        <input type="text" placeholder="Ex: Safra de milho, Sítio do Pai..." value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm"/>
                    </div>
                    
                    <div className="md:col-span-3">
                        <button onClick={handleSavePeriod} className={`w-full text-white p-2.5 rounded-lg font-bold text-sm transition flex justify-center gap-2 ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-800 hover:bg-slate-700'}`}>
                            {editingId ? <><Save size={16}/> Salvar Alteração</> : <><Plus size={16}/> Inserir</>}
                        </button>
                    </div>
                </div>

                {/* Exibir Lei Vinculada no Formulário */}
                {form.law && (
                    <div className="mt-3 bg-blue-50 p-2 rounded border border-blue-100 text-xs text-blue-800 flex items-center gap-2 animate-in fade-in">
                        <CheckCircle size={14} className="shrink-0"/>
                        <span><strong>Fundamentação Vinculada:</strong> {form.law}</span>
                    </div>
                )}
            </div>

            {/* LISTA CRONOLÓGICA */}
            <div className="space-y-3">
                {periodos.map((p, idx) => {
                    const meses = diffMonths(p.inicio, p.fim);
                    const dias = diffDays(p.inicio, p.fim);
                    
                    let bgColor = "bg-white";
                    let borderColor = "border-slate-200";
                    let icon = <Calendar size={18} className="text-slate-400"/>;
                    let statusText = "";

                    if (p.tipo === 'rural') {
                        bgColor = "bg-emerald-50";
                        borderColor = "border-emerald-200";
                        icon = <CheckCircle size={18} className="text-emerald-600"/>;
                        statusText = "Conta como Carência";
                    } 
                    else if (p.tipo === 'urbano') {
                        if (p.is_safra) {
                            bgColor = "bg-yellow-50";
                            borderColor = "border-yellow-200";
                            icon = <AlertTriangle size={18} className="text-yellow-600"/>;
                            statusText = `Safra (${dias} dias) - Não perde qualidade`;
                        } else {
                            bgColor = "bg-red-50";
                            borderColor = "border-red-200";
                            icon = <XCircle size={18} className="text-red-600"/>;
                            statusText = "Interrupção (>120 dias)";
                        }
                    }
                    else if (p.tipo === 'beneficio') {
                        bgColor = "bg-blue-50";
                        borderColor = "border-blue-200";
                        icon = <HelpCircle size={18} className="text-blue-600"/>;
                        statusText = "Benefício Intercalado (Conta Carência)";
                    }

                    const prevPeriod = periodos[idx - 1];
                    const needsProof = p.tipo === 'rural' && prevPeriod && prevPeriod.tipo === 'urbano' && !prevPeriod.is_safra;

                    return (
                        <div key={p.id} className={`p-4 rounded-xl border ${bgColor} ${borderColor} shadow-sm transition-all hover:shadow-md relative group`}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">{icon}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 uppercase text-sm tracking-wide">{p.tipo}</h4>
                                            <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">{meses} meses</span>
                                        </div>
                                        <p className="text-sm text-slate-700 font-medium mt-1">
                                            {new Date(p.inicio).toLocaleDateString('pt-BR')} até {new Date(p.fim).toLocaleDateString('pt-BR')}
                                        </p>
                                        
                                        <p className="text-xs text-slate-500 italic mt-1">{p.obs || "Sem observações"}</p>
                                        
                                        {/* Vínculo de Prova + LEI VISÍVEL */}
                                        {p.linkedDocTitle && (
                                            <div className="flex flex-col gap-1 mt-2">
                                                <div className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                                                    <LinkIcon size={10}/> Prova: {p.linkedDocTitle}
                                                </div>
                                                {/* Exibição da Lei no Card */}
                                                {p.law && (
                                                    <div className="text-[10px] text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-start gap-1">
                                                        <Scale size={10} className="mt-0.5 shrink-0"/>
                                                        <span className="leading-tight">{p.law}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-2 text-xs font-bold opacity-80">{statusText}</div>
                                        
                                        {needsProof && (
                                            <div className="mt-3 bg-white p-2 rounded border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-pulse">
                                                <AlertTriangle size={14}/>
                                                <strong>Atenção:</strong> Necessário documento ratificador aqui!
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEditClick(p)} className="text-slate-400 hover:text-amber-500 p-2 rounded hover:bg-amber-50 transition" title="Editar">
                                        <Edit2 size={18}/>
                                    </button>
                                    <button onClick={() => handleRemovePeriod(p.id)} className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition" title="Remover">
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {periodos.length === 0 && (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        Comece adicionando o primeiro período de trabalho.
                    </div>
                )}
            </div>
        </div>

        {/* --- DIREITA: PAINEL DE DOCUMENTOS (REFERÊNCIA) --- */}
        <div className="w-full md:w-80 bg-slate-100 border-l border-slate-200 p-4 overflow-y-auto hidden md:block">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Paperclip size={14}/> Documentos Disponíveis
            </h3>
            
            {documentos.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                    Nenhum documento anexado na entrevista.
                </div>
            ) : (
                <div className="space-y-3">
                    {documentos.map((doc: any, i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    {doc.year || 'S/D'}
                                </span>
                                {doc.fileUrl && (
                                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                                        <Eye size={14}/>
                                    </a>
                                )}
                            </div>
                            <p className="text-xs font-bold text-slate-700 leading-tight mb-1">{doc.type}</p>
                            {doc.customName && <p className="text-[10px] text-slate-500 italic truncate">{doc.customName}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>

      </main>
    </div>
  );
}

export default AnalysisPage;