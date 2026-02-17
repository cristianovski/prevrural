import { useState, useEffect } from "react";
import { 
  ArrowLeft, Printer, CheckSquare, Square, FileText, 
  Calendar, Scale, Brain, TrendingUp, 
  User, CheckCircle, AlertTriangle 
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

// CHAVE API DO .ENV
const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

interface ReportProps {
  cliente: any;
  onBack: () => void;
}

export function MasterReportPage({ cliente, onBack }: ReportProps) {
  const [loading, setLoading] = useState(true);
  
  // Dados
  const [interview, setInterview] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [officeProfile, setOfficeProfile] = useState<any>(null);
  const [stats, setStats] = useState({ rural: 0, carencia: 0 });

  // IA
  const [aiSummary, setAiSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  
  // Controle de Seções
  const [sections, setSections] = useState({
    capa: true,
    resumo_ia: true,
    linha_tempo_visual: true,
    dados_cadastrais: true,
    tabela_periodos: true,
    parecer: true,
    procuracao: false 
  });

  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    loadFullCase();
  }, [cliente]);

  const loadFullCase = async () => {
    setLoading(true);
    
    // 1. Busca Dados da Entrevista
    const { data: interviewData } = await supabase.from('interviews').select('*').eq('client_id', cliente.id).maybeSingle();

    if (interviewData) {
        setInterview(interviewData);
        const p = interviewData.analise_periodos || [];
        const sorted = p.sort((a: any, b: any) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
        setPeriods(sorted);
        calculateStats(sorted);
        
        if (interviewData.ai_summary) {
            setAiSummary(interviewData.ai_summary);
        } else {
            generateExecutiveSummary(interviewData, sorted);
        }
    }

    // 2. Busca Perfil do Escritório
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: office } = await supabase.from('office_profile').select('*').eq('user_id', user.id).maybeSingle();
        if (office) setOfficeProfile(office);
    }
    setLoading(false);
  };

  const diffMonths = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    try {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return ((date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()) + 1);
    } catch { return 0; }
  };

  const calculateStats = (per: any[]) => {
    let r = 0;
    per.forEach((p: any) => {
        if (p.tipo === 'rural' || p.tipo === 'beneficio') r += diffMonths(p.inicio, p.fim);
    });
    setStats({ rural: r, carencia: Math.min((r/180)*100, 100) });
  };

  const generateExecutiveSummary = async (interviewData: any, periodsData: any[]) => {
      setGeneratingSummary(true);
      try {
          const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

          let ruralMonths = 0;
          periodsData.forEach(p => { if(p.tipo === 'rural' || p.tipo === 'beneficio') ruralMonths += diffMonths(p.inicio, p.fim); });

          const prompt = `
          Aja como um Advogado Previdenciarista Sênior.
          Escreva um RESUMO EXECUTIVO (máximo 4 linhas) sobre a viabilidade do caso rural.
          
          DADOS:
          - Cliente: ${cliente.nome}
          - Tempo Rural Provado: ${ruralMonths} meses.
          - Meta: 180 meses.
          
          Se atingiu a meta, destaque o "Direito Adquirido". Se não, sugira buscar mais provas para as lacunas.
          `;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          setAiSummary(text);
          await supabase.from('interviews').update({ ai_summary: text }).eq('client_id', cliente.id);
      } catch (e) { console.error(e); } 
      finally { setGeneratingSummary(false); }
  };

  const toggleSection = (key: keyof typeof sections) => { setSections(prev => ({ ...prev, [key]: !prev[key] })); };
  const handlePrint = () => window.print();
  const renderCheck = (val: boolean) => val ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-slate-300"/>;
  const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : '-';

  const TimelineVisual = () => {
      if (periods.length === 0) return null;
      const totalMonths = diffMonths(periods[0].inicio, periods[periods.length-1].fim) || 1;
      const startYear = new Date(periods[0].inicio).getFullYear();
      const endYear = new Date(periods[periods.length -1].fim).getFullYear();

      return (
          <div className="mt-2 mb-6 no-break">
               <div className="relative w-full h-12 bg-slate-100 border border-slate-200 rounded flex items-center px-0 overflow-hidden print:border-slate-400">
                  <div className="flex w-full h-full relative">
                      {periods.map((p, i) => {
                          const duration = Math.max(diffMonths(p.inicio, p.fim), 1);
                          const width = (duration / totalMonths) * 100;
                          let color = "bg-slate-300"; 
                          if (p.tipo === 'rural') color = "bg-emerald-500 print:bg-emerald-600";
                          if (p.tipo === 'beneficio') color = "bg-blue-400 print:bg-blue-500";
                          if (p.tipo === 'vazio') color = "bg-red-300 print:bg-red-400";
                          return <div key={i} className={`${color} h-full border-r border-white/50 print:border-white`} style={{ width: `${width}%` }}></div>;
                      })}
                  </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono uppercase">
                  <span>{startYear}</span>
                  <div className="flex gap-4">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full print:bg-emerald-600"></div> Rural</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-300 rounded-full print:bg-red-400"></div> Lacuna</span>
                  </div>
                  <span>{endYear}</span>
              </div>
          </div>
      );
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Gerando Dossiê...</div>;

  return (
    <div className="bg-slate-100 min-h-screen flex flex-row font-sans overflow-hidden">
      
      {/* SIDEBAR (Não imprime) */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 print:hidden z-20 shadow-xl h-screen">
        <div className="p-6 bg-slate-900 text-white">
            <button onClick={onBack} className="mb-4 flex items-center gap-2 text-slate-300 hover:text-white text-sm font-bold"><ArrowLeft size={16}/> Voltar</button>
            <h1 className="text-xl font-bold flex items-center gap-2"><FileText className="text-emerald-400"/> Dossiê Premium</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conteúdo</h3>
            {Object.keys(sections).map(key => (
                <button key={key} onClick={() => toggleSection(key as any)} className="flex items-center gap-3 w-full text-left p-2 hover:bg-slate-50 rounded capitalize text-sm text-slate-700">
                    {renderCheck(sections[key as keyof typeof sections])} {key.replace(/_/g, ' ')}
                </button>
            ))}
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50">
            <button onClick={handlePrint} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"><Printer size={18}/> Imprimir</button>
        </div>
      </aside>

      {/* ÁREA DE VISUALIZAÇÃO (A4) */}
      <main className="flex-1 overflow-y-auto p-8 bg-slate-500/10 print:p-0 print:bg-white print:overflow-visible flex justify-center">
        <div className="bg-white w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl print:shadow-none print:w-full print:p-[15mm] text-black leading-relaxed font-serif relative">

            {/* SEÇÃO 1: CAPA (Sempre quebra página depois) */}
            {sections.capa && (
                <div className="flex flex-col items-center justify-center h-[240mm] border-b border-slate-100 mb-8 page-break-after relative">
                    <div className="mb-10 text-center">
                        <Scale size={60} className="text-slate-800 mx-auto mb-4"/>
                        <div className="h-1 w-16 bg-emerald-600 mx-auto"></div>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-widest text-center mb-2">Dossiê Jurídico</h1>
                    <p className="text-sm text-slate-500 tracking-widest uppercase mb-12">Análise de Viabilidade</p>
                    
                    <div className="w-full max-w-lg bg-slate-50 p-8 rounded-xl border border-slate-200 text-center print:border-slate-400">
                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Beneficiário</p>
                        <h2 className="text-3xl font-serif text-slate-800 mb-2">{cliente.nome}</h2>
                        <p className="text-sm text-slate-600 font-mono">{cliente.cpf}</p>
                    </div>

                    <div className="mt-auto w-full text-center">
                         <p className="font-bold text-slate-800 uppercase text-sm">{officeProfile?.nome_advogado || "Escritório Jurídico"}</p>
                         <p className="text-xs text-slate-500">{officeProfile?.endereco_profissional} - {officeProfile?.cidade_uf}</p>
                         <p className="text-xs text-slate-400 mt-2">{dataHoje}</p>
                    </div>
                </div>
            )}

            {/* SEÇÃO 2: RESUMO ESTRATÉGICO (Não quebra dentro) */}
            <div className="no-break mb-8">
                {sections.resumo_ia && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold border-b-2 border-purple-500 pb-1 mb-3 uppercase flex items-center gap-2 text-purple-700 print:text-black print:border-black"><Brain size={14}/> Análise Estratégica</h2>
                        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 text-sm text-slate-700 italic text-justify rounded print:bg-white print:border-black print:text-black">
                            "{aiSummary || "Análise pendente."}"
                        </div>
                    </div>
                )}
            </div>

            {/* SEÇÃO 3: DADOS CADASTRAIS (Não quebra dentro) */}
            {sections.dados_cadastrais && (
                <div className="no-break mb-8">
                    <h2 className="text-sm font-bold border-b border-slate-300 pb-1 mb-3 uppercase flex items-center gap-2 text-slate-700 print:text-black"><User size={14}/> Identificação</h2>
                    <table className="w-full text-sm font-sans">
                        <tbody>
                            <tr>
                                <td className="py-1 text-slate-500 w-32 uppercase text-xs font-bold">Nome:</td>
                                <td className="py-1 font-bold">{cliente.nome}</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-slate-500 uppercase text-xs font-bold">Idade:</td>
                                <td className="py-1">{new Date().getFullYear() - new Date(cliente.data_nascimento).getFullYear()} anos</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-slate-500 uppercase text-xs font-bold">Profissão:</td>
                                <td className="py-1">{cliente.profissao || "Rural"}</td>
                            </tr>
                            <tr>
                                <td className="py-1 text-slate-500 uppercase text-xs font-bold">Endereço:</td>
                                <td className="py-1">{cliente.endereco || "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* SEÇÃO 4: GRÁFICO E PLACAR (Não quebra dentro) */}
            {sections.linha_tempo_visual && (
                <div className="no-break mb-8">
                     <h2 className="text-sm font-bold border-b border-emerald-500 pb-1 mb-4 uppercase flex items-center gap-2 text-emerald-700 print:text-black print:border-black"><TrendingUp size={14}/> Linha do Tempo</h2>
                     
                     <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="border border-slate-200 rounded p-2 text-center print:border-slate-400">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Apurado</p>
                            <p className="text-lg font-black text-emerald-600 print:text-black">{stats.rural} m</p>
                        </div>
                        <div className="border border-slate-200 rounded p-2 text-center print:border-slate-400">
                            <p className="text-[10px] uppercase font-bold text-slate-400">Meta</p>
                            <p className="text-lg font-black text-slate-700 print:text-black">180 m</p>
                        </div>
                        <div className={`border rounded p-2 text-center print:border-black ${stats.rural >= 180 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                            <p className={`text-sm font-black uppercase mt-1 ${stats.rural >= 180 ? 'text-emerald-700' : 'text-red-700'} print:text-black`}>
                                {stats.rural >= 180 ? "APTO" : "INAPTO"}
                            </p>
                        </div>
                     </div>

                     <TimelineVisual />
                </div>
            )}

            {/* SEÇÃO 5: TABELA (Linhas não quebram) */}
            {sections.tabela_periodos && periods.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-sm font-bold border-b border-black pb-1 mb-4 uppercase flex items-center gap-2 text-slate-700 print:text-black"><Calendar size={14}/> Detalhamento</h2>
                    <table className="w-full text-xs font-sans border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-300 text-slate-500 uppercase print:text-black print:border-black">
                                <th className="py-2 text-left w-24">Início</th>
                                <th className="py-2 text-left w-24">Fim</th>
                                <th className="py-2 text-left w-20">Tipo</th>
                                <th className="py-2 text-left">Prova Principal</th>
                                <th className="py-2 text-right w-16">Meses</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map((p, i) => (
                                <tr key={i} className="border-b border-slate-100 no-break print:border-slate-300">
                                    <td className="py-2">{fmtDate(p.inicio)}</td>
                                    <td className="py-2">{fmtDate(p.fim)}</td>
                                    <td className="py-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase print:border print:border-black print:bg-white print:text-black ${
                                            p.tipo === 'rural' ? 'bg-emerald-100 text-emerald-700' : 
                                            p.tipo === 'vazio' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                        }`}>{p.tipo}</span>
                                    </td>
                                    <td className="py-2 text-slate-500 italic truncate max-w-[150px] print:text-black">{p.obs || "-"}</td>
                                    <td className="py-2 text-right font-mono font-bold">{diffMonths(p.inicio, p.fim)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SEÇÃO 6: PARECER JURÍDICO (Pode quebrar página se for longo) */}
            {sections.parecer && interview?.opinion_json && (
                <div className="mb-8">
                    <h2 className="text-sm font-bold border-b border-black pb-1 mb-4 uppercase flex items-center gap-2 text-slate-700 print:text-black"><Scale size={14}/> Parecer Jurídico</h2>
                    <div className="text-sm font-serif text-justify leading-relaxed whitespace-pre-wrap">
                        {interview.opinion_json.resumo_analise || "Parecer não disponível."}
                    </div>
                </div>
            )}

            {/* SEÇÃO 7: PROCURAÇÃO (Sempre nova página) */}
            {sections.procuracao && (
                <div className="page-break-before mt-8 pt-8">
                    <div className="text-center mb-10">
                         <h2 className="font-bold text-lg uppercase tracking-wide border-b-2 border-black inline-block pb-1">Procuração Ad Judicia et Extra</h2>
                    </div>
                    
                    <div className="text-justify text-sm font-serif leading-7 space-y-6">
                        <p>
                            <strong>OUTORGANTE:</strong> {cliente.nome.toUpperCase()}, nacionalidade brasileira, estado civil {cliente.estado_civil || '...'}, {cliente.profissao || 'Agricultor(a)'}, inscrito(a) no CPF sob o nº {cliente.cpf}, residente e domiciliado(a) em {cliente.endereco || '...'}, doravante denominado(a) OUTORGANTE.
                        </p>
                        <p>
                            <strong>OUTORGADO:</strong> {officeProfile ? (
                                `${officeProfile.nome_advogado.toUpperCase()}, inscrito(a) na OAB sob o nº ${officeProfile.oab}, com endereço profissional em ${officeProfile.endereco_profissional}, ${officeProfile.cidade_uf}`
                            ) : (
                                "________________________________________________ (Dados do escritório não configurados)"
                            )}, doravante denominado(a) OUTORGADO.
                        </p>
                        <p>
                            <strong>PODERES:</strong> Pelo presente instrumento particular de mandato, o(a) OUTORGANTE nomeia e constitui o(a) OUTORGADO(A) seu(sua) bastante procurador(a), conferindo-lhe amplos poderes para o foro em geral, com a cláusula <em>"ad judicia et extra"</em>, em qualquer Juízo, Instância ou Tribunal, podendo propor contra quem de direito as ações competentes e defendê-lo(a) nas contrárias, seguindo umas e outras, até final decisão, usando os recursos legais e acompanhando-o(a), conferindo-lhe ainda, poderes especiais para confessar, desistir, transigir, firmar compromissos ou acordos, receber e dar quitação, agindo em conjunto ou separadamente, podendo ainda substabelecer esta a outrem, com ou sem reservas de iguais poderes, especificamente para atuar junto ao INSS e Poder Judiciário na defesa de seus direitos previdenciários.
                        </p>
                    </div>

                    <div className="mt-24 text-center no-break">
                        <div className="border-t border-black w-2/3 mx-auto pt-2">
                            <p className="font-bold uppercase">{cliente.nome}</p>
                            <p className="text-xs text-slate-500">Outorgante</p>
                        </div>
                        <p className="mt-8 text-sm">{officeProfile?.cidade_uf?.split('/')[0] || "Local"}, {dataHoje}.</p>
                    </div>
                </div>
            )}

        </div>
      </main>

      {/* REGRAS DE IMPRESSÃO (CSS CRÍTICO) */}
      <style>{`
        @media print { 
            @page { margin: 1.5cm; size: A4; } 
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
            
            /* Classes Utilitárias de Impressão */
            .page-break-after { break-after: page; page-break-after: always; }
            .page-break-before { break-before: page; page-break-before: always; }
            .no-break { break-inside: avoid; page-break-inside: avoid; }
            
            /* Remove Scrollbars e fundos */
            ::-webkit-scrollbar { display: none; }
            aside { display: none !important; }
            main { padding: 0 !important; background: white !important; }
            div { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}