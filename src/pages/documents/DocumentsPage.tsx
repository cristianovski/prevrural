import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Printer, Sparkles, MessageSquare, Send, 
  FileText, X, Bold, AlignCenter, AlignJustify, Type, 
  List, ListOrdered, Undo, Redo, Underline, Indent, Outdent, Download, AlignLeft,
  Settings, Save
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';
import { Client, LibraryThesis, OfficeProfile } from "../../types";

// CHAVE API DO .ENV
const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const MODEL_CANDIDATES = ["gemini-2.0-flash", "gemini-1.5-flash"];

interface DocumentsPageProps {
  cliente: Client; 
  onBack: () => void;
}

interface OfficeProfileExtended extends Partial<OfficeProfile> {
    nome_advogado?: string;
    oab?: string;
    endereco_profissional?: string;
    cidade_uf?: string;
}

interface ToolBtnProps {
    cmd: string;
    icon: React.ElementType;
    title?: string;
}

export function DocumentsPage({ cliente, onBack }: DocumentsPageProps) {
  const [templates, setTemplates] = useState<LibraryThesis[]>([]); 
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [documentHtml, setDocumentHtml] = useState("");
  const [generating, setGenerating] = useState(false);
  
  const [officeProfile, setOfficeProfile] = useState<OfficeProfileExtended | null>(null); 
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ nome: "", oab: "", endereco: "", cidade: "" });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllData(); 
  }, []);

  useEffect(() => {
    if (!generating && editorRef.current && documentHtml) {
        if (editorRef.current.innerHTML !== documentHtml) {
            editorRef.current.innerHTML = documentHtml;
        }
    }
  }, [generating, documentHtml]); 

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatOpen]);

  // FIX: Supabase returns a builder, not a raw Promise. We handle them cleanly here.
  const loadAllData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const thesesPromise = supabase.from('library_theses').select('*').ilike('category', '%Modelo%').eq('active', true);
    const officePromise = user ? supabase.from('office_profile').select('*').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null });

    const [thesesRes, officeRes] = await Promise.all([thesesPromise, officePromise]);

    if (thesesRes?.data) setTemplates(thesesRes.data as LibraryThesis[]);

    if (officeRes?.data) {
        const data = officeRes.data as OfficeProfileExtended;
        setOfficeProfile(data);
        setConfigForm({
            nome: data.nome_advogado || "",
            oab: data.oab || "",
            endereco: data.endereco_profissional || "",
            cidade: data.cidade_uf || ""
        });
    } else if (user) {
        setIsConfigOpen(true);
    }
  };

  const handleSaveConfig = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
          user_id: user.id,
          nome_advogado: configForm.nome,
          oab: configForm.oab,
          endereco_profissional: configForm.endereco,
          cidade_uf: configForm.cidade
      };

      if (officeProfile?.id) {
          await supabase.from('office_profile').update(payload).eq('id', officeProfile.id);
      } else {
          await supabase.from('office_profile').insert(payload);
      }
      
      await loadAllData();
      setIsConfigOpen(false);
      alert("Dados do escritório salvos!");
  };

  const generateWithFallback = async (prompt: string) => {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      for (const modelName of MODEL_CANDIDATES) {
          try {
              const model = genAI.getGenerativeModel({ model: modelName });
              const result = await model.generateContent(prompt);
              return result.response.text();
          } catch (e) {
              console.warn(`Falha ao gerar com modelo ${modelName}`, e);
          }
      }
      throw new Error("Falha ao comunicar com os modelos da IA.");
  };

  const handleSelectTemplate = async (template: LibraryThesis) => {
    if (!officeProfile) {
        alert("Por favor, configure os dados do escritório (botão de engrenagem) antes de gerar documentos.");
        setIsConfigOpen(true);
        return;
    }

    setSelectedTemplateId(template.id);
    setGenerating(true);
    setDocumentHtml(""); 
    
    try {
        const rawText = template.content;
        const prompt = `
        Aja como um Assistente Jurídico Expert.
        
        CONTEXTO: Você está gerando um documento para um sistema multiusuário.
        Você deve cruzar os dados do CLIENTE com os dados do ADVOGADO/ESCRITÓRIO para preencher o modelo.
        
        1. DADOS DO CLIENTE (CONTRATANTE):
        Nome: ${cliente.nome}
        CPF: ${cliente.cpf}
        Profissão: ${cliente.profissao || "Não informada"}
        Estado Civil: ${cliente.estado_civil || "Não informado"}
        Endereço: ${cliente.endereco || "Endereço não cadastrado"}
        RG: ${cliente.rg || "Não informado"}
        
        2. DADOS DO ESCRITÓRIO/ADVOGADO (CONTRATADA):
        Nome do Advogado(s): ${officeProfile.nome_advogado}
        OAB: ${officeProfile.oab}
        Endereço Profissional: ${officeProfile.endereco_profissional}
        Cidade/UF: ${officeProfile.cidade_uf}
        
        3. MODELO BRUTO:
        """
        ${rawText}
        """
        
        TAREFA: 
        Substitua TODOS os placeholders do modelo pelos dados reais acima.
        Formate o resultado em HTML SIMPLES (usando <b> para negrito em nomes/dados).
        Justifique o texto. Centralize títulos.
        
        Retorne APENAS o HTML do conteúdo.
        `;

        const filledHtml = await generateWithFallback(prompt);
        let cleanHtml = filledHtml.replace(/```html/g, '').replace(/```/g, '').trim();
        if (!cleanHtml.includes("<p>")) cleanHtml = cleanHtml.split("\n").map(line => line.trim() ? `<p>${line}</p>` : "").join("");
        
        setDocumentHtml(cleanHtml);

    } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro na geração do documento.";
        alert(msg);
    } finally {
        setGenerating(false);
    }
  };

  const handleChatAdjust = async () => {
    if (!chatInput.trim()) return;
    const currentContent = editorRef.current?.innerHTML || documentHtml;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
        const prompt = `
        EDITOR JURÍDICO. HTML ATUAL: """${currentContent}"""
        SOLICITAÇÃO: "${userMsg}"
        TAREFA: Reescreva aplicando a alteração. Mantenha formatação HTML. Retorne APENAS HTML.
        `;
        const newHtml = await generateWithFallback(prompt);
        const cleanHtml = newHtml.replace(/```html/g, '').replace(/```/g, '');
        setDocumentHtml(cleanHtml);
        if (editorRef.current) editorRef.current.innerHTML = cleanHtml;
        setChatMessages(prev => [...prev, { role: 'model', text: "Feito." }]);
    } catch (err) {
        setChatMessages(prev => [...prev, { role: 'model', text: "Erro ao ajustar." }]);
    } finally { setChatLoading(false); }
  };

  const handleDownloadWord = async () => {
      const content = editorRef.current?.innerHTML || documentHtml;
      if (!content) return alert("Gere um documento primeiro.");
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${cliente.nome}</title><style>body{font-family:'Times New Roman';font-size:12pt;}p{text-align:justify;margin-bottom:10pt;}</style></head><body>${content}</body></html>`;
      try {
          const data = await asBlob(fullHtml);
          saveAs(data, `${cliente.nome}_documento.docx`);
      } catch (e) { alert("Erro ao gerar Word."); }
  };

  const handlePrint = () => {
    const content = editorRef.current?.innerHTML || documentHtml;
    const w = window.open('', '', 'width=800,height=600');
    w?.document.write(`<html><head><title>${cliente.nome}</title><style>@page{margin:2.5cm;size:A4;}body{font-family:'Times New Roman';font-size:12pt;}</style></head><body>${content}<script>window.print();</script></body></html>`);
    w?.document.close();
  };

  const execCmd = (cmd: string, val?: string) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); };
  
  const ToolBtn = ({ cmd, icon: Icon, title }: ToolBtnProps) => (
      <button onClick={() => execCmd(cmd)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title={title}>
          <Icon size={16}/>
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 font-sans">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="text-slate-600"/></button>
            <div>
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2"><FileText className="text-blue-600"/> Editor de Documentos</h1>
                <p className="text-xs text-slate-500">
                     {officeProfile ? `Gerando como: ${officeProfile.nome_advogado}` : "Configure seu escritório"}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsConfigOpen(true)} className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold border border-transparent hover:border-slate-200 transition-all" title="Configurar Dados do Advogado">
                <Settings size={18}/> <span className="hidden md:inline">Escritório</span>
            </button>
            <div className="h-6 w-px bg-slate-300 mx-1"></div>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition ${isChatOpen ? 'bg-slate-800 text-white' : 'bg-white border text-slate-700'}`}><MessageSquare size={16}/> <span className="hidden md:inline">{isChatOpen ? "Fechar" : "IA"}</span></button>
            <button onClick={handleDownloadWord} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2"><Download size={16}/> <span className="hidden md:inline">Word</span></button>
            <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2"><Printer size={16}/> <span className="hidden md:inline">PDF</span></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 overflow-y-auto hidden lg:block shrink-0 z-10">
            <div className="p-4 border-b bg-slate-50"><h3 className="font-bold text-slate-700 text-xs uppercase">Modelos</h3></div>
            <div className="p-2 space-y-1">
                {templates.map(t => (
                    <button key={t.id} onClick={() => handleSelectTemplate(t)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${selectedTemplateId === t.id ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}>{t.title}</button>
                ))}
            </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-200/50 flex flex-col items-center p-6 md:p-10 relative">
            <div className="sticky top-0 mb-4 bg-white p-1.5 rounded-lg shadow-md border border-slate-200 flex flex-wrap gap-1 z-20 max-w-[21cm]">
                <div className="flex gap-0.5 border-r pr-1 mr-1"><ToolBtn cmd="undo" icon={Undo}/><ToolBtn cmd="redo" icon={Redo}/></div>
                <div className="flex gap-0.5 border-r pr-1 mr-1"><ToolBtn cmd="bold" icon={Bold}/><ToolBtn cmd="italic" icon={Type}/><ToolBtn cmd="underline" icon={Underline}/></div>
                <div className="flex gap-0.5 border-r pr-1 mr-1"><ToolBtn cmd="justifyLeft" icon={AlignLeft}/><ToolBtn cmd="justifyCenter" icon={AlignCenter}/><ToolBtn cmd="justifyFull" icon={AlignJustify}/></div>
                <div className="flex gap-0.5"><ToolBtn cmd="outdent" icon={Outdent}/><ToolBtn cmd="indent" icon={Indent}/></div>
            </div>

            {generating ? (
                <div className="flex flex-col items-center justify-center mt-20 text-slate-400 gap-3"><Sparkles size={48} className="animate-spin text-blue-500"/><p className="font-medium animate-pulse">Preenchendo dados...</p></div>
            ) : (
                <div className="bg-white shadow-xl w-full max-w-[21cm] min-h-[29.7cm] p-[2.5cm] outline-none transition-all focus:ring-2 focus:ring-blue-500/20" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.5' }}>
                    {!documentHtml && <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50"><FileText size={64}/><p className="mt-4 text-sm">Selecione um modelo</p></div>}
                    <div ref={editorRef} contentEditable suppressContentEditableWarning className="outline-none empty:before:content-['...'] cursor-text" onInput={(e) => setDocumentHtml(e.currentTarget.innerHTML)}/>
                </div>
            )}
            <div className="h-20"></div> 
        </main>

        {isChatOpen && (
            <aside className="w-[350px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-30 animate-in slide-in-from-right">
                <div className="p-3 border-b bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-700 text-sm flex items-center gap-2"><Sparkles size={14} className="text-purple-600"/> IA</h3><button onClick={() => setIsChatOpen(false)}><X size={16}/></button></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                     {chatMessages.map((msg, idx) => (<div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] p-2.5 rounded-lg text-xs ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm text-slate-700'}`}>{msg.text}</div></div>))}
                    {chatLoading && <div className="text-xs text-slate-400 animate-pulse ml-2">...</div>}
                    <div ref={chatEndRef}/>
                </div>
                <div className="p-3 bg-white border-t"><div className="flex gap-2"><input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatAdjust()} placeholder="Ex: Centralizar..." className="flex-1 text-xs border border-slate-300 rounded-lg p-2 outline-none"/><button onClick={handleChatAdjust} disabled={chatLoading} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 disabled:opacity-50"><Send size={14}/></button></div></div>
            </aside>
        )}
      </div>

      {/* MODAL DE CONFIGURAÇÃO DO ESCRITÓRIO */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><Settings size={18}/> Configurar Escritório</h3>
                    <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-500 bg-yellow-50 p-2 rounded border border-yellow-100">
                        Estes dados serão usados pela IA para preencher "CONTRATADA" e "PROCURADOR" nos documentos automaticamente.
                    </p>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Nome do(s) Advogado(s)</label>
                        <input value={configForm.nome} onChange={e => setConfigForm({...configForm, nome: e.target.value})} className="w-full border p-2 rounded mt-1 text-sm" placeholder="Ex: Dra. Elen Zite e Dra. Franciele Rocha"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">OAB(s)</label>
                        <input value={configForm.oab} onChange={e => setConfigForm({...configForm, oab: e.target.value})} className="w-full border p-2 rounded mt-1 text-sm" placeholder="Ex: OAB/BA 31.623 e OAB/BA 61.890"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Endereço Profissional</label>
                        <input value={configForm.endereco} onChange={e => setConfigForm({...configForm, endereco: e.target.value})} className="w-full border p-2 rounded mt-1 text-sm" placeholder="Rua Landulfo Alves..."/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Cidade/UF</label>
                        <input value={configForm.cidade} onChange={e => setConfigForm({...configForm, cidade: e.target.value})} className="w-full border p-2 rounded mt-1 text-sm" placeholder="Anagé/BA"/>
                    </div>
                    <button onClick={handleSaveConfig} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 flex items-center justify-center gap-2">
                        <Save size={18}/> Salvar Configuração
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}