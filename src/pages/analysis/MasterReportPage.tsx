import { useState, useEffect } from "react";
import { 
  ArrowLeft, Printer, CheckSquare, Square, FileText, 
  Calendar, Scale, Brain, TrendingUp, 
  User, CheckCircle, AlertTriangle 
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client, Interview, Period, OfficeProfile } from "../../types";

// CHAVE API DO .ENV
const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// FIX: Tipagens rigorosas
interface ReportProps {
  cliente: Client;
  onBack: () => void;
}

// FIX: Inclusão dos campos legados (oab, endereco_profissional) para evitar erros
interface OfficeProfileExtended extends Partial<OfficeProfile> {
    nome_advogado?: string;
    cidade_uf?: string;
    oab?: string;
    endereco_profissional?: string;
}

// FIX: Uso de Partial<Period> e adição de campos do JSON legado da Calculadora
interface AnalysisPeriod extends Partial<Period> {
    inicio?: string;
    fim?: string;
    is_safra?: boolean;
    tipo?: string; 
    obs?: string;
}

// FIX: Uso de 'Omit' para remover a tipagem antiga de analise_periodos e injetar a nossa flexível
interface InterviewExtended extends Omit<Partial<Interview>, 'analise_periodos'> {
    historico_locais?: string;
    dados_rurais?: {
        nome_imovel?: string;
        area_total?: string;
        condicao_posse?: string;
        culturas?: string;
        destinacao?: string;
    };
    analise_periodos?: AnalysisPeriod[];
}

