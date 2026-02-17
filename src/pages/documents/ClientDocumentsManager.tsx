import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, Search, Plus, FileText, 
  Image as ImageIcon, Calendar, Trash2, Eye, 
  Download, Edit2, AlertCircle, Save, Scale, UploadCloud, X, Check, ChevronDown, MessageSquare
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/use-toast";
import { Client, ClientDocument } from "../../types"; 

// Base jurídica
const LEGAL_BASIS: Record<string, { law: string, obs: string }> = {
  "Autodeclaração do Segurado Especial": { law: "Lei 8.213/91, Art. 38-B, § 2º", obs: "Principal instrumento de prova." },
  "Bloco de Notas do Produtor Rural": { law: "Lei 8.213/91, Art. 106, V", obs: "Prova robusta de comercialização." },
  "Certidão de Casamento/União Estável": { law: "Súmula 6 TNU", obs: "Estende a profissão do cônjuge." },
  "Certidão de Nascimento/Batismo Filhos": { law: "IN 128/2022, Art. 116, XII", obs: "Prova presença rural na data do evento." },
  "DAP ou CAF (Pronaf)": { law: "Lei 8.213/91, Art. 106, IV", obs: "Forte instrumento ratificador." },
  "ITR ou CCIR": { law: "Tema 1115 STJ", obs: "Prova posse da terra." },
  "Notas Fiscais de Entrada": { law: "Lei 8.213/91, Art. 106, VI", obs: "Prova venda da produção." },
  "Ficha de Sindicato / Cooperativa": { law: "IN 128/2022, Art. 116, XVIII", obs: "Início de prova material." },
  "Documentos Escolares": { law: "IN 128/2022, Art. 116, XVII", obs: "Escola rural ou profissão dos pais." },
  "Outros": { law: "Súmula 149 STJ", obs: "Admite-se qualquer meio de prova idôneo." }
};

interface PageProps {
  cliente: Client; 
  onBack: () => void;
}

