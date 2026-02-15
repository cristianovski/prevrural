import { useState, useEffect } from "react";
import { 
  ArrowLeft, Save, FileText, Mic, MicOff, UploadCloud, 
  Plus, Trash2, Paperclip, CheckCircle, Calendar, 
  AlertTriangle, BookOpen, Scale, Tractor, Users, 
  ShoppingBag, HelpCircle
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- LISTA DE DOCUMENTOS (30 ITENS) ---
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
  const [listeningField, setListeningField] = useState<string | null>(null);
  
  // Estado da Narrativa e Timeline
  const [historico, setHistorico] = useState("");
  const [timeline, setTimeline] = useState<any[]>([]);

  // Dados Estruturados (Novo Modelo JSON)
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

  // --- LÓGICA DE DITADO POR VOZ (RESTAURADA) ---
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

  // Helper para renderizar input com microfone
  const MicInput = ({ label, name, placeholder, textarea = false }: any) => (
      <div className="mb-1">
          <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-500 block">{label}</label>
              <button onClick={() => toggleListening(name)} className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-all ${listeningField === name ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-100'}`}>
                   {listeningField === name ? <><MicOff size={10}/> Gravando...</> : <><Mic size={10}/> Ditar</>}
              </button>
          </div>
          {textarea ? (
              <textarea name={name} value={ruralData[name]} onChange={handleRuralChange} rows={3} className={`w-full p-2 border rounded text-sm resize-none transition-colors ${listeningField === name ? 'bg-red-50 border-red-300' : ''}`} placeholder={placeholder} />
          ) : (
              <input name={name} value={ruralData[name]} onChange={handleRuralChange} className={`w-full p-2 border rounded text-sm transition-colors ${listeningField === name ? 'bg-red-50 border-red-300' : ''}`} placeholder={placeholder} />
          )}
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* HEADER */}
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="text-slate-600"/></button>
            <div>
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Tractor className="text-emerald-600"/> Entrevista & Provas</h1>
                <p className="text-xs text-slate-500">Cliente: {cliente.nome}</p>
            </div>
        </div>
        <button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2 transition disabled:opacity-50">
            {loading ? "Salvando..." : <><Save size={16}/> Salvar Tudo</>}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* MODO DITADO AVISO */}
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
            <HelpCircle className="text-blue-500 shrink-0" size={18}/>
            <p className="text-xs text-blue-700"><strong>Modo Ditado:</strong> Clique em "Ditar" nos campos abaixo para preencher falando. O sistema converte sua voz em texto automaticamente.</p>
        </div>
        
        {/* --- 1. DADOS DA ATIVIDADE RURAL --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b pb-2"><Tractor size={18} className="text-slate-400"/> 1. Dados da Atividade Rural</h3>

            {/* A. TERRA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2"><MicInput name="nome_imovel" label="Nome do Imóvel / Sítio" placeholder="Ex: Fazenda Boa Esperança"/></div>
                <div><MicInput name="municipio_uf" label="Município / UF"/></div>
                <div><MicInput name="itr_nirf" label="ITR / NIRF / CCIR" placeholder="Opcional"/></div>
                <div><MicInput name="area_total" label="Área Total (Hectares)"/></div>
                <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Condição de Posse</label>
                    <select name="condicao_posse" value={ruralData.condicao_posse} onChange={handleRuralChange} className="w-full p-2 border rounded text-sm bg-white">
                        <option value="proprietario">Proprietário</option>
                        <option value="posseiro">Posseiro</option>
                        <option value="arrendatario">Arrendatário</option>
                        <option value="parceiro">Parceiro / Meeiro</option>
                        <option value="comodatario">Comodatário</option>
                        <option value="assentado">Assentado</option>
                    </select>
                </div>
            </div>

            {/* B. OUTORGANTE */}
            {ruralData.condicao_posse !== 'proprietario' && ruralData.condicao_posse !== 'posseiro' && (
                 <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <label className="text-xs font-bold text-amber-800 block mb-2 flex items-center gap-1"><Users size={12}/> Proprietário da Terra (Outorgante)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MicInput name="outorgante_nome" label="Nome do Dono" placeholder="Nome Completo"/>
                        <MicInput name="outorgante_cpf" label="CPF do Dono" placeholder="000.000.000-00"/>
                    </div>
                 </div>
            )}

            {/* C. PRODUÇÃO E FAMÍLIA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <MicInput name="culturas" label="O que produz/cria?" placeholder="Ex: Milho, Feijão, Mandioca, Galinhas..." textarea/>
                <MicInput name="grupo_familiar" label="Grupo Familiar (Quem ajuda?)" placeholder="Nome dos filhos, esposa, parentes..." textarea/>
            </div>

            {/* D. COMERCIALIZAÇÃO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <MicInput name="locais_venda" label="Onde vende a produção?" placeholder="Ex: Feira, Cooperativa, Consumo Próprio"/>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Tem Empregados?</label>
                        <select name="tem_empregados" value={ruralData.tem_empregados} onChange={handleRuralChange} className="w-full p-2 border rounded text-sm bg-white">
                            <option value="nao">Não (Regime Familiar)</option>
                            <option value="sim">Sim (Temporário)</option>
                            <option value="sim_permanente">Sim (Permanente)</option>
                        </select>
                    </div>
                    {ruralData.tem_empregados !== 'nao' && (
                        <div><MicInput name="tempo_empregados" label="Por quanto tempo?" placeholder="Ex: 2 dias na colheita"/></div>
                    )}
                 </div>
            </div>
        </div>

        {/* 2. NARRATIVA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><FileText size={18} className="text-slate-400"/> 2. Narrativa dos Fatos</h3>
                <button onClick={() => toggleListening('historico', true)} className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all ${listeningField === 'historico' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                    {listeningField === 'historico' ? <><MicOff size={12}/> Gravando...</> : <><Mic size={12}/> Ditar História</>}
                </button>
            </div>
            <textarea 
                className={`w-full h-40 p-4 border rounded-xl outline-none text-sm leading-relaxed resize-none transition-colors ${listeningField === 'historico' ? 'bg-red-50 border-red-300' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500'}`}
                placeholder="Descreva a história rural: locais, patrões, safras, regime de economia familiar..."
                value={historico}
                onChange={e => setHistorico(e.target.value)}
            />
        </div>

        {/* 3. ACERVO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Paperclip size={18} className="text-slate-400"/> 3. Acervo Probatório (Documentos)</h3>

            {/* FORMULÁRIO UPLOAD */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Tipo de Documento</label>
                        <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-amber-500 text-sm">
                            {DOCUMENT_OPTIONS.map((d, i) => <option key={i} value={d.type}>{d.type}</option>)}
                        </select>
                    </div>

                    {newItem.type === 'Outros' ? (
                        <div className="md:col-span-3 animate-in fade-in">
                            <label className="text-xs font-bold text-slate-500 block mb-1">Nome</label>
                            <input className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm" placeholder="Nome..." value={newItem.customName} onChange={e => setNewItem({...newItem, customName: e.target.value})}/>
                        </div>
                    ) : <div className="md:col-span-3"/>}

                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 block mb-1">Ano</label>
                        <input type="number" placeholder="S/D" className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm" value={newItem.year} onChange={e => setNewItem({...newItem, year: e.target.value})}/>
                    </div>

                    <div className="md:col-span-2">
                        <div className="relative">
                            <input type="file" id="up" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            <label htmlFor="up" className={`flex justify-center gap-2 p-2.5 border border-dashed rounded-lg cursor-pointer transition-all ${newItem.fileUrl ? "bg-emerald-50 border-emerald-400 text-emerald-700" : "bg-white border-slate-300 hover:bg-slate-100"}`}>
                                {uploading ? <UploadCloud size={16} className="animate-bounce"/> : newItem.fileUrl ? <CheckCircle size={16}/> : <UploadCloud size={16}/>}
                            </label>
                        </div>
                    </div>

                    {selectedDocInfo && (
                        <div className="md:col-span-12 bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mt-2 flex flex-col gap-1">
                            <div className="flex gap-2 items-center font-bold"><Scale size={14}/> {selectedDocInfo.law}</div>
                            <div className="flex gap-2 items-start pl-5 opacity-90"><BookOpen size={14} className="mt-0.5 shrink-0"/> {selectedDocInfo.obs}</div>
                        </div>
                    )}

                    <div className="md:col-span-12 flex justify-end">
                        <button onClick={handleAddItem} disabled={!newItem.fileUrl} className={`px-6 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition ${newItem.fileUrl ? "bg-slate-800 text-white hover:bg-slate-700 shadow-sm" : "bg-slate-300 text-slate-500 cursor-not-allowed"}`}>
                            <Plus size={16}/> Adicionar à Lista
                        </button>
                    </div>
                </div>
            </div>

            {/* LISTA */}
            <div className="space-y-3">
                {timeline.length === 0 && (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                        <p>Nenhum documento adicionado ainda.</p>
                        <p className="text-xs mt-1">Faça o upload acima para começar.</p>
                    </div>
                )}
                {timeline.map((item, idx) => (
                    <div key={item.id || idx} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:border-amber-300 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="bg-amber-100 text-amber-800 font-bold px-3 py-2 rounded-lg text-sm min-w-[60px] text-center flex flex-col items-center">
                                <Calendar size={12} className="opacity-50 mb-0.5"/>
                                {item.year > 0 ? item.year : "S/D"}
                            </div>
                            <div>
                                <div className="font-bold text-slate-700">{item.type}</div>
                                {item.fileName ? (
                                    <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex gap-1 items-center mt-1 font-medium">
                                        <Paperclip size={12}/> {item.fileName}
                                    </a>
                                ) : <span className="text-xs text-slate-400 italic flex items-center gap-1 mt-1"><AlertTriangle size={10}/> Sem anexo</span>}
                            </div>
                        </div>
                        <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"><Trash2 size={18}/></button>
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}

export default RuralInterviewPage;