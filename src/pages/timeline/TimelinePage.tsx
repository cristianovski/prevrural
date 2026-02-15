import { useState, useEffect } from "react";
import { 
  ArrowLeft, FileText, Calendar, Download, 
  Search, Filter, AlertCircle, Paperclip 
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

  // Filtra os itens pelo nome ou tipo
  const filteredItems = timeline.filter(item => {
    const search = filter.toLowerCase();
    const type = (item.type || "").toLowerCase();
    const name = (item.customName || "").toLowerCase();
    const fileName = (item.fileName || "").toLowerCase();
    return type.includes(search) || name.includes(search) || fileName.includes(search);
  });

  // Agrupa por décadas para visualização (Opcional, mas útil)
  const itemsWithGap = filteredItems.map((item, index) => {
    const prevItem = filteredItems[index - 1];
    const currentYear = parseInt(item.year) || 0;
    const prevYear = prevItem ? (parseInt(prevItem.year) || 0) : currentYear;
    const gap = currentYear - prevYear;
    return { ...item, gap };
  });

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* HEADER */}
      <header className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
                    <ArrowLeft className="text-slate-600"/>
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-amber-600"/> Linha do Tempo
                    </h1>
                    <p className="text-xs text-slate-500">Visualização cronológica das provas</p>
                </div>
            </div>

            {/* BARRA DE FILTRO */}
            <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
                <input 
                    type="text" 
                    placeholder="Filtrar documentos..." 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-9 p-2.5 border rounded-lg text-sm outline-none focus:border-amber-500"
                />
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        
        {loading ? (
            <div className="text-center py-20 text-slate-400">Carregando provas...</div>
        ) : itemsWithGap.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <AlertCircle className="mx-auto text-slate-300 mb-2" size={48}/>
                <p className="text-slate-500 font-medium">Nenhum documento encontrado na linha do tempo.</p>
                <p className="text-xs text-slate-400">Volte para a entrevista e adicione provas.</p>
            </div>
        ) : (
            <div className="max-w-3xl mx-auto relative">
                {/* LINHA VERTICAL CENTRAL */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>

                {itemsWithGap.map((item, idx) => {
                    // BLINDAGEM CONTRA ERRO 'SPLIT' E UNDEFINED
                    const fileName = item.fileName || "Documento sem nome";
                    const fileExt = fileName.includes('.') ? fileName.split('.').pop()?.toUpperCase() : "DOC";
                    const isEven = idx % 2 === 0; // Para alternar lados (Esquerda/Direita)

                    return (
                        <div key={item.id || idx} className={`relative flex items-center mb-8 ${isEven ? 'md:flex-row-reverse' : ''}`}>
                            
                            {/* BOLINHA DO ANO */}
                            <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-10 h-10 bg-white border-4 border-amber-500 rounded-full flex items-center justify-center z-10 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-700">{item.year || "S/D"}</span>
                            </div>

                            {/* CONTEÚDO (CARD) */}
                            <div className={`w-full md:w-[45%] pl-20 md:pl-0 ${isEven ? 'md:pr-10' : 'md:pl-10'}`}>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                                    
                                    {/* SETINHA DO CARD */}
                                    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-b border-l border-slate-200 rotate-45 ${isEven ? '-right-1.5 border-l-0 border-t' : '-left-1.5'}`}></div>

                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 text-sm">{item.type}</h4>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-bold">{fileExt}</span>
                                    </div>

                                    {item.customName && (
                                        <p className="text-xs text-slate-500 mb-3 italic">"{item.customName}"</p>
                                    )}

                                    {/* INFO LEGAL (SE HOUVER) */}
                                    {item.law && (
                                        <div className="mb-3 p-2 bg-blue-50 rounded text-[10px] text-blue-800 border border-blue-100">
                                            {item.law}
                                        </div>
                                    )}

                                    {/* BOTÃO DOWNLOAD/VISUALIZAR */}
                                    {item.fileUrl ? (
                                        <a 
                                            href={item.fileUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors p-2 bg-emerald-50 rounded-lg justify-center border border-emerald-100"
                                        >
                                            <Paperclip size={14}/> Visualizar Documento
                                        </a>
                                    ) : (
                                        <div className="text-xs text-red-400 flex items-center gap-1 italic justify-center p-2 bg-red-50 rounded-lg">
                                            <AlertCircle size={14}/> Arquivo não anexado
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