export function ClientDocumentsManager({ cliente, onBack }: PageProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Tipagem forte para a lista de documentos
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  
  const [filter, setFilter] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedDoc, setSelectedDoc] = useState<ClientDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Upload
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Helper for local date string (YYYY-MM-DD)
  const getTodayLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [uploadMetadata, setUploadMetadata] = useState({ 
    category: "Provas" as ClientDocument['category'], 
    docType: "", 
    customName: "", 
    date: getTodayLocal(),
    userObs: ""
  });

  // Edição
  const [editForm, setEditForm] = useState({
    title: "",
    customTitle: "",
    category: "Provas" as ClientDocument['category'],
    reference_date: "",
    description: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cliente?.id) fetchDocuments();
  }, [cliente]);

  // --- BUSCA NA NOVA TABELA ---
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Agora buscamos apenas na tabela relacional (client_documents), pois os dados antigos já foram migrados
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', cliente.id)
        .order('reference_date', { ascending: false });

      if (error) throw error;
      
      setDocs(data as ClientDocument[]); 

    } catch (error: any) {
      console.error("Erro ao buscar docs:", error);
      toast({ title: "Erro", description: "Falha ao carregar documentos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- UPLOAD PARA TABELA RELACIONAL ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileToUpload(file);
    setUploadMetadata({
      category: "Provas",
      docType: "", 
      customName: file.name.split('.')[0], 
      date: getTodayLocal(),
      userObs: ""
    });
    setIsUploadModalOpen(true);
    e.target.value = ""; 
  };

  const confirmUpload = async () => {
    if (!fileToUpload) return;
    
    let finalTitle = uploadMetadata.docType;
    if (!finalTitle || finalTitle === "Outros") {
        if (!uploadMetadata.customName.trim()) return toast({ title: "Atenção", description: "Digite o nome do documento.", variant: "destructive" });
        finalTitle = uploadMetadata.customName;
    }

    setUploading(true);

    try {
        // 1. Upload Storage
        const fileExt = fileToUpload.name.split('.').pop();
        const cleanName = finalTitle.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${cliente.id}/${Date.now()}_${cleanName}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('evidence-files')
            .upload(fileName, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('evidence-files')
            .getPublicUrl(fileName);

        // 2. Insert na tabela Relacional (client_documents)
        const { error: dbError } = await supabase
            .from('client_documents')
            .insert({
                client_id: cliente.id,
                title: finalTitle,
                category: uploadMetadata.category,
                file_url: publicUrl,
                reference_date: uploadMetadata.date || null,
                description: uploadMetadata.userObs,
                source_origin: 'GED Novo'
            });

        if (dbError) throw dbError;

        toast({ title: "Sucesso", description: "Documento salvo.", variant: "success" });
        setIsUploadModalOpen(false);
        setFileToUpload(null);
        fetchDocuments(); 

    } catch (error: any) {
        toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
        setUploading(false);
    }
  };

  const handleSelectDoc = (doc: ClientDocument) => {
    setSelectedDoc(doc);
    const isStandard = Object.keys(LEGAL_BASIS).includes(doc.title);
    setEditForm({ 
        title: isStandard ? doc.title : "Outros", 
        customTitle: isStandard ? "" : doc.title, 
        category: doc.category,
        reference_date: doc.reference_date || "", 
        description: doc.description || "" 
    });
    setIsEditing(false);
  };

  const handleSaveEdits = async () => {
      if (!selectedDoc) return;
      setSaving(true);

      let finalTitle = editForm.title;
      if (finalTitle === "Outros") {
          if (!editForm.customTitle.trim()) {
              setSaving(false);
              return toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
          }
          finalTitle = editForm.customTitle;
      }

      try {
          const { error } = await supabase
            .from('client_documents')
            .update({
                title: finalTitle,
                category: editForm.category,
                reference_date: editForm.reference_date || null,
                description: editForm.description
            })
            .eq('id', selectedDoc.id);

          if (error) throw error;

          toast({ title: "Atualizado", description: "Dados alterados com sucesso.", variant: "success" });
          setIsEditing(false);
          fetchDocuments();
          
          setSelectedDoc((prev: ClientDocument | null) => prev ? ({ 
              ...prev, 
              title: finalTitle, 
              category: editForm.category,
              reference_date: editForm.reference_date || null,
              description: editForm.description 
          }) : null);

      } catch (err: any) {
          toast({ title: "Erro", description: err.message, variant: "destructive" });
      } finally {
          setSaving(false);
      }
  };

  const handleDeleteDoc = async () => {
      if (!selectedDoc) return;
      if (!confirm("Excluir este documento permanentemente?")) return;
      setSaving(true);

      try {
          const { error } = await supabase
            .from('client_documents')
            .delete()
            .eq('id', selectedDoc.id);

          if (error) throw error;

          toast({ title: "Excluído", description: "Documento removido.", variant: "success" });
          setSelectedDoc(null);
          fetchDocuments();

      } catch (err: any) {
          toast({ title: "Erro", description: err.message, variant: "destructive" });
      } finally {
         setSaving(false);
      }
  };

  const filteredDocs = docs.filter(doc => {
      const matchesSearch = (doc.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === "Todos" || doc.category === filter;
      return matchesSearch && matchesFilter;
  });

  const formatDate = (date?: string | null) => {
      if (!date) return "S/D";
      const [y, m, d] = date.split('-');
      return `${d}/${m}/${y}`;
  };

  const getFileIcon = (url: string) => {
      if (url.toLowerCase().includes('.pdf')) return <FileText className="text-red-500" />;
      return <ImageIcon className="text-blue-500" />;
  };

  const getLegalInfo = (title: string) => {
      return LEGAL_BASIS[title] || null;
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 font-sans">
      <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    Gestão de Documentos
                </h1>
                <p className="text-xs text-slate-500">Centralizando {docs.length} provas de {cliente.nome}</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} disabled={uploading} />
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2 transition-all disabled:opacity-50"
            >
                {uploading ? <UploadCloud className="animate-bounce" size={16}/> : <Plus size={16}/>}
                {uploading ? "Enviando..." : "Novo Upload"}
            </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LISTAGEM */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all ${selectedDoc ? 'w-3/5 hidden md:flex' : 'w-full'}`}>
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg text-sm outline-none"/>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                    {["Todos", "Provas", "Pessoal", "Processual", "Diversos"].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-white border border-slate-200 text-slate-600'}`}>{f}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
                {loading ? <div className="text-center py-20 text-slate-400">Carregando...</div> : filteredDocs.length === 0 ? (
                     <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl m-4">
                        <p className="text-slate-500 font-medium">Nenhum documento encontrado.</p>
                    </div>
                ) : (
                    filteredDocs.map((doc) => (
                    <div key={doc.id} onClick={() => handleSelectDoc(doc)} className={`group flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedDoc?.id === doc.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-1">{getFileIcon(doc.file_url)}</div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate text-slate-800">{doc.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium border bg-slate-100 text-slate-600">{doc.category}</span>
                                <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10}/> {formatDate(doc.reference_date)}</span>
                            </div>
                        </div>
                    </div>
                )))}
            </div>
        </div>

        {/* DETALHES */}
        {selectedDoc && (
            <aside className="w-full md:w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 text-sm">Detalhes</h3>
                    <button onClick={() => setSelectedDoc(null)}><ArrowLeft size={18} className="text-slate-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="aspect-[3/4] bg-slate-100 rounded-xl border flex items-center justify-center overflow-hidden relative group">
                        {selectedDoc.file_url.toLowerCase().endsWith('.pdf') ? (
                            <iframe src={selectedDoc.file_url} className="w-full h-full" title="Preview"/>
                        ) : (
                            <img src={selectedDoc.file_url} alt="Preview" className="w-full h-full object-contain" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <a href={selectedDoc.file_url} target="_blank" rel="noreferrer" className="p-3 bg-white rounded-full"><Eye size={20}/></a>
                            <a href={selectedDoc.file_url} download className="p-3 bg-white rounded-full"><Download size={20}/></a>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <h4 className="text-xs font-bold text-slate-400 uppercase">Metadados</h4>
                            <button onClick={() => isEditing ? handleSaveEdits() : setIsEditing(true)} className="text-xs flex items-center gap-1 text-blue-600 font-bold">
                                {isEditing ? <><Save size={12}/> Salvar</> : <><Edit2 size={12}/> Editar</>}
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Nome</label>
                                <div className="relative">
                                    <select disabled={!isEditing} value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white appearance-none disabled:bg-slate-50">
                                        <option value="">Selecione...</option>
                                        {Object.keys(LEGAL_BASIS).map((key, i) => <option key={i} value={key}>{key}</option>)}
                                        <option value="Outros">Outros</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none"/>
                                </div>
                                {editForm.title === "Outros" && (
                                    <input disabled={!isEditing} value={editForm.customTitle} onChange={e => setEditForm({...editForm, customTitle: e.target.value})} className="w-full p-2 mt-2 border rounded-lg text-sm" placeholder="Nome personalizado"/>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-xs font-bold text-slate-600 mb-1 block">Data</label><input type="date" disabled={!isEditing} value={editForm.reference_date} onChange={e => setEditForm({...editForm, reference_date: e.target.value})} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50"/></div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-1 block">Categoria</label>
                                    <select disabled={!isEditing} value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value as ClientDocument['category']})} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50">
                                        <option value="Provas">Provas</option>
                                        <option value="Pessoal">Pessoal</option>
                                        <option value="Processual">Processual</option>
                                        <option value="Diversos">Diversos</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">Descrição</label>
                                <textarea disabled={!isEditing} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-2 border rounded-lg text-sm disabled:bg-slate-50" rows={3}/>
                            </div>
                            
                            {/* FUNDAMENTAÇÃO LEGAL */}
                            {getLegalInfo(selectedDoc.title) && (
                                <div className="mt-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
                                    <h5 className="font-bold text-blue-800 text-xs mb-2 flex items-center gap-1"><Scale size={12}/> Fundamentação Jurídica</h5>
                                    <p className="text-xs text-blue-900 font-medium mb-1">{getLegalInfo(selectedDoc.title)?.law}</p>
                                    <p className="text-xs text-blue-700 italic opacity-80">{getLegalInfo(selectedDoc.title)?.obs}</p>
                                </div>
                            )}
                            
                            <div className="pt-2 text-right">
                                <span className="text-[10px] text-slate-400">Origem: <span className="font-mono text-slate-600">{selectedDoc.source_origin}</span></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t bg-slate-50">
                    <button onClick={handleDeleteDoc} disabled={saving} className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 flex items-center justify-center gap-2"><Trash2 size={16}/> Excluir Documento</button>
                </div>
            </aside>
        )}
      </div>

      {/* MODAL UPLOAD */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><UploadCloud size={20}/> Novo Upload</h3>
                    <button onClick={() => setIsUploadModalOpen(false)}><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                        <FileText size={20} className="text-slate-500"/>
                        <p className="text-sm font-medium truncate text-slate-800 flex-1">{fileToUpload?.name}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo</label>
                        <select value={uploadMetadata.docType} onChange={e => setUploadMetadata({...uploadMetadata, docType: e.target.value})} className="w-full p-3 border rounded-xl text-sm">
                            <option value="">-- Selecione --</option>
                            {Object.keys(LEGAL_BASIS).map((key, i) => <option key={i} value={key}>{key}</option>)}
                            <option value="Outros">Outros</option>
                        </select>
                        {uploadMetadata.docType === "Outros" && <input value={uploadMetadata.customName} onChange={e => setUploadMetadata({...uploadMetadata, customName: e.target.value})} className="w-full mt-2 p-3 border rounded-xl text-sm" placeholder="Nome do arquivo"/>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Categoria</label><select value={uploadMetadata.category} onChange={e => setUploadMetadata({...uploadMetadata, category: e.target.value as ClientDocument['category']})} className="w-full p-3 border rounded-xl text-sm"><option value="Provas">Provas</option><option value="Pessoal">Pessoal</option><option value="Diversos">Diversos</option></select></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Data</label><input type="date" value={uploadMetadata.date} onChange={e => setUploadMetadata({...uploadMetadata, date: e.target.value})} className="w-full p-3 border rounded-xl text-sm"/></div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><MessageSquare size={12}/> Observações</label>
                        <textarea value={uploadMetadata.userObs} onChange={e => setUploadMetadata({...uploadMetadata, userObs: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm resize-none" rows={2}/>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex gap-3 justify-end">
                    <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg text-sm">Cancelar</button>
                    <button onClick={confirmUpload} disabled={uploading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-lg flex items-center gap-2">{uploading ? "Enviando..." : <><Check size={16}/> Confirmar</>}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}