import { useState, useEffect } from "react";
import { 
  ArrowLeft, BrainCircuit, CheckCircle, AlertTriangle, 
  XCircle, FileText, Calculator, FolderOpen, BookOpen, Sparkles, Save
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { analisarViabilidade, AnalysisResult, calcularIdade } from "../../utils/benefitRules"; 
import { gerarParecerIA } from "../../lib/aiService"; 

interface LegalOpinionPageProps {
  clientId: number;
  onBack: () => void;
}

export function LegalOpinionPage({ clientId, onBack }: LegalOpinionPageProps) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [parecerIA, setParecerIA] = useState("");
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string | null>(null);
  
  // Teses da Biblioteca
  const [theses, setTheses] = useState<any[]>([]);
  const [selectedThesisId, setSelectedThesisId] = useState<string>("");

  // Entradas Manuais para o Simulador
  const [tempoRural, setTempoRural] = useState(15); 
  const [tempoUrbano, setTempoUrbano] = useState(0);
  const [selectedBenefit, setSelectedBenefit] = useState<'rural_idade' | 'hibrida' | 'maternidade'>('rural_idade');
  
  // Checklist de Documentos
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
    fetchClientData();
    fetchTheses(); 
  }, [clientId]);

  // Recalcula viabilidade matemática (Filtro 1)
  useEffect(() => {
    if (client) {
      const analise = analisarViabilidade(selectedBenefit, {
        sexo: client.sexo || 'Masculino',
        data_nascimento: client.data_nascimento,
        profissao: client.profissao,
        possui_cnpj: client.possui_cnpj,
        possui_outra_renda: client.possui_outra_renda,
        tempo_rural_anos: tempoRural,
        tempo_urbano_anos: tempoUrbano
      });
      setResultado(analise);
    }
  }, [client, selectedBenefit, tempoRural, tempoUrbano]);

  const fetchClientData = async () => {
    const { data } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (data) {
        setClient(data);
        // CARREGA A MEMÓRIA (SE JÁ TIVER PARECER SALVO)
        if (data.parecer_ia) {
            setParecerIA(data.parecer_ia);
            setLastAnalysisDate(data.data_ultima_analise);
        }
    }
    setLoading(false);
  };

  const fetchTheses = async () => {
      const { data } = await supabase
        .from('library_theses')
        .select('id, title, content, category')
        .eq('active', true)
        .order('title');
      
      if (data && data.length > 0) {
          setTheses(data);
          setSelectedThesisId(data[0].id.toString());
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
          // 1. Busca conteúdo da tese
          const teseSelecionada = theses.find(t => t.id.toString() === selectedThesisId);
          const conteudoTese = teseSelecionada ? teseSelecionada.content : "Lei Geral";

          // 2. Prepara pacote de dados
          const dadosCompletos = {
              ...client,
              idade_calculada: calcularIdade(client.data_nascimento),
              docs_checklist: docsChecklist
          };

          // 3. IA Gera o Texto
          const textoGerado = await gerarParecerIA(dadosCompletos, conteudoTese);
          setParecerIA(textoGerado);
          
          // 4. SALVA NO BANCO AUTOMATICAMENTE
          const now = new Date().toISOString();
          const { error } = await supabase
            .from('clients')
            .update({ 
                parecer_ia: textoGerado,
                data_ultima_analise: now
            })
            .eq('id', clientId);

          if (error) console.error("Erro ao salvar:", error);
          else setLastAnalysisDate(now);

      } catch (err) {
          alert("Erro ao gerar: " + err);
      } finally {
          setGenerating(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando dados...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="text-slate-600"/></button>
        <div>
           <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <BrainCircuit className="text-purple-600"/> Análise de Viabilidade
           </h1>
           <p className="text-xs text-slate-500">Versão 2.0 • Com Memória & Auditoria</p>
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
                onChange={(e) => setSelectedBenefit(e.target.value as any)}
                className="bg-slate-100 border border-slate-200 font-bold py-2 px-4 rounded-lg outline-none cursor-pointer"
             >
                 <option value="rural_idade">Aposentadoria Rural</option>
                 <option value="hibrida">Aposentadoria Híbrida</option>
                 <option value="maternidade">Salário Maternidade</option>
             </select>
        </div>

        {/* 1. CALCULADORA */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                 <Calculator size={16}/> 1. Requisitos Objetivos
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                     <label className="text-xs font-bold text-slate-600 mb-1 block">Tempo Rural (Anos)</label>
                     <input type="number" value={tempoRural} onChange={e => setTempoRural(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-bold text-emerald-700 outline-none focus:border-emerald-500"/>
                 </div>
                 <div>
                     <label className="text-xs font-bold text-slate-600 mb-1 block">Tempo Urbano (Anos)</label>
                     <input type="number" value={tempoUrbano} onChange={e => setTempoUrbano(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 font-bold text-blue-700 outline-none focus:border-blue-500" disabled={selectedBenefit === 'rural_idade'}/>
                 </div>
             </div>
             {resultado && (
                <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 transition-all ${resultado.status === 'aprovado' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : resultado.status === 'rejeitado' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    {resultado.status === 'aprovado' ? <CheckCircle size={20}/> : resultado.status === 'rejeitado' ? <XCircle size={20}/> : <AlertTriangle size={20}/>}
                    <div className="flex-1">
                        <span className="font-bold text-sm block">{resultado.status === 'aprovado' ? 'Requisitos Matemáticos Cumpridos' : resultado.status === 'rejeitado' ? 'Bloqueio Técnico' : 'Atenção Requerida'}</span>
                        <span className="text-xs opacity-90">{resultado.messages[0]}</span>
                    </div>
                </div>
             )}
        </section>

        {/* 2. DOCUMENTOS */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><FolderOpen size={16}/> 2. Prova Material</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {[
                     { id: 'certidao_casamento', label: 'Certidão Casamento/Nasc.' },
                     { id: 'itr_incra', label: 'ITR / CCIR / INCRA' },
                     { id: 'bloco_notas', label: 'Bloco de Notas / Produção' },
                     { id: 'declaracao_sindicato', label: 'Sindicato / Autodeclaração' },
                 ].map(doc => (
                     <label key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${docsChecklist[doc.id as keyof typeof docsChecklist] ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'}`}>
                         <input type="checkbox" checked={docsChecklist[doc.id as keyof typeof docsChecklist]} onChange={() => toggleDoc(doc.id as keyof typeof docsChecklist)} className="accent-emerald-600 w-4 h-4"/>
                         <span className="text-sm font-medium text-slate-700">{doc.label}</span>
                     </label>
                 ))}
             </div>
        </section>

        {/* 3. SELEÇÃO DA TESE & GERAÇÃO */}
        <div className="space-y-4">
            {/* SELETOR DE TESE */}
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
                                Gerado em: {lastAnalysisDate ? new Date(lastAnalysisDate).toLocaleString('pt-BR') : 'Agora'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                             <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold flex items-center gap-1"><Save size={10}/> Salvo</span>
                        </div>
                    </div>
                    
                    {/* Renderização do Markdown Simplificada */}
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