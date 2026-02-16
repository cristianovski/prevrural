import { useState, useEffect } from "react";
import { 
  ArrowLeft, Save, FileText, Mic, MicOff, UploadCloud, 
  Plus, Trash2, Paperclip, CheckCircle, Calendar, 
  AlertTriangle, BookOpen, Scale, Tractor, Users, 
  ShoppingBag, HelpCircle, LayoutList, ChevronRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- LISTA DE DOCUMENTOS (30 ITENS - MANTIDA INTEGRALMENTE) ---
const DOCUMENT_OPTIONS = [
  { type: "Autodeclaração do Segurado Especial", law: "Lei 8.213/91, Art. 38-B, § 2º; IN 128/2022, Art. 115", obs: "Principal para períodos anteriores a 2023. Deve ser ratificada por bases governamentais." },
  { type: "Bloco de Notas do Produtor Rural", law: "Lei 8.213/91, Art. 106, V; IN 128/2022, Art. 116, III", obs: "Prova robusta de comercialização e atividade ativa." },
  { type: "Carta de Concessão de Benefício Anterior", law: "IN 128/2022, Art. 115 e 116; Portaria 993/2022", obs: "Prova plena para o período em que o benefício (auxílio/maternidade) foi recebido." },
  { type: "Carteira de Vacinação", law: "IN 128/2022, Art. 116, XXV", obs: "Prova residência rural e acompanhamento por agentes locais. Fundamental para crianças/mães." },
  { type: "Certidão da FUNAI (Indígena)", law: "IN 128/2022, Art. 116, X; Súmula 657 STJ", obs: "Substitui autodeclaração para indígenas." },
  { type: "Certidão da Justiça Eleitoral", law: "PUIL 0006786-13.2011.4.01.4300", obs: "Certidão que consta a profissão declarada no cadastro eleitoral como lavrador." },
  { type: "Certidão de Casamento/União Estável", law: "IN 128/2022, Art. 116, XI; Súmula 6 TNU", obs: "Estende a profissão do cônjuge. Deve ser contemporânea ao período pedido." },
  { type: "Certidão de Nascimento/Batismo Filhos", law: "IN 128/2022, Art. 116, XII", obs: "Fixa a presença da família no meio rural em datas específicas." },
  { type: "Certidão de Óbito de Familiares", law: "STJ (Jurisprudência em Teses Ed. 94)", obs: "Óbito de parente constando lavrador/sítio serve como indício." },
  { type: "Certificado de Alistamento Militar", law: "IN 128/2022, Art. 116, XVI", obs: "Geralmente contém a profissão declarada pelo jovem (ex: lavrador)." },
  { type: "Comprovantes de Recolhimento (GPS)", law: "Lei 8.213/91, Art. 106, VIII", obs: "Se houver recolhimento facultativo ou por comercialização." },
  { type: "Contratos Agrários (Arrendamento/Parceria)", law: "Lei 8.213/91, Art. 106, II; IN 128/2022, Art. 116, I", obs: "Validade a partir do registro/reconhecimento de firma. Segurado deve ser o outorgado." },
  { type: "DAP ou CAF (Pronaf)", law: "Lei 8.213/91, Art. 106, IV; IN 128/2022, Art. 116, II", obs: "Forte instrumento ratificador. O INSS consulta o 'InfoDAP' para validar." },
  { type: "Declaração de Imposto de Renda (IRPF)", law: "Lei 8.213/91, Art. 106, IX; IN 128/2022, Art. 116, VII", obs: "Deve conter renda de comercialização rural declarada." },
  { type: "Documentos do 'Pater Familiae'", law: "Súmula 73 TRF4; Enunciado 8, V do CRPS", obs: "Documentos do cônjuge/pai servem como prova emprestada para todo o grupo familiar." },
  { type: "Documentos Escolares", law: "IN 128/2022, Art. 116, XVII", obs: "Escola rural ou ficha de matrícula indicando profissão dos pais como lavradores." },
  { type: "Escritura Pública de Imóvel", law: "IN 128/2022, Art. 116, XXI", obs: "Prova propriedade. Analisar com autodeclaração." },
  { type: "Ficha de Atendimento Médico/Odontológico", law: "IN 128/2022, Art. 116, XXXV", obs: "Fichas de postos (PSF) indicando profissão ou residência em zona rural." },
  { type: "Ficha de Crediário (Comércio/Insumos)", law: "Manual Aposentadoria Rural; IN 128/2022, Art. 116, XXVII", obs: "Cadastros em lojas de ferragens/veterinárias descrevendo o cliente como agricultor." },
  { type: "Ficha de Sindicato / Cooperativa", law: "IN 128/2022, Art. 116, XVIII e XXIX", obs: "Ficha de filiação antiga ou recibos servem como início de prova." },
  { type: "ITR ou CCIR", law: "IN 128/2022, Art. 116, IX; Tema 1115 STJ", obs: "Comprova posse da terra. Tamanho > 4 módulos não descaracteriza se houver economia familiar." },
  { type: "Licença de Ocupação / Permissão INCRA", law: "Lei 8.213/91, Art. 106, X; IN 128/2022, Art. 116, VIII", obs: "Documento específico para assentados da reforma agrária." },
  { type: "Notas Fiscais de Entrada", law: "Lei 8.213/91, Art. 106, VI; IN 128/2022, Art. 116, IV", obs: "Emitidas pela empresa compradora. Segurado deve constar como vendedor." },
  { type: "Prontuário Médico / Ficha Agente Saúde", law: "IN 128/2022, Art. 116, XXIV; TNU PEDILEF", obs: "Histórico do Agente de Saúde comprova visitação e residência contínua." },
  { type: "Publicação na Imprensa", law: "IN 128/2022, Art. 116, XXXI", obs: "Menções em jornais sobre colheitas, festas rurais ou premiações." },
  { type: "Recibo de Compra de Insumos/Implementos", law: "IN 128/2022, Art. 116, XXVII", obs: "Comprova investimento na produção (sementes, adubo, ferramentas)." },
  { type: "Recibo de Vacina (Febre Aftosa)", law: "IN 128/2022, Art. 116, XXVII", obs: "Prova de atividade pecuária ativa naquele ano." },
  { type: "Registro em Livros Religiosos (Sacramentos)", law: "IN 128/2022, Art. 116, XXXII", obs: "Batismo/Crisma citando a localidade rural ou profissão dos pais." },
  { type: "Título de Eleitor (Ficha Cadastro)", law: "IN 128/2022, Art. 116, XV", obs: "Deve constar a profissão declarada como agricultor/lavrador na época." },
  { type: "Outros", law: "Súmula 149 STJ", obs: "Qualquer outro documento contemporâneo que indique a lida rural." }
];

interface RuralInterviewPageProps {
  cliente: any;
  onBack: () => void;
}

export function RuralInterviewPage({ cliente, onBack }: RuralInterviewPageProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'narrativa' | 'docs'>('dados');
  const [listeningField, setListeningField] = useState<string | null>(null);
  
  // Estado da Narrativa e Timeline
  const [historico, setHistorico] = useState("");
  const [timeline, setTimeline] = useState<any[]>([]);

  // Dados Estruturados
  const [ruralData, setRuralData] = useState<any>({
    nome_imovel: "",
    itr_nirf: "",
    area_total: "",
    area_util: "",
    municipio_uf: "",
    condicao_posse: "proprietario",
    outorgante_nome: "",
    outorgante_cpf: "",
    culturas: "",
    animais: "",
    destinacao: "subsistencia_venda",
    locais_venda: "",
    tem_empregados: "nao",
    tempo_empregados: "",
    grupo_familiar: ""
  });

  const [newItem, setNewItem] = useState({
    type: DOCUMENT_OPTIONS[0].type,
    customName: "", 
    year: "", 
    fileUrl: "",
    fileName: ""
  });

  const selectedDocInfo = DOCUMENT_OPTIONS.find(d => d.type === newItem.type);

  useEffect(() => {
    if (cliente?.id) loadInterview();
  }, [cliente]);

  const loadInterview = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('interviews')
        .select('*')
        .eq('client_id', cliente.id)
        .maybeSingle();

      if (data) {
        setHistorico(data.historico_locais || "");
        if (Array.isArray(data.timeline_json)) {
          setTimeline(data.timeline_json);
        }
        if (data.dados_rurais) {
            setRuralData({ ...ruralData, ...data.dados_rurais });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRuralChange = (e: any) => {
    setRuralData({ ...ruralData, [e.target.name]: e.target.value });
  };

  // --- LÓGICA DE DITADO (MANTIDA) ---
  const toggleListening = (fieldName: string, isNarrative: boolean = false) => {
    if (listeningField === fieldName) {
        setListeningField(null);
        return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Navegador sem suporte a voz.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    
    recognition.onstart = () => setListeningField(fieldName);
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (isNarrative) {
            setHistorico(prev => (prev ? prev + ' ' : '') + transcript);
        } else {
            setRuralData((prev: any) => ({
                ...prev,
                [fieldName]: (prev[fieldName] ? prev[fieldName] + ' ' : '') + transcript
            }));
        }
        setListeningField(null);
    };
    recognition.onerror = () => setListeningField(null);
    recognition.onend = () => setListeningField(null);
    recognition.start();
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
        const name = file.name || "doc";
        const fileExt = name.split('.').pop() || "bin";
        const fileName = `${cliente.id}/${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: err } = await supabase.storage.from('evidence-files').upload(fileName, file);
        if (err) throw err;

        const { data } = supabase.storage.from('evidence-files').getPublicUrl(fileName);
        
        setNewItem(prev => ({ ...prev, fileUrl: data.publicUrl, fileName: name }));

    } catch (error: any) {
        alert("Erro upload: " + error.message);
    } finally {
        setUploading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.fileUrl) return alert("Faça o upload do documento primeiro.");

    const finalName = newItem.type === 'Outros' ? (newItem.customName || 'Documento') : newItem.type;
    const yearVal = newItem.year ? parseInt(newItem.year) : 0;

    const item = {
        id: Math.random().toString(36).substring(7),
        type: finalName,
        year: yearVal,
        fileUrl: newItem.fileUrl,
        fileName: newItem.fileName,
        law: selectedDocInfo?.law || ""
    };

    setTimeline(prev => [...prev, item].sort((a, b) => a.year - b.year));
    setNewItem(prev => ({ ...prev, year: "", fileUrl: "", fileName: "", customName: "" }));
  };

  const handleRemoveItem = (id: string) => {
    if (confirm("Remover documento?")) setTimeline(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        const { error } = await supabase.from('interviews').upsert({
            client_id: cliente.id,
            historico_locais: historico,
            timeline_json: timeline,
            dados_rurais: ruralData,
            updated_at: new Date()
        }, { onConflict: 'client_id' });

        if (error) throw error;
        alert("Salvo com sucesso!");
    } catch (err: any) {
        alert("Erro ao salvar: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // Helper renderizado com estilo atualizado
  const MicInput = ({ label, name, placeholder, textarea = false }: any) => (
      <div className="mb-4">
          <label className="text-xs font-bold text-slate-500 mb-1.5 flex justify-between items-center">
              {label}
              <button onClick={() => toggleListening(name)} className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-all ${listeningField === name ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-100 hover:text-emerald-600'}`}>
                   {listeningField === name ? <><MicOff size={10}/> Gravando...</> : <><Mic size={10}/> Ditar</>}
              </button>
          </label>
          {textarea ? (
              <textarea name={name} value={ruralData[name]} onChange={handleRuralChange} rows={3} className={`w-full p-3 border rounded-xl text-sm resize-none transition-all outline-none focus:ring-4 focus:ring-emerald-500/10 ${listeningField === name ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'}`} placeholder={placeholder} />
          ) : (
              <input name={name} value={ruralData[name]} onChange={handleRuralChange} className={`w-full p-3 border rounded-xl text-sm transition-all outline-none focus:ring-4 focus:ring-emerald-500/10 ${listeningField === name ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'}`} placeholder={placeholder} />
          )}
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-600">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Entrevista & Provas
                </h1>
                <p className="text-xs font-medium text-slate-500">{cliente.nome}</p>
            </div>
        </div>
        <button onClick={handleSave} disabled={loading} className="bg-slate-900 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 flex items-center gap-2 transition-all disabled:opacity-50 hover:scale-105 active:scale-95">
            {loading ? "Salvando..." : <><Save size={18}/> Salvar Tudo</>}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR DE NAVEGAÇÃO (WIZARD) */}
        <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col p-6 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Etapas da Entrevista</h3>
            <nav className="space-y-2">
                <button onClick={() => setActiveTab('dados')} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'dados' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <Tractor size={18}/> Dados da Terra
                </button>
                <button onClick={() => setActiveTab('narrativa')} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'narrativa' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <FileText size={18}/> Narrativa
                </button>
                <button onClick={() => setActiveTab('docs')} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'docs' ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <Paperclip size={18}/> Documentos
                    <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] py-0.5 px-2 rounded-full font-bold">{timeline.length}</span>
                </button>
            </nav>

            <div className="mt-auto bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex gap-2 items-start text-xs text-blue-700">
                    <HelpCircle size={16} className="shrink-0 mt-0.5"/>
                    <p>Use o botão <strong>Ditar</strong> para preencher os campos falando. O sistema transcreve automaticamente.</p>
                </div>
            </div>
        </aside>

        {/* ÁREA PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* --- ABA 1: DADOS RURAIS --- */}
                {activeTab === 'dados' && (
                    <div className="space-y-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Atividade Rural</h2>
                            <p className="text-slate-500">Detalhes sobre a propriedade, regime de economia e produção.</p>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><LayoutList size={20} className="text-emerald-500"/> Caracterização do Imóvel</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <MicInput name="nome_imovel" label="Nome do Imóvel / Sítio" placeholder="Ex: Fazenda Boa Esperança"/>
                                <MicInput name="municipio_uf" label="Município / UF"/>
                                <MicInput name="itr_nirf" label="ITR / NIRF / CCIR" placeholder="Opcional"/>
                                <div className="grid grid-cols-2 gap-4">
                                    <MicInput name="area_total" label="Área Total (Ha)"/>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Condição de Posse</label>
                                        <div className="relative">
                                            <select name="condicao_posse" value={ruralData.condicao_posse} onChange={handleRuralChange} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none">
                                                <option value="proprietario">Proprietário</option>
                                                <option value="posseiro">Posseiro</option>
                                                <option value="arrendatario">Arrendatário</option>
                                                <option value="parceiro">Parceiro / Meeiro</option>
                                                <option value="comodatario">Comodatário</option>
                                                <option value="assentado">Assentado</option>
                                            </select>
                                            <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400"><ChevronRight size={14} className="rotate-90"/></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CONDICIONAL: SE NÃO FOR PROPRIETÁRIO */}
                            {!['proprietario', 'posseiro'].includes(ruralData.condicao_posse) && (
                                <div className="mt-4 p-5 bg-amber-50 rounded-2xl border border-amber-100 animate-in fade-in">
                                    <h4 className="font-bold text-amber-800 text-sm mb-4 flex items-center gap-2"><Users size={16}/> Dados do Proprietário da Terra (Outorgante)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <MicInput name="outorgante_nome" label="Nome do Dono" placeholder="Nome Completo"/>
                                        <MicInput name="outorgante_cpf" label="CPF do Dono" placeholder="000.000.000-00"/>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><ShoppingBag size={20} className="text-emerald-500"/> Produção & Família</h3>
                            
                            <div className="space-y-4">
                                <MicInput name="culturas" label="O que produz/cria?" placeholder="Ex: Milho, Feijão, Mandioca, Galinhas..." textarea/>
                                <MicInput name="grupo_familiar" label="Grupo Familiar (Quem ajuda?)" placeholder="Nome dos filhos, esposa, parentes..." textarea/>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <MicInput name="locais_venda" label="Onde vende a produção?" placeholder="Ex: Feira, Cooperativa, Consumo Próprio"/>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Tem Empregados?</label>
                                            <div className="relative">
                                                <select name="tem_empregados" value={ruralData.tem_empregados} onChange={handleRuralChange} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none">
                                                    <option value="nao">Não</option>
                                                    <option value="sim">Sim (Temp.)</option>
                                                    <option value="sim_permanente">Sim (Perm.)</option>
                                                </select>
                                                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400"><ChevronRight size={14} className="rotate-90"/></div>
                                            </div>
                                        </div>
                                        {ruralData.tem_empregados !== 'nao' && (
                                            <div className="animate-in fade-in"><MicInput name="tempo_empregados" label="Tempo?" placeholder="Dias/ano"/></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={() => setActiveTab('narrativa')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 flex items-center gap-2 hover:scale-105 transition-all">
                                Próxima Etapa <ChevronRight size={16}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- ABA 2: NARRATIVA --- */}
                {activeTab === 'narrativa' && (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Narrativa Fática</h2>
                            <p className="text-slate-500">A história de vida rural do cliente para a petição inicial.</p>
                        </div>

                        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm h-[60vh] flex flex-col relative">
                            <button 
                                onClick={() => toggleListening('historico', true)} 
                                className={`absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all shadow-sm z-10 ${listeningField === 'historico' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'}`}
                            >
                                {listeningField === 'historico' ? <><MicOff size={14}/> Gravando...</> : <><Mic size={14}/> Iniciar Ditado</>}
                            </button>

                            <textarea 
                                className={`w-full h-full p-6 border rounded-2xl outline-none text-base leading-relaxed resize-none transition-colors ${listeningField === 'historico' ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'}`}
                                placeholder="Clique em 'Iniciar Ditado' e conte a história do cliente..."
                                value={historico}
                                onChange={e => setHistorico(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={() => setActiveTab('docs')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 flex items-center gap-2 hover:scale-105 transition-all">
                                Ir para Documentos <ChevronRight size={16}/>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- ABA 3: DOCUMENTOS --- */}
                {activeTab === 'docs' && (
                    <div className="space-y-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Acervo Probatório</h2>
                            <p className="text-slate-500">Adicione e gerencie as provas materiais do processo.</p>
                        </div>

                        {/* CARD DE ADIÇÃO */}
                        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                                <div className="md:col-span-6">
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Tipo de Documento</label>
                                    <div className="relative">
                                        <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none">
                                            {DOCUMENT_OPTIONS.map((d, i) => <option key={i} value={d.type}>{d.type}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400"><ChevronRight size={14} className="rotate-90"/></div>
                                    </div>
                                </div>

                                {newItem.type === 'Outros' && (
                                    <div className="md:col-span-6 animate-in fade-in slide-in-from-left-2">
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Nome do Documento</label>
                                        <input className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:border-emerald-500" placeholder="Digite o nome..." value={newItem.customName} onChange={e => setNewItem({...newItem, customName: e.target.value})}/>
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 mb-1.5 block">Ano</label>
                                    <input type="number" placeholder="2024" className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 outline-none focus:border-emerald-500 text-center font-bold text-slate-700" value={newItem.year} onChange={e => setNewItem({...newItem, year: e.target.value})}/>
                                </div>

                                <div className="md:col-span-4">
                                    <input type="file" id="up" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                    <label htmlFor="up" className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${newItem.fileUrl ? "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold" : "bg-slate-50 border-slate-300 hover:bg-slate-100 text-slate-500"}`}>
                                        {uploading ? <UploadCloud size={18} className="animate-bounce"/> : newItem.fileUrl ? <><CheckCircle size={18}/> Arquivo OK</> : <><UploadCloud size={18}/> Anexar Arquivo</>}
                                    </label>
                                </div>
                            </div>

                            {selectedDocInfo && (
                                <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0"><Scale size={16}/></div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 mb-0.5">{selectedDocInfo.law}</p>
                                        <p className="text-xs text-blue-600/80 leading-relaxed">{selectedDocInfo.obs}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end mt-6">
                                <button onClick={handleAddItem} disabled={!newItem.fileUrl} className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${newItem.fileUrl ? "bg-slate-900 text-white hover:bg-emerald-600 hover:shadow-emerald-500/20 hover:scale-105" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                                    <Plus size={18}/> Adicionar à Lista
                                </button>
                            </div>
                        </div>

                        {/* LISTA DE DOCUMENTOS */}
                        <div className="grid grid-cols-1 gap-4">
                            {timeline.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                        <Paperclip size={24}/>
                                    </div>
                                    <p className="text-slate-500 font-medium">Nenhum documento adicionado.</p>
                                </div>
                            )}
                            {timeline.map((item, idx) => (
                                <div key={item.id || idx} className="bg-white p-4 pr-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 hover:border-emerald-200 hover:shadow-md transition-all group">
                                    <div className="w-16 h-16 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Ano</span>
                                        <span className="text-lg font-black text-slate-700">{item.year || "?"}</span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{item.type}</h4>
                                        {item.fileName && (
                                            <a href={item.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 hover:underline mt-1 transition-colors">
                                                <Paperclip size={12}/> {item.fileName}
                                            </a>
                                        )}
                                    </div>

                                    <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                        <Trash2 size={20}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </main>
      </div>
    </div>
  );
}

export default RuralInterviewPage;