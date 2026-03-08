import { useState, useEffect } from "react";
import { 
  ArrowLeft, BrainCircuit, CheckCircle, AlertTriangle, 
  XCircle, FileText, Calculator, FolderOpen, BookOpen, Sparkles, Save,
  Activity, Heart
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { analisarViabilidade, AnalysisResult, calcularIdade, ClientData } from "../../utils/benefitRules"; 
import { gerarParecerIA } from "../../lib/aiService"; 
// FIX: Tipagens rigorosas e função de fuso horário importadas
import { Client, LibraryThesis } from "../../types"; 
import { getLocalDateISO } from "../../lib/utils";

interface LegalOpinionPageProps {
  clientId: number;
  onBack: () => void;
}

// FIX: Estendemos o tipo Client para incluir os campos específicos de IA sem alterar a interface global
interface ClientWithOpinion extends Client {
    parecer_ia?: string;
    data_ultima_analise?: string;
}

const BENEFIT_TYPES = [
  "Aposentadoria por Idade Rural",
  "Salário Maternidade Rural",
  "Aposentadoria Híbrida",
  "Auxílio por incapacidade temporária", 
  "Auxílio por incapacidade permanente",
  "Pensão por morte"
];

export function LegalOpinionPage({ clientId, onBack }: LegalOpinionPageProps) {
  // FIX: Adeus 'any'. Tipagem forte aplicada.
  const [client, setClient] = useState<ClientWithOpinion | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [parecerIA, setParecerIA] = useState("");
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string | null>(null);
  
  // FIX: Tipagem forte para as teses
  const [theses, setTheses] = useState<LibraryThesis[]>([]);
  const [selectedThesisId, setSelectedThesisId] = useState<string>("");

  const [tempoRural, setTempoRural] = useState(15); 
  const [tempoUrbano, setTempoUrbano] = useState(0);
  const [selectedBenefit, setSelectedBenefit] = useState(BENEFIT_TYPES[0]);
  
  const [extraParams, setExtraParams] = useState({
    data_dii: "",
    is_acidente: false,
    data_obito: "",
    data_casamento: "",
    idade_conjuge_obito: 0
  });

  const [docsChecklist, setDocsChecklist] = useState({
    certidao_casamento: false,
    historico_escolar: false,
    certidao_nascimento_filhos: false,
    itr_incra: false,
    bloco_notas: false,
    declaracao_sindicato: false,
    autodeclaracao: false,
    outros: false
  });

  const [resultado, setResultado] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    loadAllData();
  }, [clientId]);

  useEffect(() => {
    if (client) {
      const dadosAnalise: ClientData = {
        sexo: client.sexo || 'Masculino',
        data_nascimento: client.data_nascimento || "",
        profissao: client.profissao || "Rural",
        possui_cnpj: client.possui_cnpj || false,
        possui_outra_renda: client.possui_outra_renda || false,
        tempo_rural_anos: tempoRural,
        tempo_urbano_anos: tempoUrbano,
        ...extraParams 
      };

      const analise = analisarViabilidade(selectedBenefit, dadosAnalise);
      setResultado(analise);
    }
  }, [client, selectedBenefit, tempoRural, tempoUrbano, extraParams]);

  // FIX: Fim do Network Waterfall. Consultamos Cliente e Teses em paralelo.
  const loadAllData = async () => {
    setLoading(true);
    try {
        const [clientRes, thesesRes] = await Promise.all([
            supabase.from('clients').select('*').eq('id', clientId).single(),
            supabase.from('library_theses').select('id, title, content, category').eq('active', true).order('title')
        ]);

        if (clientRes.data) {
            const data = clientRes.data as ClientWithOpinion;
            setClient(data);
            if (data.parecer_ia) {
                setParecerIA(data.parecer_ia);
                setLastAnalysisDate(data.data_ultima_analise || null);
            }
        }

        if (thesesRes.data && thesesRes.data.length > 0) {
            const fetchedTheses = thesesRes.data as LibraryThesis[];
            setTheses(fetchedTheses);
            setSelectedThesisId(fetchedTheses[0].id.toString());
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    } finally {
        setLoading(false);
    }
  };

  const toggleDoc = (key: keyof typeof docsChecklist) => {
      setDocsChecklist(prev => ({...prev, [key]: !prev[key]}));
  };

  const handleGenerateOpinion = async () => {
      if (!client) return;
      if (!selectedThesisId) return alert("Por favor, selecione uma Tese na lista antes de gerar.");

      setGenerating(true);
      
      try {
          const teseSelecionada = theses.find(t => t.id.toString() === selectedThesisId);
          const conteudoTese = teseSelecionada ? teseSelecionada.content : "Lei Geral";

          const dadosCompletos = {
              ...client,
              idade_calculada: calcularIdade(client.data_nascimento || ""),
              docs_checklist: docsChecklist,
              beneficio_alvo: selectedBenefit,
              detalhes_beneficio: extraParams 
          };

          const textoGerado = await gerarParecerIA(dadosCompletos, conteudoTese);
          setParecerIA(textoGerado);
          
          // FIX: Utilizamos a função getLocalDateISO para manter o fuso horário correto
          const now = getLocalDateISO();
          const { error } = await supabase
            .from('clients')
            .update({ 
                parecer_ia: textoGerado,
                data_ultima_analise: now
            })
            .eq('id', clientId);

          if (error) console.error("Erro ao salvar:", error);
          else setLastAnalysisDate(now);

      } catch (err: unknown) { // FIX: Tipagem de erro corrigida
          const msg = err instanceof Error ? err.message : "Erro desconhecido ao comunicar com a IA.";
          alert("Erro ao gerar: " + msg);
      } finally {
          setGenerating(false);
      }
  };

  const showDII = selectedBenefit.toLowerCase().includes("incapacidade");
  const showPensao = selectedBenefit.toLowerCase().includes("pensão") || selectedBenefit.toLowerCase().includes("morte");

  if (loading || !client) return <div className="p-8 text-center text-slate-500 font-bold">A carregar interface de auditoria...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="text-slate-600"/></button>
        <div>
           <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <BrainCircuit className="text-purple-600"/> Análise IA & Viabilidade
           </h1>
           <p className="text-xs text-slate-500">Versão 3.0 • Multibenefícios</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        
        {/* DADOS BÁSICOS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800">{client.nome}</h2>
                <p className="text-slate-500 text-sm">CPF: {client.cpf} • {client.profissao}</p>
            </div>
            <select 
                value={selectedBenefit}
                onChange={(e) => setSelectedBenefit(e.target.value)}
                className="bg-purple-50 border border-purple-200 text-purple-900 font-bold py-2 px-4 rounded-lg outline-none cursor-pointer"
            >
                 {BENEFIT_TYPES.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                 ))}
             </select>
        </div>

        {/* 1. REQUISITOS OBJETIVOS */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                 <Calculator size={16}/> 1. Requisitos Objetivos
             </h3>
             
             {/* CAMPOS PADRÃO */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div>
                     <label className="text-xs font-bold text-slate-600 mb-1 block">Tempo Rural (Anos)</label>
                     <input type="number" value={tempoRural} onChange={e => setTempoRural(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-bold text-emerald-700 outline-none focus:border-emerald-500"/>
                 </div>
                 <div>
                     <label className="text-xs font-bold text-slate-600 mb-1 block">Tempo Urbano (Anos)</label>
                     <input type="number" value={tempoUrbano} onChange={e => setTempoUrbano(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-bold text-blue-700 outline-none focus:border-blue-500" disabled={selectedBenefit.includes('Rural') && !selectedBenefit.includes('Híbrida')}/>
                 </div>
             </div>

             {/* CAMPOS DINÂMICOS (INCAPACIDADE / PENSÃO) */}
             {(showDII || showPensao) && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 animate-in fade-in">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                        {showDII ? <Activity size={14}/> : <Heart size={14}/>} Dados Específicos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {showDII && (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1 block">Data Início Incapacidade (DII)</label>
                                    <input type="date" value={extraParams.data_dii} onChange={e => setExtraParams({...extraParams, data_dii: e.target.value})} className="w-full p-2 border rounded bg-white text-sm"/>
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                                        <input type="checkbox" checked={extraParams.is_acidente} onChange={e => setExtraParams({...extraParams, is_acidente: e.target.checked})} className="w-4 h-4"/>
                                        Acidente / Doença Grave?
                                    </label>
                                </div>
                            </>
                        )}
                        {showPensao && (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1 block">Data do Óbito</label>
                                    <input type="date" value={extraParams.data_obito} onChange={e => setExtraParams({...extraParams, data_obito: e.target.value})} className="w-full p-2 border rounded bg-white text-sm"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1 block">Data Casamento</label>
                                    <input type="date" value={extraParams.data_casamento} onChange={e => setExtraParams({...extraParams, data_casamento: e.target.value})} className="w-full p-2 border rounded bg-white text-sm"/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1 block">Idade Viúvo(a)</label>
                                    <input type="number" value={extraParams.idade_conjuge_obito} onChange={e => setExtraParams({...extraParams, idade_conjuge_obito: Number(e.target.value)})} className="w-full p-2 border rounded bg-white text-sm"/>
                                </div>
                            </>
                        )}
                    </div>
                </div>
             )}

             {resultado && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${resultado.status === 'aprovado' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : resultado.status === 'rejeitado' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    {resultado.status === 'aprovado' ? <CheckCircle size={20}/> : resultado.status === 'rejeitado' ? <XCircle size={20}/> : <AlertTriangle size={20}/>}
                    <div className="flex-1">
                        <span className="font-bold text-sm block mb-1">
                            {resultado.status === 'aprovado' ? 'Viabilidade Técnica Confirmada' : resultado.status === 'rejeitado' ? 'Inviabilidade Detectada' : 'Pontos de Atenção'}
                        </span>
                        <ul className="text-xs opacity-90 space-y-1">
                            {resultado.messages.map((m, i) => <li key={i}>• {m}</li>)}
                        </ul>
                    </div>
                </div>
             )}
        </section>

        {/* 2. DOCUMENTOS */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><FolderOpen size={16}/> 2. Prova Material (Checklist)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {[
                     { id: 'certidao_casamento', label: 'Certidão Casamento/Nasc.' },
                     { id: 'itr_incra', label: 'ITR / CCIR / INCRA' },
                     { id: 'bloco_notas', label: 'Bloco de Notas / Produção' },
                     { id: 'declaracao_sindicato', label: 'Sindicato / Autodeclaração' },
                     { id: 'historico_escolar', label: 'Histórico Escolar' },
                     { id: 'outros', label: 'Outros Indícios de Prova' }
                 ].map(doc => (
                     <label key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${docsChecklist[doc.id as keyof typeof docsChecklist] ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                         <input type="checkbox" checked={docsChecklist[doc.id as keyof typeof docsChecklist]} onChange={() => toggleDoc(doc.id as keyof typeof docsChecklist)} className="accent-emerald-600 w-4 h-4"/>
                         <span className="text-sm font-medium text-slate-700">{doc.label}</span>
                     </label>
                 ))}
             </div>
        </section>

        {/* 3. SELEÇÃO DA TESE & GERAÇÃO */}
        <div className="space-y-4">
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                 <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-emerald-400 uppercase mb-1 flex items-center gap-2"><BookOpen size={12}/> Estratégia / Tese Jurídica</label>
                        <select 
                            value={selectedThesisId}
                            onChange={e => setSelectedThesisId(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg p-3 outline-none focus:border-emerald-500 cursor-pointer"
                        >
                            {theses.length === 0 && <option value="">Nenhuma tese encontrada na biblioteca...</option>}
                            {theses.map(t => (
                                <option key={t.id} value={t.id}>{t.title} ({t.category})</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={handleGenerateOpinion} 
                        disabled={generating || resultado?.status === 'rejeitado' || theses.length === 0}
                        className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold px-6 py-3 rounded-lg shadow-lg transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {generating ? <Sparkles className="animate-spin"/> : <BrainCircuit/>}
                        {generating ? "Analisando..." : "Gerar Parecer IA"}
                    </button>
                </div>
            </div>

            {/* ÁREA DO RESULTADO (PARECER) */}
            {parecerIA && (
                <div className="bg-white p-8 rounded-2xl border-l-4 border-emerald-500 shadow-lg animate-in fade-in slide-in-from-bottom-4 relative">
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                            <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2"><FileText/> Parecer Técnico</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Gerado em: {lastAnalysisDate ? new Date(lastAnalysisDate).toLocaleDateString('pt-BR') : 'Agora'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                             <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold flex items-center gap-1"><Save size={10}/> Salvo</span>
                        </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line font-medium leading-relaxed">
                        {parecerIA}
                    </div>
                </div>
            )}
        </div>

      </main>
    </div>
  );
}