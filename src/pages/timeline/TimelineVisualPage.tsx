import { useState, useEffect } from "react";
import { 
  ArrowLeft, Calendar, Printer, Scale, 
  Plus, Trash2, Wand2, Save, ExternalLink, Eye,
  Lock, LockOpen, ArrowRight, ArrowLeft as ArrowLeftIcon
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- BASE DE DADOS JURÍDICA ---
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

interface TimelineVisualPageProps {
  cliente: any;
  onBack: () => void;
}

export function TimelineVisualPage({ cliente, onBack }: TimelineVisualPageProps) {
  const [loading, setLoading] = useState(true);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  
  // --- ESTADO DO GRÁFICO MANUAL ---
  const [derDate, setDerDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedItems, setSelectedItems] = useState<any[]>([]); 

  // --- ESCALA DO GRÁFICO ---
  const [minDate, setMinDate] = useState<Date>(new Date());
  const [maxDate, setMaxDate] = useState<Date>(new Date());
  const [totalMesesRange, setTotalMesesRange] = useState(1);
  const [totalMesesCount, setTotalMesesCount] = useState(0); 

  useEffect(() => {
    if (cliente?.id) {
        loadDocs();
        loadSavedChart();
    }
  }, [cliente]);

  useEffect(() => {
    calculateScale();
    calculateTotalMonths();
  }, [selectedItems, derDate]);

  const loadDocs = async () => {
    const { data } = await supabase
      .from('interviews')
      .select('timeline_json')
      .eq('client_id', cliente.id)
      .maybeSingle();

    if (data && Array.isArray(data.timeline_json)) {
        setAvailableDocs(data.timeline_json);
    }
  };

  const loadSavedChart = async () => {
    const { data } = await supabase
        .from('interviews')
        .select('visual_chart_data')
        .eq('client_id', cliente.id)
        .maybeSingle();

    if (data?.visual_chart_data) {
        setDerDate(data.visual_chart_data.der || new Date().toISOString().split('T')[0]);
        setSelectedItems(data.visual_chart_data.items || []);
    }
    setLoading(false);
  };

  const calculateScale = () => {
    if (selectedItems.length === 0) {
        const end = new Date(derDate);
        const start = new Date(end.getFullYear() - 10, 0, 1);
        setMinDate(start);
        setMaxDate(end);
        setTotalMesesRange(120);
        return;
    }

    let minTs = new Date(derDate).getTime();
    selectedItems.forEach(item => {
        if (item.periodoInicio) {
            const ts = new Date(item.periodoInicio).getTime();
            if (ts < minTs) minTs = ts;
        }
    });

    const start = new Date(minTs);
    const safeStart = new Date(start.getFullYear() - 1, 0, 1);
    
    const end = new Date(derDate);
    const safeEnd = new Date(end.getFullYear() + 1, 11, 31);

    setMinDate(safeStart);
    setMaxDate(safeEnd);

    const totalMonths = (safeEnd.getFullYear() - safeStart.getFullYear()) * 12 + (safeEnd.getMonth() - safeStart.getMonth());
    setTotalMesesRange(totalMonths || 1);
  };

  const calculateTotalMonths = () => {
    const total = selectedItems.reduce((acc, item) => {
        return acc + getDurationMonths(item.periodoInicio, item.periodoFim);
    }, 0);
    setTotalMesesCount(total);
  };

  const handleAddItem = (docBase: any) => {
    const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        nome: docBase.type, 
        tipo: 'Rural', 
        fundamento: getLegalBasis(docBase.type), 
        dataExpedicao: `${docBase.year}-01-01`, 
        periodoInicio: `${docBase.year}-01-01`,
        periodoFim: `${docBase.year}-12-31`,
        fileUrl: docBase.fileUrl,
        anchor: 'start' // 'start' (trava inicio) ou 'end' (trava fim)
    };
    setSelectedItems([...selectedItems, newItem]);
  };

  const handleRemoveItem = (idx: number) => {
    const newItems = [...selectedItems];
    newItems.splice(idx, 1);
    setSelectedItems(newItems);
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setSelectedItems(newItems);
  };

  // --- NOVA LÓGICA DE TRAVA E CÁLCULO ---
  const toggleAnchor = (idx: number, newAnchor: 'start' | 'end') => {
      updateItem(idx, 'anchor', newAnchor);
  };

  const applyMagicPeriod = (idx: number) => {
    const item = selectedItems[idx];
    const anchor = item.anchor || 'start'; // Padrão é travar início

    if (anchor === 'start') {
        // Trava INÍCIO -> Calcula FIM (Início + 90 meses)
        if (!item.periodoInicio) return alert("Defina a Data de Início primeiro.");
        const start = new Date(item.periodoInicio);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 90);
        updateItem(idx, 'periodoFim', end.toISOString().split('T')[0]);
    } else {
        // Trava FIM -> Calcula INÍCIO (Fim - 90 meses)
        if (!item.periodoFim) return alert("Defina a Data Final primeiro.");
        const end = new Date(item.periodoFim);
        const start = new Date(end);
        start.setMonth(start.getMonth() - 90);
        updateItem(idx, 'periodoInicio', start.toISOString().split('T')[0]);
    }
  };

  const saveChart = async () => {
    const payload = {
        der: derDate,
        items: selectedItems
    };
    
    await supabase.from('interviews').update({
        visual_chart_data: payload
    }).eq('client_id', cliente.id);
    
    alert("Gráfico salvo com sucesso!");
  };

  const getLegalBasis = (tipo: string) => {
    const exact = DOCUMENT_OPTIONS.find(d => d.type === tipo);
    return exact ? exact.law : "Lei 8.213/91";
  };

  const getPosition = (inicio: string, fim: string) => {
    if (!inicio || !fim) return { left: '0%', width: '0%' };
    const dInicio = new Date(inicio);
    const dFim = new Date(fim);
    
    const mesesDoInicioAtePeriodo = (dInicio.getFullYear() - minDate.getFullYear()) * 12 + (dInicio.getMonth() - minDate.getMonth());
    const duracaoMeses = (dFim.getFullYear() - dInicio.getFullYear()) * 12 + (dFim.getMonth() - dInicio.getMonth());
    
    const left = (mesesDoInicioAtePeriodo / totalMesesRange) * 100;
    const width = (duracaoMeses / totalMesesRange) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const getDurationMonths = (inicio: string, fim: string) => {
    if (!inicio || !fim) return 0;
    const dInicio = new Date(inicio);
    const dFim = new Date(fim);
    return ((dFim.getFullYear() - dInicio.getFullYear()) * 12 + (dFim.getMonth() - dInicio.getMonth())) + 1;
  };

  const fmtDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [ano, mes, dia] = dateStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const renderRuler = () => {
    const years = [];
    const startYear = minDate.getFullYear();
    const endYear = maxDate.getFullYear();
    const step = 4; 

    for (let y = startYear; y <= endYear; y++) {
       if (y % step === 0 || y === startYear || y === endYear) {
            const left = ((y - startYear) * 12 / totalMesesRange) * 100;
            if (left >= 0 && left <= 98) {
                years.push(
                    <div key={y} className="absolute bottom-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${left}%` }}>
                        <div className="h-3 w-px bg-slate-400 mb-1"></div>
                        <span className="text-[10px] font-bold text-slate-600">{y}</span>
                    </div>
                );
            }
       }
    }
    return years;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans print:bg-white">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 print:hidden shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-emerald-600 border border-transparent hover:border-emerald-100">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Scale className="text-emerald-600" size={24}/> Construtor de Tese Visual
                </h1>
                <p className="text-xs font-medium text-slate-500">Montagem do Quadro Probatório</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={saveChart} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-100 transition">
                <Save size={18}/> Salvar
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 transition shadow-lg shadow-slate-900/20">
                <Printer size={18}/> Imprimir
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- PAINEL ESQUERDO: CONTROLES --- */}
        <aside className="w-1/3 min-w-[350px] max-w-[500px] bg-white border-r border-slate-200 overflow-y-auto p-6 hidden lg:flex flex-col print:hidden shadow-lg z-10">
            
            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">1. Defina a Data Final (DER)</label>
                <input 
                    type="date" 
                    value={derDate} 
                    onChange={e => setDerDate(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-emerald-500 outline-none shadow-sm"
                />
            </div>

            <div className="mb-8">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">2. Adicione Documentos</label>
                <div className="flex gap-2 mb-2">
                     <select id="docSelect" className="flex-1 p-3 border border-slate-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-500/20">
                        <option value="">Selecione da lista...</option>
                        {availableDocs.map((doc, i) => (
                            <option key={i} value={i}>{doc.year} - {doc.type}</option>
                        ))}
                     </select>
                     <button 
                        onClick={() => {
                            const select = document.getElementById('docSelect') as HTMLSelectElement;
                            if (select.value !== "") handleAddItem(availableDocs[parseInt(select.value)]);
                        }}
                        className="bg-emerald-500 text-white px-4 rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
                     >
                        <Plus size={20}/>
                     </button>
                </div>
                <p className="text-[10px] text-slate-400 pl-1">Apenas provas cadastradas na entrevista aparecem aqui.</p>
            </div>

            <div className="space-y-4 pb-20">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block">3. Configure os Itens</label>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{selectedItems.length} itens</span>
                </div>
                
                {selectedItems.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 text-sm relative group hover:border-emerald-400 hover:shadow-md transition-all">
                        
                        {/* AÇÕES DE CABEÇALHO DO ITEM */}
                        <div className="absolute top-3 right-3 flex gap-2">
                            {item.fileUrl && (
                                <a 
                                    href={item.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Visualizar Original"
                                >
                                    <Eye size={16}/>
                                </a>
                            )}
                            <button onClick={() => handleRemoveItem(idx)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                        </div>
                        
                        <div className="font-bold text-slate-800 pr-16 mb-4 leading-tight">{item.nome}</div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Data de Expedição</label>
                                <input type="date" value={item.dataExpedicao} onChange={e => updateItem(idx, 'dataExpedicao', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-xs focus:bg-white focus:border-emerald-500 outline-none transition-colors"/>
                            </div>

                            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-emerald-800 block uppercase">Período de Eficácia</label>
                                    
                                    {/* BOTÃO MÁGICO DE CÁLCULO */}
                                    <button onClick={() => applyMagicPeriod(idx)} className="text-[10px] bg-emerald-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-emerald-700 font-bold shadow-sm transition-all active:scale-95 border border-emerald-700">
                                        <Wand2 size={10}/> 
                                        {item.anchor === 'end' ? 'Projetar Início (-90m)' : 'Projetar Fim (+90m)'}
                                    </button>
                                </div>

                                {/* CONTROLE DE DATAS COM TRAVA */}
                                <div className="flex items-center gap-2 mb-2">
                                    
                                    {/* INPUT DE INÍCIO */}
                                    <div className="flex-1 relative">
                                        <input 
                                            type="date" 
                                            value={item.periodoInicio} 
                                            onChange={e => updateItem(idx, 'periodoInicio', e.target.value)} 
                                            className={`w-full p-2 border rounded-lg text-xs text-center font-medium ${item.anchor === 'start' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 bg-slate-50'}`}
                                        />
                                        <button 
                                            onClick={() => toggleAnchor(idx, 'start')}
                                            className={`absolute -left-2 -top-2 p-1 rounded-full shadow-sm border ${item.anchor === 'start' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-300 border-slate-200 hover:text-emerald-500'}`}
                                            title="Travar Início como Referência"
                                        >
                                            {item.anchor === 'start' ? <Lock size={10}/> : <LockOpen size={10}/>}
                                        </button>
                                    </div>

                                    <span className="text-slate-400 text-[10px]"><ArrowRight size={12}/></span>
                                    
                                    {/* INPUT DE FIM */}
                                    <div className="flex-1 relative">
                                        <input 
                                            type="date" 
                                            value={item.periodoFim} 
                                            onChange={e => updateItem(idx, 'periodoFim', e.target.value)} 
                                            className={`w-full p-2 border rounded-lg text-xs text-center font-medium ${item.anchor === 'end' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 bg-slate-50'}`}
                                        />
                                        <button 
                                            onClick={() => toggleAnchor(idx, 'end')}
                                            className={`absolute -right-2 -top-2 p-1 rounded-full shadow-sm border ${item.anchor === 'end' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-300 border-slate-200 hover:text-emerald-500'}`}
                                            title="Travar Fim como Referência"
                                        >
                                            {item.anchor === 'end' ? <Lock size={10}/> : <LockOpen size={10}/>}
                                        </button>
                                    </div>

                                </div>
                                <div className="text-center flex justify-center items-center gap-1 text-[10px] text-emerald-700 opacity-80 mt-1">
                                    {item.anchor === 'end' ? <ArrowLeftIcon size={10}/> : null}
                                    <span className="font-bold">{getDurationMonths(item.periodoInicio, item.periodoFim)} meses</span>
                                    {item.anchor === 'start' ? <ArrowRight size={10}/> : null}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </aside>

        {/* --- PAINEL DIREITO: GRÁFICO (O que é impresso) --- */}
        <main className="flex-1 p-8 md:p-12 overflow-x-auto bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
            <div className="min-w-[800px] max-w-5xl mx-auto bg-white p-10 rounded-[1rem] shadow-sm border border-slate-200 print:shadow-none print:border-0 print:p-0 scale-95 origin-top">
                
                {/* CABEÇALHO DO RELATÓRIO */}
                <div className="mb-10 border-b-2 border-slate-800 pb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-serif font-black text-slate-900 uppercase tracking-widest mb-2">Quadro Probatório</h2>
                        <div className="text-sm font-serif text-slate-600 space-y-0.5">
                            <p><strong>Segurado(a):</strong> {cliente.nome}</p>
                            <p><strong>CPF:</strong> {cliente.cpf}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                         {/* --- NOVO: SOMA DOS PERÍODOS --- */}
                        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-lg text-right print:bg-transparent print:border-none print:p-0">
                            <div className="text-[10px] font-bold text-emerald-700 uppercase mb-0.5 print:text-slate-500">Soma dos Períodos</div>
                            <div className="text-xl font-black text-emerald-900 print:text-slate-900">{totalMesesCount} meses</div>
                        </div>

                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Data do Requerimento (DER)</div>
                            <div className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded inline-block print:bg-transparent print:p-0">
                                {fmtDate(derDate)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- O GRÁFICO --- */}
                <div className="relative pt-6 pb-12 break-inside-avoid">
                    
                    {/* Linhas de Grade */}
                    <div className="absolute inset-0 flex pointer-events-none opacity-20">
                        {renderRuler().map((_, i) => <div key={i} className="flex-1 border-r border-slate-300"></div>)}
                    </div>

                    {/* Barras */}
                    <div className="space-y-6 relative z-10 min-h-[200px]">
                        {selectedItems.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm italic print:hidden">
                                <div className="text-center">
                                    <Scale size={48} className="mx-auto mb-2 opacity-50"/>
                                    <p>Adicione documentos no painel lateral à esquerda<br/>para construir a tese visual.</p>
                                </div>
                            </div>
                        )}

                        {selectedItems.map((item, idx) => {
                            const { left, width } = getPosition(item.periodoInicio, item.periodoFim);
                            const months = getDurationMonths(item.periodoInicio, item.periodoFim);
                            
                            return (
                                <div key={idx} className="relative h-12 group">
                                    <div 
                                        className="absolute h-10 top-1 rounded-md border-l-[6px] shadow-sm flex items-center px-3 overflow-hidden whitespace-nowrap bg-emerald-50 border-emerald-500 text-emerald-900"
                                        style={{ left, width, minWidth: '4px' }}
                                    >
                                        <div className="flex flex-col leading-tight">
                                            <span className="text-[11px] font-black uppercase tracking-wide">
                                                Instrumento Ratificador {idx + 1}
                                            </span>
                                            <span className="text-[10px] font-medium opacity-80 print:text-black">
                                                {months} meses
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Régua de Tempo */}
                    <div className="relative h-8 mt-6 border-t border-slate-400">
                        {renderRuler()}
                    </div>
                </div>

                {/* --- LEGENDA E DETALHAMENTO --- */}
                {selectedItems.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 mb-6">Detalhamento dos Instrumentos</h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {selectedItems.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2 pb-6 border-b border-slate-100 last:border-0 break-inside-avoid">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded">{idx + 1}</span>
                                    <strong className="text-slate-900 text-sm uppercase">{item.nome}</strong>
                                </div>
                                <div className="text-xs text-slate-600 font-serif italic pl-8">
                                    {item.fundamento}
                                </div>
                                <div className="pl-8 text-xs text-slate-700">
                                    <strong>Data de expedição:</strong> {fmtDate(item.dataExpedicao)}
                                </div>
                                <div className="pl-8 text-sm font-bold text-slate-800">
                                    Período a homologar {fmtDate(item.periodoInicio)} até {fmtDate(item.periodoFim)} ({getDurationMonths(item.periodoInicio, item.periodoFim)} meses)
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                )}

                {/* --- LEGENDAS DE CORES --- */}
                <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap justify-center gap-6 text-xs print:mt-6 break-inside-avoid">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-500 rounded border border-emerald-600"></div><span className="font-bold text-slate-700">Período Rural</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-200 rounded border border-slate-400"></div><span className="font-bold text-slate-700">Urbano / Outros</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div><span className="font-bold text-slate-700">Benefício INSS</span></div>
                </div>

            </div>
        </main>
      </div>
    </div>
  );
}