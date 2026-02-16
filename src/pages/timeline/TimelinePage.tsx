import { useState, useEffect } from "react";
import { 
  ArrowLeft, Calendar, Search, AlertCircle, 
  Paperclip, Download, ExternalLink, Clock
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface TimelinePageProps {
  cliente: any;
  onBack: () => void;
}

export function TimelinePage({ cliente, onBack }: TimelinePageProps) {
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (cliente?.id) loadTimeline();
  }, [cliente]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('timeline_json')
        .eq('client_id', cliente.id)
        .maybeSingle();

      if (error) throw error;

      if (data && Array.isArray(data.timeline_json)) {
        // Ordena por ano (do mais antigo para o mais novo)
        const sorted = data.timeline_json.sort((a: any, b: any) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            return yearA - yearB;
        });
        setTimeline(sorted);
      }
    } catch (err) {
      console.error("Erro ao carregar timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtra os itens
  const filteredItems = timeline.filter(item => {
    const search = filter.toLowerCase();
    const type = (item.type || "").toLowerCase();
    const name = (item.customName || "").toLowerCase();
    const fileName = (item.fileName || "").toLowerCase();
    return type.includes(search) || name.includes(search) || fileName.includes(search);
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      
      {/* HEADER MODERNO */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-emerald-200 rounded-xl transition-all text-slate-500 hover:text-emerald-600 shadow-sm">
                    <ArrowLeft size={20}/>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Linha do Tempo
                    </h1>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock size={12}/> Visualização Cronológica das Provas
                    </p>
                </div>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="relative w-full md:w-72 group">
                <Search size={18} className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors"/>
                <input 
                    type="text" 
                    placeholder="Buscar documento, ano ou tipo..." 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
        
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-pulse">
                <Calendar size={48} className="mb-4 opacity-20"/>
                <p>Carregando cronologia...</p>
            </div>
        ) : filteredItems.length === 0 ? (
            <div className="max-w-md mx-auto mt-10 text-center p-10 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="text-slate-300" size={32}/>
                </div>
                <h3 className="text-slate-700 font-bold mb-1">Nenhum documento encontrado</h3>
                <p className="text-sm text-slate-400">Tente mudar o filtro ou adicione provas na entrevista.</p>
            </div>
        ) : (
            <div className="max-w-4xl mx-auto relative pb-20">
                {/* LINHA VERTICAL CENTRAL */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500 via-slate-300 to-transparent -translate-x-1/2"></div>

                {filteredItems.map((item, idx) => {
                    const fileName = item.fileName || "Documento";
                    const fileExt = fileName.includes('.') ? fileName.split('.').pop()?.toUpperCase() : "DOC";
                    const isEven = idx % 2 === 0; // Alternar lados

                    return (
                        <div key={item.id || idx} className={`relative flex items-center mb-12 ${isEven ? 'md:flex-row-reverse' : ''} group`}>
                            
                            {/* ANO (NÓ CENTRAL) */}
                            <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-12 h-12 bg-white border-4 border-slate-100 rounded-2xl flex flex-col items-center justify-center z-10 shadow-lg group-hover:scale-110 group-hover:border-emerald-100 transition-all duration-300">
                                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Ano</span>
                                <span className="text-sm font-black text-slate-700 leading-none">{item.year || "?"}</span>
                            </div>

                            {/* CARD DE CONTEÚDO */}
                            <div className={`w-full md:w-[45%] pl-20 md:pl-0 ${isEven ? 'md:pr-14' : 'md:pl-14'}`}>
                                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                    
                                    {/* DETALHE DECORATIVO */}
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>

                                    {/* CONTEÚDO */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm leading-tight">{item.type}</h4>
                                            {item.customName && <p className="text-xs text-slate-500 mt-1">"{item.customName}"</p>}
                                        </div>
                                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-slate-200">{fileExt}</span>
                                    </div>

                                    {/* INFO LEGAL */}
                                    {item.law && (
                                        <div className="mb-4 p-2.5 bg-blue-50/50 rounded-xl text-[10px] text-blue-700 border border-blue-100/50 leading-relaxed">
                                            <strong className="block mb-0.5 text-blue-800">Base Legal:</strong>
                                            {item.law}
                                        </div>
                                    )}

                                    {/* BOTÃO */}
                                    {item.fileUrl ? (
                                        <a 
                                            href={item.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-200 group-hover:shadow-emerald-200"
                                        >
                                            <ExternalLink size={14}/> Abrir Documento
                                        </a>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-100">
                                            <AlertCircle size={14}/> Arquivo Ausente
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </main>
    </div>
  );
}