import { useState, useEffect } from "react";
import { 
  ArrowLeft, Calendar, Printer, FileText, Scale
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface TimelineVisualPageProps {
  cliente: any;
  onBack: () => void;
}

export function TimelineVisualPage({ cliente, onBack }: TimelineVisualPageProps) {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<any[]>([]);
  const [totalMeses, setTotalMeses] = useState(0);

  useEffect(() => {
    if (cliente?.id) loadData();
  }, [cliente]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('interviews')
        .select('analise_periodos')
        .eq('client_id', cliente.id)
        .maybeSingle();

      if (data && data.analise_periodos) {
        const sorted = data.analise_periodos.sort((a: any, b: any) => 
            new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
        );
        setPeriods(sorted);

        let total = 0;
        if (sorted.length > 0) {
            const start = new Date(sorted[0].inicio);
            const end = new Date(sorted[sorted.length-1].fim);
            total = ((end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
        }
        setTotalMeses(total > 0 ? total : 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const diffMonths = (d1: string, d2: string) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return ((date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()) + 1) || 0;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${m}/${y}`;
  };

  const getWidth = (start: string, end: string) => {
    const months = diffMonths(start, end);
    const pct = (months / totalMeses) * 100;
    return pct < 6 ? 6 : pct; // Aumentei um pouco o mínimo para caber o texto novo
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      <header className="bg-slate-50 border-b p-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition">
                <ArrowLeft className="text-slate-600"/>
            </button>
            <div>
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="text-purple-600"/> Linha do Tempo (Resumo Gráfico)
                </h1>
                <p className="text-xs text-slate-500">Pronto para exportação/petição</p>
            </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition">
            <Printer size={16}/> Imprimir / PDF
        </button>
      </header>

      <main className="flex-1 p-8 overflow-x-auto">
        {loading ? (
            <div className="text-center py-20 text-slate-400">Gerando gráfico...</div>
        ) : periods.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
                Nenhum período cadastrado na Calculadora.
            </div>
        ) : (
            <div className="min-w-[900px]">
                <div className="mb-16 text-center border-b-2 border-slate-800 pb-4">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Quadro Demonstrativo de Períodos</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        Segurado: <strong>{cliente.nome}</strong> | Tempo Analisado: <strong>{totalMeses} meses</strong>
                    </p>
                </div>

                <div className="relative mt-32 mb-48 mx-4">
                    <div className="flex w-full h-8 rounded-md overflow-visible border-2 border-slate-800 shadow-sm bg-slate-100 relative z-10">
                        {periods.map((p, i) => {
                            let colorClass = "bg-slate-300";
                            let textoCor = "text-slate-600";
                            
                            if (p.tipo === 'rural') { colorClass = "bg-emerald-600"; textoCor = "text-emerald-800"; }
                            else if (p.tipo === 'urbano') { colorClass = p.is_safra ? "bg-amber-400" : "bg-red-600"; textoCor = p.is_safra ? "text-amber-800" : "text-red-800"; }
                            else if (p.tipo === 'beneficio') { colorClass = "bg-blue-600"; textoCor = "text-blue-800"; }

                            const meses = diffMonths(p.inicio, p.fim);

                            return (
                                <div key={i} style={{ width: `${getWidth(p.inicio, p.fim)}%` }} className={`${colorClass} h-full border-r border-white/50 relative group`}>
                                    
                                    {/* --- RÓTULO SUPERIOR (PERÍODO) --- */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex flex-col items-center w-48 z-20">
                                        <div className="text-center bg-white p-2 rounded border border-slate-200 shadow-sm w-full">
                                            {/* Título: Instrumento Ratificador Nº X */}
                                            <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${textoCor}`}>
                                                Instrumento Ratificador Nº {i + 1}
                                            </span>
                                            
                                            {/* Período */}
                                            <span className="text-[9px] font-bold text-slate-600 block leading-tight">
                                                Período: {formatDate(p.inicio)} a {formatDate(p.fim)}
                                            </span>

                                            {/* Tempo a Homologar */}
                                            <span className="text-[9px] font-bold text-slate-800 block mt-1 bg-slate-100 rounded px-1 py-0.5">
                                                Tempo a homologar: {meses} meses
                                            </span>
                                        </div>
                                        
                                        {/* Haste conectora */}
                                        <div className="w-px h-3 bg-slate-400"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-800 rounded-full -mb-1"></div>
                                    </div>

                                    {/* --- RÓTULO INFERIOR (PROVA) --- */}
                                    {p.linkedDocTitle && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 flex flex-col items-center w-56 z-30">
                                            {/* Haste conectora */}
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full -mt-1"></div>
                                            <div className="w-px h-6 bg-blue-300"></div>
                                            
                                            {/* Caixa do Documento */}
                                            <div className="bg-white border-l-4 border-blue-600 shadow-sm p-2 rounded text-left w-full border border-slate-100 relative">
                                                {/* Badge do Nº do Instrumento */}
                                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                                                    {i + 1}
                                                </div>

                                                <div className="text-[9px] font-bold text-blue-800 uppercase mb-1 border-b border-blue-50 pb-1">
                                                    Instrumento Ratificador {i + 1}
                                                </div>
                                                
                                                <div className="mb-1">
                                                    <span className="text-[9px] text-slate-500 font-bold block uppercase">Prova Anexada:</span>
                                                    <span className="text-[10px] font-bold text-slate-800 leading-tight block">
                                                        {p.linkedDocTitle}
                                                    </span>
                                                </div>

                                                {p.law && (
                                                    <div>
                                                        <span className="text-[9px] text-slate-500 font-bold block uppercase">Fundamento Legal:</span>
                                                        <span className="text-[9px] text-slate-600 italic leading-tight block">
                                                            {p.law}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Linha do horizonte */}
                    <div className="absolute top-1/2 left-0 w-full h-px bg-slate-300 -z-0"></div>
                </div>

                {/* LEGENDA */}
                <div className="flex justify-center gap-6 mt-20 border-t pt-6">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-600 border border-black"></div><span className="text-xs font-bold text-slate-700">Período Rural (Homologado)</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-400 border border-black"></div><span className="text-xs font-bold text-slate-700">Safra / Manutenção</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 border border-black"></div><span className="text-xs font-bold text-slate-700">Período Urbano (Descarte)</span></div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-600 border border-black"></div><span className="text-xs font-bold text-slate-700">Benefício INSS</span></div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}