export function MasterReportPage({ cliente, onBack }: ReportProps) {
  const [loading, setLoading] = useState(true);
  
  const [interview, setInterview] = useState<InterviewExtended | null>(null);
  const [periods, setPeriods] = useState<AnalysisPeriod[]>([]);
  const [officeProfile, setOfficeProfile] = useState<OfficeProfileExtended | null>(null);
  const [stats, setStats] = useState({ rural: 0, carencia: 0 });

  const [aiSummary, setAiSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);
  
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

  // Helpers de data seguros
  const getStart = (p: AnalysisPeriod) => p.inicio || p.start_date || "";
  const getEnd = (p: AnalysisPeriod) => p.fim || p.end_date || "";

  useEffect(() => {
    if (cliente?.id) fetchData();
  }, [cliente]);

  const fetchData = async () => {
      setLoading(true);
      try {
          const { data: { user } } = await supabase.auth.getUser();

          // FIX: Consultas Paralelas (Promise.all)
          const interviewPromise = supabase.from('interviews').select('*').eq('client_id', cliente.id).maybeSingle();
          const officePromise = user ? supabase.from('office_profile').select('*').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null });

          const [invRes, offRes] = await Promise.all([interviewPromise, officePromise]);

          if (invRes.data) {
              const invData = invRes.data as InterviewExtended;
              setInterview(invData);
              if (invData.ai_summary) setAiSummary(invData.ai_summary);
              
              if (invData.analise_periodos) {
                  setPeriods(invData.analise_periodos);
                  
                  // Recalcula totais (Garantindo compatibilidade de datas)
                  let rural = 0, carencia = 0;
                  invData.analise_periodos.forEach((p: AnalysisPeriod) => {
                      const startDate = getStart(p);
                      const endDate = getEnd(p);
                      if (!startDate || !endDate) return;

                      const d1 = new Date(startDate);
                      const d2 = new Date(endDate);
                      const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()) + 1;
                      
                      if (months > 0) {
                          if (p.tipo === 'rural') { rural += months; carencia += months; }
                          if (p.tipo === 'beneficio') { carencia += months; }
                          if (p.tipo === 'urbano' && p.is_safra) { rural += months; carencia += months; }
                      }
                  });
                  setStats({ rural, carencia });
              }
          }

          if (offRes.data) setOfficeProfile(offRes.data as OfficeProfileExtended);

      } catch (err) {
          console.error("Erro ao carregar dados do relatório:", err);
      } finally {
          setLoading(false);
      }
  };

  const generateAiSummary = async () => {
      if (!interview) return alert("Ficha de entrevista não encontrada.");
      setGeneratingSummary(true);
      try {
          const prompt = `
          Atue como um advogado sênior previdenciarista.
          Leia os dados fáticos do cliente rural e crie um "Resumo Executivo do Caso" em 1 parágrafo (máx 5 linhas).
          O objetivo é que outro advogado leia e entenda a história de vida rural da pessoa instantaneamente.
          
          Cliente: ${cliente.nome}, Nascido em: ${cliente.data_nascimento}.
          Propriedade: ${interview.dados_rurais?.nome_imovel} (${interview.dados_rurais?.area_total} Ha). Condição: ${interview.dados_rurais?.condicao_posse}.
          Culturas: ${interview.dados_rurais?.culturas}. Destino: ${interview.dados_rurais?.destinacao}.
          História contada: ${interview.historico_locais}
          
          Gere apenas o texto do resumo, sem introduções ou saudações. Tom profissional e direto.
          `;

          const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          
          setAiSummary(text);
          
          await supabase.from('interviews').update({ ai_summary: text }).eq('client_id', cliente.id);

      } catch (error: unknown) { // FIX: Tipagem Estrita
          const msg = error instanceof Error ? error.message : "Erro desconhecido";
          alert("Falha ao gerar resumo: " + msg);
      } finally {
          setGeneratingSummary(false);
      }
  };

  const handlePrint = () => window.print();

  const toggleSection = (key: keyof typeof sections) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

  const formatDate = (dateString?: string | null) => {
      if (!dateString) return "___/___/____";
      return dateString.split('-').reverse().join('/');
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Montando Dossiê...</div>;

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col font-sans">
      {/* HEADER E CONTROLES (NÃO IMPRIME) */}
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-xl print:hidden flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition"><ArrowLeft size={20}/></button>
            <div>
                <h1 className="text-lg font-bold flex items-center gap-2"><FileText className="text-blue-400"/> Dossiê Master</h1>
                <p className="text-xs text-slate-400">{cliente.nome}</p>
            </div>
        </div>
        <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow flex items-center gap-2 transition-all"><Printer size={18}/> Imprimir Dossiê</button>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        {/* BARRA LATERAL DE CONFIGURAÇÃO (NÃO IMPRIME) */}
        <aside className="w-64 bg-white border-r border-slate-300 p-4 overflow-y-auto hidden md:block print:hidden shadow-lg z-10">
            <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider border-b pb-2">Seções do Relatório</h3>
            <div className="space-y-2">
                {Object.entries(sections).map(([key, isVisible]) => (
                    <button key={key} onClick={() => toggleSection(key as keyof typeof sections)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-sm text-slate-700 transition">
                        {isVisible ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18} className="text-slate-300"/>}
                        <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    </button>
                ))}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200">
                <button onClick={generateAiSummary} disabled={generatingSummary} className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50">
                    <Brain size={14}/> {generatingSummary ? "Gerando..." : "Gerar Resumo IA"}
                </button>
            </div>
        </aside>

        {/* ÁREA DE IMPRESSÃO (PÁGINA A4) */}
        <main className="flex-1 overflow-y-auto p-8 flex justify-center print:p-0 print:block">
            <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none print:w-full mx-auto relative text-black text-[11pt] leading-relaxed">
                
                {/* --- SEÇÃO: CAPA --- */}
                {sections.capa && (
                    <div className="p-[20mm] h-[297mm] flex flex-col justify-center relative page-break-after">
                        <div className="absolute top-0 left-0 w-4 h-full bg-blue-900"></div>
                        <div className="pl-8">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase">Dossiê Previdenciário</h1>
                            <h2 className="text-xl text-slate-500 font-medium mb-12">Análise de Viabilidade Rural</h2>
                            
                            <div className="bg-slate-50 p-6 border-l-4 border-blue-600 mb-12">
                                <h3 className="font-bold text-lg mb-1">{cliente.nome}</h3>
                                <p className="text-slate-600 font-mono">CPF: {cliente.cpf}</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <p><strong className="uppercase">Data da Análise:</strong> {dataHoje}</p>
                                <p><strong className="uppercase">Responsável:</strong> {officeProfile?.nome_advogado || "Advogado(a)"}</p>
                                <p><strong className="uppercase">Status:</strong> {cliente.status_processo || "Em Análise"}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SEÇÃO: DADOS CADASTRAIS E RESUMO --- */}
                {(sections.dados_cadastrais || sections.resumo_ia) && (
                    <div className="p-[20mm] page-break-after">
                        <h2 className="text-2xl font-black border-b-2 border-slate-900 pb-2 mb-6 uppercase flex items-center gap-2"><User size={24}/> Qualificação do Segurado</h2>
                        
                        {sections.dados_cadastrais && (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-10 text-[10pt]">
                                <div><strong>NOME:</strong> {cliente.nome}</div>
                                <div><strong>CPF:</strong> {cliente.cpf}</div>
                                <div><strong>RG:</strong> {cliente.rg || '-'}</div>
                                <div><strong>NASCIMENTO:</strong> {formatDate(cliente.data_nascimento)}</div>
                                <div><strong>ESTADO CIVIL:</strong> {cliente.estado_civil}</div>
                                <div><strong>PROFISSÃO:</strong> {cliente.profissao}</div>
                                <div className="col-span-2"><strong>ENDEREÇO:</strong> {cliente.endereco}, {cliente.bairro}, {cliente.cidade} - CEP: {cliente.cep}</div>
                            </div>
                        )}

                        {sections.resumo_ia && (
                            <div className="mb-10 no-break">
                                <h3 className="font-bold text-lg bg-slate-100 p-2 border-l-4 border-purple-500 mb-4 flex items-center gap-2"><Brain size={18} className="text-purple-600"/> Resumo Executivo (IA)</h3>
                                {aiSummary ? (
                                    <p className="text-justify italic text-slate-800 bg-purple-50/50 p-4 rounded-r-lg border border-purple-100">{aiSummary}</p>
                                ) : (
                                    <p className="text-slate-400 italic">Resumo não gerado. Utilize a barra lateral para acionar a IA.</p>
                                )}
                            </div>
                        )}

                        {sections.dados_cadastrais && interview && (
                            <div className="no-break">
                                <h3 className="font-bold text-lg bg-slate-100 p-2 border-l-4 border-emerald-500 mb-4">Caracterização Rural (Ficha)</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10pt] bg-slate-50 p-4 border border-slate-200">
                                    <div><strong>IMÓVEL:</strong> {interview.dados_rurais?.nome_imovel || '-'}</div>
                                    <div><strong>ÁREA:</strong> {interview.dados_rurais?.area_total || '-'}</div>
                                    <div><strong>CONDIÇÃO:</strong> <span className="uppercase">{interview.dados_rurais?.condicao_posse || '-'}</span></div>
                                    <div><strong>PRODUÇÃO:</strong> {interview.dados_rurais?.culturas || '-'}</div>
                                    <div className="col-span-2 mt-2 pt-2 border-t border-slate-200">
                                        <strong className="block mb-1">NARRATIVA FÁTICA / HISTÓRICO:</strong>
                                        <p className="text-justify text-[9pt] leading-normal">{interview.historico_locais || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- SEÇÃO: ANÁLISE MATEMÁTICA / TABELA --- */}
                {sections.tabela_periodos && (
                    <div className="p-[20mm] page-break-after">
                        <h2 className="text-2xl font-black border-b-2 border-slate-900 pb-2 mb-6 uppercase flex items-center gap-2"><TrendingUp size={24}/> Análise Matemática</h2>
                        
                        <div className="flex gap-4 mb-8">
                            <div className="flex-1 bg-emerald-50 border border-emerald-200 p-4 text-center rounded-xl">
                                <span className="block text-xs font-bold text-emerald-800 uppercase mb-1">Cálculo Rural</span>
                                <span className="text-3xl font-black text-emerald-600">{stats.rural} <span className="text-sm font-normal">meses</span></span>
                            </div>
                            <div className="flex-1 bg-blue-50 border border-blue-200 p-4 text-center rounded-xl">
                                <span className="block text-xs font-bold text-blue-800 uppercase mb-1">Carência Total</span>
                                <span className="text-3xl font-black text-blue-600">{stats.carencia} <span className="text-sm font-normal">meses</span></span>
                            </div>
                            <div className="flex-1 bg-slate-100 border border-slate-300 p-4 text-center rounded-xl flex flex-col justify-center items-center">
                                {stats.rural >= 180 ? (
                                    <><CheckCircle size={24} className="text-emerald-500 mb-1"/><span className="text-xs font-bold text-emerald-700">CARÊNCIA RURAL ATINGIDA</span></>
                                ) : (
                                    <><AlertTriangle size={24} className="text-amber-500 mb-1"/><span className="text-xs font-bold text-amber-700">CARÊNCIA PENDENTE</span></>
                                )}
                            </div>
                        </div>

                        <h3 className="font-bold text-sm mb-2 uppercase">Memória de Cálculo (Linha do Tempo)</h3>
                        <table className="w-full text-[9pt] border-collapse">
                            <thead>
                                <tr className="bg-slate-200 text-left">
                                    <th className="border border-slate-400 p-2">Tipo</th>
                                    <th className="border border-slate-400 p-2 text-center">Início</th>
                                    <th className="border border-slate-400 p-2 text-center">Fim</th>
                                    <th className="border border-slate-400 p-2">Observação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periods.length === 0 ? (
                                    <tr><td colSpan={4} className="border border-slate-400 p-4 text-center italic text-slate-500">Nenhum período cadastrado na calculadora.</td></tr>
                                ) : (
                                    periods.map((p, i) => (
                                        <tr key={i} className={p.tipo === 'rural' ? 'bg-emerald-50/30' : p.tipo === 'urbano' ? 'bg-red-50/30' : 'bg-white'}>
                                            <td className="border border-slate-400 p-2 font-bold uppercase">{p.tipo} {p.is_safra ? '(Safra)' : ''}</td>
                                            <td className="border border-slate-400 p-2 text-center">{formatDate(getStart(p))}</td>
                                            <td className="border border-slate-400 p-2 text-center">{formatDate(getEnd(p))}</td>
                                            <td className="border border-slate-400 p-2 text-xs">{p.obs || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- SEÇÃO: PARECER JURÍDICO --- */}
                {sections.parecer && cliente.status_processo && (
                    <div className="p-[20mm] page-break-after">
                         <h2 className="text-2xl font-black border-b-2 border-slate-900 pb-2 mb-6 uppercase flex items-center gap-2"><Scale size={24}/> Parecer Conclusivo</h2>
                         <div className="bg-slate-50 border border-slate-300 p-6 text-justify text-[10pt] leading-loose">
                             <p className="mb-4">
                                 Com base na documentação apresentada, na entrevista colhida e na análise da linha do tempo contributiva/laboral, conclui-se que o segurado <strong>{cliente.nome}</strong> apresenta o status atual de: <strong>{cliente.status_processo.toUpperCase()}</strong>.
                             </p>
                             <p>
                                A presente análise foi processada considerando as regras da Instrução Normativa PRES/INSS nº 128/2022 e a jurisprudência dominante (TNU e STJ) acerca da comprovação da qualidade de segurado especial em regime de economia familiar.
                             </p>
                             <div className="mt-12 text-center no-break">
                                 <div className="border-t border-black w-1/2 mx-auto pt-2">
                                     <p className="font-bold uppercase text-sm">{officeProfile?.nome_advogado || "Advogado(a) Responsável"}</p>
                                     <p className="text-xs text-slate-500">{officeProfile?.oab || "OAB"}</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                )}

                {/* --- SEÇÃO: PROCURAÇÃO AD JUDICIA (OPCIONAL) --- */}
                {sections.procuracao && (
                    <div className="p-[20mm]">
                        <h2 className="text-center font-bold text-xl mb-12 uppercase tracking-wide border-b-2 border-black pb-2">Procuração Ad Judicia et Extra</h2>
                        <p className="mb-6 text-justify">
                            <strong className="uppercase">OUTORGANTE:</strong> <strong>{cliente.nome.toUpperCase()}</strong>, nacionalidade brasileira, estado civil {cliente.estado_civil || 'não informado'}, {cliente.profissao || 'Agricultor(a)'}, 
                            inscrito(a) no CPF sob o nº {cliente.cpf}, residente e domiciliado(a) em {cliente.endereco || '_________________________________'}.
                        </p>
                        <p className="mb-6 text-justify">
                            <strong className="uppercase">OUTORGADO(A):</strong> <strong>{officeProfile?.nome_advogado?.toUpperCase() || '_________________________________'}</strong>, advogado(a), inscrito(a) na OAB sob o nº <strong>{officeProfile?.oab || '___________'}</strong>, com escritório profissional em {officeProfile?.endereco_profissional || '_________________________________'}.
                        </p>
                        <p className="mb-6 text-justify">
                            <strong className="uppercase">PODERES:</strong> Pelo presente instrumento, constitui seu procurador o outorgado, conferindo-lhe os poderes da cláusula <em>ad judicia et extra</em> para o foro em geral, especificamente para propor as ações cabíveis, acompanhando-as até final decisão, podendo, para tanto, transigir, fazer acordo, firmar compromisso, substabelecer, renunciar, desistir, receber e dar quitação, requerer administrativamente e praticar todos os atos necessários à defesa de seus direitos previdenciários.
                        </p>

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
    </div>
  );
}