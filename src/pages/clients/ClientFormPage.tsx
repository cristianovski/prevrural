import { useState, useEffect } from "react";
import { 
  ArrowLeft, Save, User, FileText, MapPin, Phone, 
  AlertTriangle, Users, Briefcase, Shield, PenTool, 
  UploadCloud, Trash2, Paperclip, ExternalLink, Check, X, CheckCircle // ✅ CheckCircle adicionado aqui
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface ClientFormProps {
  onBack: () => void;
  clienteId: number | null;
  onOpenAnalysis?: (id: number) => void; 
  onOpenVisualTimeline?: (id: number) => void;
}

export function ClientFormPage({ onBack, clienteId, onOpenAnalysis, onOpenVisualTimeline }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [idade, setIdade] = useState<number | null>(null);
  
  // --- NOVOS ESTADOS PARA O FLUXO DE DOCUMENTOS ---
  const [docNameInput, setDocNameInput] = useState(""); 
  const [tempUpload, setTempUpload] = useState<{url: string, fileName: string} | null>(null);

  // Estado inicial completo
  const [formData, setFormData] = useState<any>({
    // 1. Identificação Civil
    nome: "",
    sexo: "Masculino",
    analfabeto: false,
    cpf: "",
    data_nascimento: "",
    naturalidade: "",
    nacionalidade: "Brasileiro(a)",
    profissao: "Agricultor(a)",
    
    // Capacidade e Representante
    capacidade_civil: "Plena", 
    rep_nome: "",
    rep_cpf: "",
    rep_rg: "",
    rep_parentesco: "", 
    rep_endereco: "",
    rep_telefone: "",

    // 2. Documentação & Senhas
    rg: "",
    orgao_expedidor: "",
    data_expedicao: "",
    nit: "",
    ctps: "",
    senha_meu_inss: "",
    
    // 3. Família
    nome_mae: "",
    nome_pai: "",
    estado_civil: "Solteiro(a)",
    nome_conjuge: "",
    cpf_conjuge: "",
    
    // 4. Contato & Localização
    cep: "",
    endereco: "",
    bairro: "",
    cidade: "",
    telefone: "",
    telefone_recado: "",
    
    // 5. Análise Previdenciária & Impedimentos
    resumo_cnis: "",
    historico_beneficios: "",
    possui_cnpj: false,
    detalhes_cnpj: "",
    possui_outra_renda: false,
    detalhes_renda: "",
    endereco_divergente: false,
    justificativa_endereco: "",
    
    // 6. Documentos Pessoais
    personal_docs: [], 

    status_processo: "A Iniciar"
  });

  useEffect(() => {
    if (clienteId) fetchClient();
  }, [clienteId]);

  // Calcula idade automaticamente
  useEffect(() => {
    if (formData.data_nascimento) {
      const hoje = new Date();
      const nasc = new Date(formData.data_nascimento);
      let idadeCalc = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idadeCalc--;
      }
      setIdade(idadeCalc);
    } else {
      setIdade(null);
    }
  }, [formData.data_nascimento]);

  const fetchClient = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (error) console.error("Erro ao carregar:", error);
    if (data) {
      setFormData({
        ...data, 
        nome: data.nome || "",
        sexo: data.sexo || "Masculino",
        analfabeto: data.analfabeto || false,
        cpf: data.cpf || "",
        data_nascimento: data.data_nascimento || "",
        naturalidade: data.naturalidade || "",
        nacionalidade: data.nacionalidade || "Brasileiro(a)",
        profissao: data.profissao || "Agricultor(a)",
        capacidade_civil: data.capacidade_civil || "Plena",
        rep_nome: data.rep_nome || "",
        rep_cpf: data.rep_cpf || "",
        rep_rg: data.rep_rg || "",
        rep_parentesco: data.rep_parentesco || "",
        rep_endereco: data.rep_endereco || "",
        rep_telefone: data.rep_telefone || "",
        rg: data.rg || "",
        orgao_expedidor: data.orgao_expedidor || "",
        data_expedicao: data.data_expedicao || "",
        nit: data.nit || "",
        ctps: data.ctps || "",
        senha_meu_inss: data.senha_meu_inss || "",
        nome_mae: data.nome_mae || "",
        nome_pai: data.nome_pai || "",
        estado_civil: data.estado_civil || "Solteiro(a)",
        nome_conjuge: data.nome_conjuge || "",
        cpf_conjuge: data.cpf_conjuge || "",
        cep: data.cep || "",
        endereco: data.endereco || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        telefone: data.telefone || "",
        telefone_recado: data.telefone_recado || "",
        resumo_cnis: data.resumo_cnis || "",
        historico_beneficios: data.historico_beneficios || "",
        possui_cnpj: data.possui_cnpj || false,
        detalhes_cnpj: data.detalhes_cnpj || "",
        possui_outra_renda: data.possui_outra_renda || false,
        detalhes_renda: data.detalhes_renda || "",
        endereco_divergente: data.endereco_divergente || false,
        justificativa_endereco: data.justificativa_endereco || "",
        personal_docs: data.personal_docs || [], 
        status_processo: data.status_processo || "A Iniciar"
      });
    }
  };

  // --- MÁSCARAS ---
  const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const mascaraTelefone = (v: string) => { v = v.replace(/\D/g, ""); v = v.replace(/^(\d{2})(\d)/g, "($1) $2"); v = v.replace(/(\d)(\d{4})$/, "$1-$2"); return v.substring(0, 15); };
  const mascaraCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name === 'cpf' || name === 'cpf_conjuge' || name === 'rep_cpf') value = mascaraCPF(value);
    if (name === 'telefone' || name === 'telefone_recado' || name === 'rep_telefone') value = mascaraTelefone(value);
    if (name === 'cep') value = mascaraCEP(value);

    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleBlurCep = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: `${data.localidade} - ${data.uf}`,
            naturalidade: prev.naturalidade || `${data.localidade} - ${data.uf}`
          }));
        }
      } catch (error) { console.error("Erro ao buscar CEP", error); }
    }
  };

  // --- 1. SELEÇÃO DO ARQUIVO (UPLOAD PRIMEIRO) ---
  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!clienteId) {
      alert("Salve o cliente pela primeira vez antes de anexar documentos.");
      return;
    }

    setUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const cleanName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = Date.now();
        const fileName = `${clienteId}/personal_${timestamp}_${cleanName}.${fileExt}`;

        // Upload para o Supabase
        const { error: err } = await supabase.storage
            .from('evidence-files')
            .upload(fileName, file, { upsert: false });

        if (err) throw err;

        const { data } = supabase.storage
            .from('evidence-files')
            .getPublicUrl(fileName);

        // Define o arquivo temporário (aguardando nome)
        setTempUpload({
            url: data.publicUrl,
            fileName: file.name
        });
        
        // Sugere o nome do arquivo como nome do documento (opcional)
        setDocNameInput(file.name.split('.')[0]);

    } catch (error: any) {
        alert("Erro no upload: " + error.message);
    } finally {
        setUploading(false);
    }
  };

  // --- 2. CONFIRMAR E ADICIONAR À LISTA ---
  const confirmAddDoc = () => {
      if (!tempUpload) return;
      if (!docNameInput.trim()) {
          alert("Por favor, dê um nome ao documento.");
          return;
      }

      const newDoc = {
          name: docNameInput,
          url: tempUpload.url,
          fileName: tempUpload.fileName
      };

      setFormData((prev: any) => ({
          ...prev,
          personal_docs: [...(prev.personal_docs || []), newDoc]
      }));

      // Limpa os estados temporários
      setTempUpload(null);
      setDocNameInput("");
  };

  // --- 3. CANCELAR UPLOAD ---
  const cancelUpload = () => {
      setTempUpload(null);
      setDocNameInput("");
  };

  const removeDoc = (indexToRemove: number) => {
      if(confirm("Deseja remover este documento da lista?")) {
          setFormData((prev: any) => ({
              ...prev,
              personal_docs: prev.personal_docs.filter((_: any, idx: number) => idx !== indexToRemove)
          }));
      }
  };

  // --- SALVAR ---
  const handleSave = async () => {
    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Sessão expirada. Faça login novamente.");

        const payload = { 
            ...formData,
            user_id: user.id,
            data_nascimento: formData.data_nascimento ? formData.data_nascimento : null,
            data_expedicao: formData.data_expedicao ? formData.data_expedicao : null,
        };

        if (payload.capacidade_civil === "Plena") {
            payload.rep_nome = "";
            payload.rep_cpf = ""; payload.rep_rg = "";
            payload.rep_parentesco = ""; payload.rep_endereco = ""; payload.rep_telefone = "";
        }

        if (clienteId) {
            const { error } = await supabase.from('clients').update(payload).eq('id', clienteId);
            if (error) throw error;
            alert("Cliente atualizado com sucesso!");
        } else {
            const { error } = await supabase.from('clients').insert(payload);
            if (error) throw error;
            alert("Cliente cadastrado com sucesso!");
        }
        onBack();
    } catch (error: any) {
        if (error.message.includes("cpf_unico_por_advogado") || error.message.includes("unique constraint")) {
             alert("ERRO: CPF já cadastrado.");
        } else {
             alert("Erro ao salvar: " + error.message);
        }
    } finally {
        setLoading(false);
    }
  };

  const isRgAntigo = () => {
    if (!formData.data_expedicao) return false;
    const expedicao = new Date(formData.data_expedicao);
    const hoje = new Date();
    return (hoje.getFullYear() - expedicao.getFullYear()) >= 10;
  };

  const isIncapaz = formData.capacidade_civil !== "Plena";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="text-slate-600"/></button>
            <div>
                <h1 className="text-xl font-bold text-slate-800">{clienteId ? "Editar Cliente" : "Novo Cadastro"}</h1>
                <p className="text-xs text-slate-500 font-medium">Ficha Cadastral Rural</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                <Save size={18}/> {loading ? "..." : "Salvar"}
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-32">
        
        {/* 1. IDENTIFICAÇÃO CIVIL */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
                <User className="text-emerald-500"/> 1. Identificação Civil
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                    <input name="nome" value={formData.nome} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500 transition-colors" placeholder="Nome do Segurado"/>
                </div>
                
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                        Capacidade Civil {isIncapaz && <AlertTriangle size={12} className="text-amber-500"/>}
                    </label>
                    <select 
                        name="capacidade_civil" 
                        value={formData.capacidade_civil} 
                        onChange={handleChange} 
                        className={`w-full border rounded-lg p-3 text-sm outline-none font-bold transition-colors cursor-pointer ${isIncapaz ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-300'}`}
                    >
                        <option value="Plena">Plena (Padrão)</option>
                        <option value="Relativamente Incapaz">Relativamente Incapaz (16-18)</option>
                        <option value="Absolutamente Incapaz">Absolutamente Incapaz (Menor/Curatelado)</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">CPF</label>
                    <input name="cpf" value={formData.cpf} onChange={handleChange} maxLength={14} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500" placeholder="000.000.000-00"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex justify-between">
                        Data de Nascimento
                        {idade !== null && <span className="text-emerald-600 font-black">{idade} Anos</span>}
                    </label>
                    <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/>
                </div>
                
                {/* --- CAMPO SEXO --- */}
                <div>
                    <label className="text-xs font-bold text-emerald-600 uppercase ml-1">Sexo (Crucial p/ IA)</label>
                    <select 
                        name="sexo" 
                        value={formData.sexo} 
                        onChange={handleChange} 
                        className="w-full border-2 border-emerald-100 bg-emerald-50 text-emerald-900 font-bold rounded-lg p-3 text-sm outline-none focus:border-emerald-500 cursor-pointer"
                    >
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Naturalidade (Cidade-UF)</label>
                    <input name="naturalidade" value={formData.naturalidade} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/>
                </div>
                <div className="col-span-1 md:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nacionalidade</label>
                    <input name="nacionalidade" value={formData.nacionalidade} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/>
                </div>
                <div className="col-span-1 md:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Profissão Atual</label>
                    <input name="profissao" value={formData.profissao} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/>
                </div>

                {/* --- CAMPO ANALFABETO / A ROGO --- */}
                <div className="flex items-end">
                    <div className={`flex items-center gap-3 p-3 border rounded-lg w-full transition-colors cursor-pointer ${formData.analfabeto ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                        <input 
                            type="checkbox" 
                            id="analfabeto" 
                            name="analfabeto" 
                            checked={formData.analfabeto} 
                            onChange={handleChange} 
                            className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 accent-amber-500"
                        />
                        <label htmlFor="analfabeto" className={`text-sm font-bold cursor-pointer select-none flex items-center gap-2 ${formData.analfabeto ? 'text-amber-800' : 'text-slate-600'}`}>
                           <PenTool size={16}/> Não Assina / Analfabeto
                        </label>
                    </div>
                </div>

            </div>
        </section>

        {/* --- SEÇÃO DO REPRESENTANTE LEGAL (CONDICIONAL) --- */}
        {isIncapaz && (
            <section className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200 animate-in fade-in slide-in-from-top-4">
                <h2 className="text-lg font-bold text-amber-800 mb-6 flex items-center gap-2 border-b border-amber-200 pb-2">
                    <Shield className="text-amber-600"/> Dados do Representante Legal
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="text-xs font-bold text-amber-700/70 uppercase ml-1">Nome do Representante</label>
                        <input name="rep_nome" value={formData.rep_nome} onChange={handleChange} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-amber-700/70 uppercase ml-1">Vínculo</label>
                        <select name="rep_parentesco" value={formData.rep_parentesco} onChange={handleChange} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none">
                            <option value="">Selecione...</option>
                            <option value="Mãe">Mãe</option>
                            <option value="Pai">Pai</option>
                            <option value="Tutor">Tutor</option>
                            <option value="Curador">Curador</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-amber-700/70 uppercase ml-1">CPF Rep.</label>
                        <input name="rep_cpf" value={formData.rep_cpf} onChange={handleChange} maxLength={14} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-amber-700/70 uppercase ml-1">RG Rep.</label>
                        <input name="rep_rg" value={formData.rep_rg} onChange={handleChange} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-amber-700/70 uppercase ml-1">Telefone Rep.</label>
                        <input name="rep_telefone" value={formData.rep_telefone} onChange={handleChange} maxLength={15} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/>
                    </div>
                    <div className="col-span-1 md:col-span-3">
                        <label className="text-xs font-bold text-amber-700/70 uppercase ml-1">Endereço Rep.</label>
                        <input name="rep_endereco" value={formData.rep_endereco} onChange={handleChange} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/>
                    </div>
                </div>
            </section>
        )}

        {/* 2. DOCUMENTAÇÃO & SENHAS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
                <FileText className="text-blue-500"/> 2. Documentação & Senhas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">RG (Número)</label>
                    <input name="rg" value={formData.rg} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Órgão Exp.</label>
                    <input name="orgao_expedidor" value={formData.orgao_expedidor} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500"/>
                </div>
                <div className="relative">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex justify-between">
                        Data Expedição
                        {isRgAntigo() && <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle size={10}/> Antigo</span>}
                    </label>
                    <input type="date" name="data_expedicao" value={formData.data_expedicao} onChange={handleChange} className={`w-full border rounded-lg p-3 text-sm outline-none focus:border-blue-500 ${isRgAntigo() ? 'border-red-300 bg-red-50 text-red-800' : 'border-slate-300'}`}/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">NIT / PIS</label>
                    <input name="nit" value={formData.nit} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500"/>
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">CTPS</label>
                    <input name="ctps" value={formData.ctps} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500"/>
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 text-emerald-600">Senha Meu INSS</label>
                    <input name="senha_meu_inss" value={formData.senha_meu_inss} onChange={handleChange} className="w-full border border-emerald-200 bg-emerald-50 rounded-lg p-3 text-sm outline-none focus:border-emerald-500 text-emerald-800 font-medium" placeholder="Digite a senha..."/>
                </div>
            </div>
        </section>

        {/* 3. FAMÍLIA */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
                <Users className="text-purple-500"/> 3. Família
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mãe</label>
                    <input name="nome_mae" value={formData.nome_mae} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-purple-500"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Pai</label>
                    <input name="nome_pai" value={formData.nome_pai} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-purple-500"/>
                </div>
            
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Estado Civil</label>
                    <select name="estado_civil" value={formData.estado_civil} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none bg-white">
                        <option>Solteiro(a)</option>
                        <option>Casado(a)</option>
                        <option>Divorciado(a)</option>
                        <option>Viúvo(a)</option>
                        <option>União Estável</option>
                    </select>
                </div>
                {(formData.estado_civil === "Casado(a)" || formData.estado_civil === "União Estável" || formData.estado_civil === "Viúvo(a)") && (
                    <>
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-purple-600 uppercase ml-1">Cônjuge</label>
                            <input name="nome_conjuge" value={formData.nome_conjuge} onChange={handleChange} className="w-full border border-purple-200 bg-purple-50 rounded-lg p-3 text-sm outline-none focus:border-purple-500"/>
                        </div>
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-purple-600 uppercase ml-1">CPF Cônjuge</label>
                            <input name="cpf_conjuge" value={formData.cpf_conjuge} onChange={handleChange} maxLength={14} className="w-full border border-purple-200 bg-purple-50 rounded-lg p-3 text-sm outline-none focus:border-purple-500"/>
                        </div>
                    </>
                )}
            </div>
        </section>

        {/* 4. CONTATO & LOCALIZAÇÃO */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
                <MapPin className="text-orange-500"/> 4. Contato & Localização
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">CEP</label>
                    <input name="cep" value={formData.cep} onChange={handleChange} onBlur={handleBlurCep} maxLength={9} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/>
                </div>
                <div className="md:col-span-3">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Endereço</label>
                    <input name="endereco" value={formData.endereco} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Bairro</label>
                    <input name="bairro" value={formData.bairro} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cidade - UF</label>
                    <input name="cidade" value={formData.cidade} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Phone size={12}/> Telefone</label>
                    <input name="telefone" value={formData.telefone} onChange={handleChange} maxLength={15} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Phone size={12}/> Recado</label>
                    <input name="telefone_recado" value={formData.telefone_recado} onChange={handleChange} maxLength={15} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/>
                </div>
            </div>
        </section>

        {/* 5. ANÁLISE PREVIDENCIÁRIA & IMPEDIMENTOS */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
                <Briefcase className="text-red-500"/> 5. Análise & Impedimentos (Rural)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Vínculos Urbanos (CNIS)</label>
                    <textarea name="resumo_cnis" value={formData.resumo_cnis} onChange={handleChange} rows={3} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-red-500"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Histórico de Benefícios</label>
                    <textarea name="historico_beneficios" value={formData.historico_beneficios} onChange={handleChange} rows={3} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-red-500"/>
                </div>
            </div>
        
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="cnpj" name="possui_cnpj" checked={formData.possui_cnpj} onChange={handleChange} className="w-5 h-5 text-red-600 rounded focus:ring-red-500"/>
                        <label htmlFor="cnpj" className="font-bold text-slate-700 text-sm">Possui CNPJ / MEI?</label>
                    </div>
                    {formData.possui_cnpj && (
                        <input name="detalhes_cnpj" value={formData.detalhes_cnpj} onChange={handleChange} className="w-full border border-red-300 bg-red-50 rounded-lg p-2 text-sm outline-none focus:border-red-500 ml-7 w-[calc(100%-1.75rem)]"/>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="renda" name="possui_outra_renda" checked={formData.possui_outra_renda} onChange={handleChange} className="w-5 h-5 text-red-600 rounded focus:ring-red-500"/>
                        <label htmlFor="renda" className="font-bold text-slate-700 text-sm">Outras Rendas?</label>
                    </div>
                    {formData.possui_outra_renda && (
                        <input name="detalhes_renda" value={formData.detalhes_renda} onChange={handleChange} className="w-full border border-red-300 bg-red-50 rounded-lg p-2 text-sm outline-none focus:border-red-500 ml-7 w-[calc(100%-1.75rem)]"/>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="endereco_div" name="endereco_divergente" checked={formData.endereco_divergente} onChange={handleChange} className="w-5 h-5 text-red-600 rounded focus:ring-red-500"/>
                        <label htmlFor="endereco_div" className="font-bold text-slate-700 text-sm">Endereço Divergente?</label>
                    </div>
                    {formData.endereco_divergente && (
                        <input name="justificativa_endereco" value={formData.justificativa_endereco} onChange={handleChange} className="w-full border border-red-300 bg-red-50 rounded-lg p-2 text-sm outline-none focus:border-red-500 ml-7 w-[calc(100%-1.75rem)]"/>
                    )}
                </div>
            </div>
        </section>

        {/* 6. DOCUMENTOS PESSOAIS BÁSICOS (FLUXO ANEXAR -> NOMEAR) */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
                <Paperclip className="text-indigo-500"/> 6. Documentos Pessoais Básicos
            </h2>
            
            {/* Lista de Documentos Anexados */}
            {formData.personal_docs && formData.personal_docs.length > 0 && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formData.personal_docs.map((doc: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={16} className="text-indigo-600 shrink-0"/>
                                <span className="text-sm font-medium text-indigo-900 truncate">{doc.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a href={doc.url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-indigo-200 rounded text-indigo-600 transition" title="Ver Documento">
                                    <ExternalLink size={16}/>
                                </a>
                                <button onClick={() => removeDoc(idx)} className="p-1.5 hover:bg-red-200 rounded text-red-600 transition" title="Excluir">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Área de Anexo (Upload -> Nomeação) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
                
                {!tempUpload ? (
                    // ESTADO 1: BOTÃO PARA SELECIONAR ARQUIVO
                    <div className="w-full">
                        <input 
                            type="file" 
                            id="doc-upload" 
                            className="hidden" 
                            onChange={handleSelectFile}
                            disabled={uploading}
                        />
                        <label 
                            htmlFor="doc-upload" 
                            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all w-full
                                ${uploading ? 'bg-slate-100 border-slate-300 opacity-50' : 'bg-white border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'}
                            `}
                        >
                            <UploadCloud size={32} className={`mb-3 ${uploading ? 'text-slate-400 animate-bounce' : 'text-indigo-400'}`}/>
                            <span className="text-sm font-bold text-indigo-700">
                                {uploading ? "Enviando arquivo..." : "Clique para anexar documento"}
                            </span>
                            <span className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (Max 5MB)</span>
                        </label>
                    </div>
                ) : (
                    // ESTADO 2: ARQUIVO CARREGADO -> DAR NOME
                    <div className="w-full bg-white p-4 rounded-xl border border-indigo-200 shadow-sm animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-3 mb-4 text-sm text-indigo-800 bg-indigo-50 p-2 rounded-lg">
                            <CheckCircle size={16} className="text-emerald-500"/>
                            <span className="truncate flex-1 font-medium">Arquivo pronto: <strong>{tempUpload.fileName}</strong></span>
                        </div>
                        
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block">Nome do Documento</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Ex: Identidade, Comprovante de Residência..." 
                                className="flex-1 p-3 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                                value={docNameInput}
                                onChange={e => setDocNameInput(e.target.value)}
                                autoFocus
                            />
                            <button 
                                onClick={confirmAddDoc}
                                disabled={!docNameInput.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 transition-colors"
                            >
                                <Check size={20}/>
                            </button>
                            <button 
                                onClick={cancelUpload}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-2 rounded-lg font-bold transition-colors"
                            >
                                <X size={20}/>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </section>

      </main>
    </div>
  );
}