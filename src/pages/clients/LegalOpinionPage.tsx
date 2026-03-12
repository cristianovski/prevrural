import { useState, useEffect } from "react";
import { 
  ArrowLeft, BrainCircuit, CheckCircle, AlertTriangle, 
  XCircle, FileText, Calculator, FolderOpen, BookOpen, Sparkles, Save,
  Activity, Heart, Calendar, Eye, AlertCircle
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { analisarViabilidade, AnalysisResult, ClientData } from "../../utils/benefitRules"; 
import { useToast } from "../../hooks/use-toast";
import { Client } from "../../types";

interface LegalOpinionPageProps {
  cliente: Client;
  onBack: () => void;
}

const BENEFIT_TYPES = [
  "Aposentadoria por Idade Rural",
  "Salário Maternidade Rural",
  "Aposentadoria Híbrida",
  "Auxílio por incapacidade temporária", 
  "Auxílio por incapacidade permanente",
  "Pensão por morte"
];

export function LegalOpinionPage({ cliente, onBack }: LegalOpinionPageProps) {
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [parecerIA, setParecerIA] = useState("");
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string | null>(null);
  
  // Documentos
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [failedDocs, setFailedDocs] = useState<string[]>([]);
  const [ocrTexts, setOcrTexts] = useState<Record<string, string>>({});
  const [showOcr, setShowOcr] = useState<string | null>(null);
  
  // Teses da Biblioteca
  const [theses, setTheses] = useState<any[]>([]);
  const [selectedThesisId, setSelectedThesisId] = useState<string>("");

  // Entradas Manuais para o Simulador
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

  const [resultado, setResultado] = useState<AnalysisResult | null>(null);

  // Buscar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setClient(cliente); // usa o cliente passado
      await Promise.all([
        fetchTheses(),
        fetchDocuments()
      ]);
      setLoading(false);
    };
    loadData();
  }, [cliente]);

  // Recalcular viabilidade quando os parâmetros mudarem
  useEffect(() => {
    if (client) {
      const dadosAnalise: ClientData = {
        sexo: client.sexo || 'Masculino',
        data_nascimento: client.data_nascimento || '',
        profissao: client.profissao || '', // <-- CORREÇÃO: adicionado fallback para string vazia
        possui_cnpj: client.possui_cnpj,
        possui_outra_renda: client.possui_outra_renda,
        tempo_rural_anos: tempoRural,
        tempo_urbano_anos: tempoUrbano,
        ...extraParams
      };
      const analise = analisarViabilidade(selectedBenefit, dadosAnalise);
      setResultado(analise);
    }
  }, [client, selectedBenefit, tempoRural, tempoUrbano, extraParams]);

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

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', cliente.id)
      .eq('category', 'Provas')
      .order('reference_date', { ascending: false });
    
    if (data) {
      setDocuments(data);
      // Buscar cache de OCR para esses documentos
      const ids = data.map(d => d.id);
      const { data: cache } = await supabase
        .from('document_ocr_cache')
        .select('document_id, extracted_text')
        .in('document_id', ids);
      
      if (cache) {
        const ocrMap: Record<string, string> = {};
        cache.forEach(item => { ocrMap[item.document_id] = item.extracted_text; });
        setOcrTexts(ocrMap);
      }
    }
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleGenerateOpinion = async () => {
    console.log("1️⃣ Iniciando geração de parecer");
    
    if (!client) {
      console.log("❌ Cliente não encontrado");
      return;
    }
    if (!selectedThesisId) {
      toast({ title: "Atenção", description: "Selecione uma tese da biblioteca.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setFailedDocs([]);
    
    try {
      console.log("2️⃣ Preparando requisição para função");
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analisar-documentos`;
      console.log("URL:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          clientId: cliente.id,
          thesisId: selectedThesisId,
          documentIds: selectedDocs
        })
      });

      console.log("3️⃣ Resposta recebida, status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("4️⃣ Resposta de erro (texto):", errorText);
        throw new Error(`Erro ${response.status}: ${errorText.substring(0, 200)}`);
      }

      console.log("5️⃣ Resposta OK, lendo JSON...");
      const data = await response.json();
      console.log("6️⃣ JSON lido com sucesso");

      setParecerIA(data.parecer);
      setFailedDocs(data.failedDocs || []);
      setLastAnalysisDate(new Date().toISOString());
      
      toast({ title: "Sucesso", description: "Parecer gerado com IA.", variant: "success" });
      
      console.log("8️⃣ Recarregando documentos...");
      await fetchDocuments();

    } catch (err: any) {
      console.error("❌ Erro capturado:", err);
      console.error("Stack do erro:", err?.stack);
      toast({ 
        title: "Erro", 
        description: err?.message || "Erro ao gerar parecer. Verifique o console.", 
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
      console.log("9️⃣ Finalizado");
    }
  };

  const showDII = selectedBenefit.toLowerCase().includes("incapacidade");
  const showPensao = selectedBenefit.toLowerCase().includes("pensão") || selectedBenefit.toLowerCase().includes("morte");

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando dados...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans">
      <header className="bg-white border-b p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="text-slate-600"/></button>
        <div>
           <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <BrainCircuit className="text-purple-600"/> Análise IA & Viabilidade
           </h1>
           <p className="text-xs text-slate-500">Versão DeepSeek • Documentos analisados</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        
        {/* DADOS BÁSICOS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800">{client?.nome}</h2>
                <p className="text-slate-500 text-sm">CPF: {client?.cpf} • {client?.profissao}</p>
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

        {/* 2. DOCUMENTOS DO GED */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><FolderOpen size={16}/> 2. Provas do GED</h3>
             <p className="text-xs text-slate-400 mb-3">Selecione os documentos que deseja incluir na análise da IA. Os textos extraídos serão usados como fatos.</p>
             
             {failedDocs.length > 0 && (
               <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                 <AlertCircle size={16} className="shrink-0 mt-0.5"/>
                 <div>
                   <span className="font-bold">Falha ao processar:</span> {failedDocs.join(", ")}. Verifique o formato ou tente novamente.
                 </div>
               </div>
             )}

             <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg p-2">
               {documents.length === 0 ? (
                 <p className="text-center text-slate-400 py-4">Nenhum documento na categoria Provas.</p>
               ) : (
                 documents.map(doc => (
                   <div key={doc.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg border-b last:border-0">
                     <input
                       type="checkbox"
                       checked={selectedDocs.includes(doc.id)}
                       onChange={() => toggleDoc(doc.id)}
                       className="mt-1"
                     />
                     <FileText size={16} className="text-slate-400 mt-1"/>
                     <div className="flex-1">
                       <div className="flex justify-between">
                         <span className="text-sm font-medium">{doc.title}</span>
                         <span className="text-xs text-slate-400">{doc.reference_date ? doc.reference_date.split('-').reverse().join('/') : 'S/D'}</span>
                       </div>
                       {ocrTexts[doc.id] && (
                         <button
                           onClick={() => setShowOcr(showOcr === doc.id ? null : doc.id)}
                           className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1"
                         >
                           <Eye size={12}/> {showOcr === doc.id ? 'Ocultar texto extraído' : 'Ver texto extraído'}
                         </button>
                       )}
                       {showOcr === doc.id && ocrTexts[doc.id] && (
                         <div className="mt-2 p-2 bg-slate-100 rounded text-xs max-h-40 overflow-y-auto whitespace-pre-wrap">
                           {ocrTexts[doc.id]}
                         </div>
                       )}
                     </div>
                   </div>
                 ))
               )}
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
                                Gerado em: {lastAnalysisDate ? new Date(lastAnalysisDate).toLocaleString('pt-BR') : 'Agora'}
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