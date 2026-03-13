import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Printer, Sparkles, MessageSquare, Send,
  FileText, X, Bold, AlignCenter, AlignJustify, Type,
  List, ListOrdered, Undo, Redo, Underline, Indent, Outdent, Download, AlignLeft,
  Settings, Save
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';
import { Client } from '../../types';
import { useOfficeProfile } from '../../hooks/useOfficeProfile';
import { useDocumentTemplates } from '../../hooks/useDocumentTemplates';
import { useDocumentAI } from '../../hooks/useDocumentAI';
import { useChatAI } from '../../hooks/useChatAI';
import { useToast } from '../../hooks/use-toast';

interface DocumentsPageProps {
  cliente: Client;
  onBack: () => void;
}

interface ToolBtnProps {
  cmd: string;
  icon: React.ElementType;
  title?: string;
}

export function DocumentsPage({ cliente, onBack }: DocumentsPageProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    officeProfile,
    isConfigOpen,
    setIsConfigOpen,
    configForm,
    setConfigForm,
    saveOfficeProfile,
  } = useOfficeProfile();

  const {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    loading: templatesLoading,
  } = useDocumentTemplates();

  const {
    generating,
    documentHtml,
    setDocumentHtml,
    generateDocument,
  } = useDocumentAI();

  const {
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    chatEndRef,
    sendMessage,
  } = useChatAI();

  useEffect(() => {
    if (!generating && editorRef.current && documentHtml) {
      if (editorRef.current.innerHTML !== documentHtml) {
        editorRef.current.innerHTML = documentHtml;
      }
    }
  }, [generating, documentHtml]);

  const handleSelectTemplate = async (templateId: number) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const success = await generateDocument(cliente, officeProfile, template.content);
    if (success) {
      // documento gerado com sucesso
    }
  };

  const handleChatAdjust = async () => {
    const currentContent = editorRef.current?.innerHTML || documentHtml;
    const newHtml = await sendMessage(currentContent);
    if (newHtml) {
      setDocumentHtml(newHtml);
      if (editorRef.current) editorRef.current.innerHTML = newHtml;
    }
  };

  const handleDownloadWord = async () => {
    const content = editorRef.current?.innerHTML || documentHtml;
    if (!content) return alert('Gere um documento primeiro.');
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${cliente.nome}</title><style>body{font-family:'Times New Roman';font-size:12pt;}p{text-align:justify;margin-bottom:10pt;}</style></head><body>${content}</body></html>`;
    try {
      const data = await asBlob(fullHtml);
      saveAs(data, `${cliente.nome}_documento.docx`);
    } catch (e) {
      alert('Erro ao gerar Word.');
    }
  };

  const handlePrint = () => {
    const content = editorRef.current?.innerHTML || documentHtml;
    const w = window.open('', '', 'width=800,height=600');
    w?.document.write(`<html><head><title>${cliente.nome}</title><style>@page{margin:2.5cm;size:A4;}body{font-family:'Times New Roman';font-size:12pt;}</style></head><body>${content}<script>window.print();</script></body></html>`);
    w?.document.close();
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const handleSaveOfficeProfile = async () => {
    try {
      await saveOfficeProfile();
      toast({ title: 'Sucesso', description: 'Dados do escritório salvos!', variant: 'success' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar. Tente novamente.', variant: 'destructive' });
    }
  };

  const ToolBtn = ({ cmd, icon: Icon, title }: ToolBtnProps) => (
    <button onClick={() => execCmd(cmd)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title={title}>
      <Icon size={16} />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-100 font-sans">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
            <ArrowLeft className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600" /> Editor de Documentos
            </h1>
            <p className="text-xs text-slate-500">
              {officeProfile ? `Gerando como: ${officeProfile.nome_advogado}` : 'Configure seu escritório'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold border border-transparent hover:border-slate-200 transition-all"
            title="Configurar Dados do Advogado"
          >
            <Settings size={18} /> <span className="hidden md:inline">Escritório</span>
          </button>
          <div className="h-6 w-px bg-slate-300 mx-1"></div>
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition ${
              isChatOpen ? 'bg-slate-800 text-white' : 'bg-white border text-slate-700'
            }`}
          >
            <MessageSquare size={16} /> <span className="hidden md:inline">{isChatOpen ? 'Fechar' : 'IA'}</span>
          </button>
          <button
            onClick={handleDownloadWord}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2"
          >
            <Download size={16} /> <span className="hidden md:inline">Word</span>
          </button>
          <button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2"
          >
            <Printer size={16} /> <span className="hidden md:inline">PDF</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 overflow-y-auto hidden lg:block shrink-0 z-10">
          <div className="p-4 border-b bg-slate-50">
            <h3 className="font-bold text-slate-700 text-xs uppercase">Modelos</h3>
          </div>
          <div className="p-2 space-y-1">
            {templatesLoading ? (
              <div className="text-center text-slate-400 py-4">Carregando...</div>
            ) : (
              templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${
                    selectedTemplateId === t.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.title}
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-200/50 flex flex-col items-center p-6 md:p-10 relative">
          <div className="sticky top-0 mb-4 bg-white p-1.5 rounded-lg shadow-md border border-slate-200 flex flex-wrap gap-1 z-20 max-w-[21cm]">
            <div className="flex gap-0.5 border-r pr-1 mr-1">
              <ToolBtn cmd="undo" icon={Undo} />
              <ToolBtn cmd="redo" icon={Redo} />
            </div>
            <div className="flex gap-0.5 border-r pr-1 mr-1">
              <ToolBtn cmd="bold" icon={Bold} />
              <ToolBtn cmd="italic" icon={Type} />
              <ToolBtn cmd="underline" icon={Underline} />
            </div>
            <div className="flex gap-0.5 border-r pr-1 mr-1">
              <ToolBtn cmd="justifyLeft" icon={AlignLeft} />
              <ToolBtn cmd="justifyCenter" icon={AlignCenter} />
              <ToolBtn cmd="justifyFull" icon={AlignJustify} />
            </div>
            <div className="flex gap-0.5">
              <ToolBtn cmd="outdent" icon={Outdent} />
              <ToolBtn cmd="indent" icon={Indent} />
            </div>
          </div>

          {generating ? (
            <div className="flex flex-col items-center justify-center mt-20 text-slate-400 gap-3">
              <Sparkles size={48} className="animate-spin text-blue-500" />
              <p className="font-medium animate-pulse">Preenchendo dados...</p>
            </div>
          ) : (
            <div
              className="bg-white shadow-xl w-full max-w-[21cm] min-h-[29.7cm] p-[2.5cm] outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
              style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: '1.5' }}
            >
              {!documentHtml && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                  <FileText size={64} />
                  <p className="mt-4 text-sm">Selecione um modelo</p>
                </div>
              )}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="outline-none empty:before:content-['...'] cursor-text"
                onInput={(e) => setDocumentHtml(e.currentTarget.innerHTML)}
              />
            </div>
          )}
          <div className="h-20"></div>
        </main>

        {isChatOpen && (
          <aside className="w-[350px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-30 animate-in slide-in-from-right">
            <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Sparkles size={14} className="text-purple-600" /> IA
              </h3>
              <button onClick={() => setIsChatOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] p-2.5 rounded-lg text-xs ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm text-slate-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-xs text-slate-400 animate-pulse ml-2">...</div>}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 bg-white border-t">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatAdjust()}
                  placeholder="Ex: Centralizar..."
                  className="flex-1 text-xs border border-slate-300 rounded-lg p-2 outline-none"
                />
                <button
                  onClick={handleChatAdjust}
                  disabled={chatLoading}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* MODAL DE CONFIGURAÇÃO DO ESCRITÓRIO */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <Settings size={18} /> Configurar Escritório
              </h3>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 bg-yellow-50 p-2 rounded border border-yellow-100">
                Estes dados serão usados pela IA para preencher "CONTRATADA" e "PROCURADOR" nos documentos automaticamente.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Nome do(s) Advogado(s)</label>
                <input
                  value={configForm.nome}
                  onChange={(e) => setConfigForm({ ...configForm, nome: e.target.value })}
                  className="w-full border p-2 rounded mt-1 text-sm"
                  placeholder="Ex: Dra. Elen Zite e Dra. Franciele Rocha"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">OAB(s)</label>
                <input
                  value={configForm.oab}
                  onChange={(e) => setConfigForm({ ...configForm, oab: e.target.value })}
                  className="w-full border p-2 rounded mt-1 text-sm"
                  placeholder="Ex: OAB/BA 31.623 e OAB/BA 61.890"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Endereço Profissional</label>
                <input
                  value={configForm.endereco}
                  onChange={(e) => setConfigForm({ ...configForm, endereco: e.target.value })}
                  className="w-full border p-2 rounded mt-1 text-sm"
                  placeholder="Rua Landulfo Alves..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Cidade/UF</label>
                <input
                  value={configForm.cidade}
                  onChange={(e) => setConfigForm({ ...configForm, cidade: e.target.value })}
                  className="w-full border p-2 rounded mt-1 text-sm"
                  placeholder="Anagé/BA"
                />
              </div>
              <button
                onClick={handleSaveOfficeProfile}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-500 flex items-center justify-center gap-2"
              >
                <Save size={18} /> Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}