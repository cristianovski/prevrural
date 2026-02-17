import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // IMPORTANTE: Hook de navegação
import { 
  ArrowLeft, Save, User, MapPin, Phone, 
  AlertTriangle, Shield, PenTool,
  Tractor, LayoutList, ChevronRight, ShoppingBag,
  Calculator, TrendingUp
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/use-toast";
import { getLocalDateISO } from "../../lib/utils";

interface ClientFormProps {
  onBack: () => void;
  clienteId: number | null;
}

export function ClientFormPage({ onBack, clienteId }: ClientFormProps) {
  const navigate = useNavigate(); // Hook para navegar entre páginas
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'civil' | 'rural'>('civil');
  const [idade, setIdade] = useState<number | null>(null);
  
  // --- ESTADO 1: DADOS CIVIS ---
  const [formData, setFormData] = useState<any>({
    nome: "",
    sexo: "Masculino",
    analfabeto: false,
    cpf: "",
    data_nascimento: "",
    naturalidade: "",
    nacionalidade: "Brasileiro(a)",
    profissao: "Agricultor(a)",
    capacidade_civil: "Plena", 
    rep_nome: "", rep_cpf: "", rep_rg: "", rep_parentesco: "", rep_endereco: "", rep_telefone: "",
    rg: "", orgao_expedidor: "", data_expedicao: "", nit: "", ctps: "", senha_meu_inss: "",
    nome_mae: "", nome_pai: "", estado_civil: "Solteiro(a)", nome_conjuge: "", cpf_conjuge: "",
    cep: "", endereco: "", bairro: "", cidade: "", telefone: "", telefone_recado: "",
    resumo_cnis: "", historico_beneficios: "",
    possui_cnpj: false, detalhes_cnpj: "",
    possui_outra_renda: false, detalhes_renda: "",
    endereco_divergente: false, justificativa_endereco: "",
    personal_docs: [],
    status_processo: "A Iniciar"
  });

  // --- ESTADO 2: DADOS RURAIS ---
  const [ruralData, setRuralData] = useState<any>({
    nome_imovel: "", itr_nirf: "", area_total: "", area_util: "", municipio_uf: "",
    condicao_posse: "proprietario", outorgante_nome: "", outorgante_cpf: "",
    culturas: "", animais: "", destinacao: "subsistencia_venda", locais_venda: "",
    tem_empregados: "nao", tempo_empregados: "", grupo_familiar: ""
  });
  const [historico, setHistorico] = useState("");
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    if (clienteId) loadFullData();
  }, [clienteId]);

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

  const loadFullData = async () => {
    setLoading(true);
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clienteId)
        .single();

      if (clientError) throw clientError;
      if (clientData) {
        setFormData({
          ...clientData,
          nome: clientData.nome || "",
          sexo: clientData.sexo || "Masculino",
          analfabeto: clientData.analfabeto || false,
          cpf: clientData.cpf || "",
          data_nascimento: clientData.data_nascimento || "",
          personal_docs: clientData.personal_docs || []
        });
      }

      const { data: interviewData } = await supabase
        .from('interviews')
        .select('*')
        .eq('client_id', clienteId)
        .maybeSingle();

      if (interviewData) {
        setHistorico(interviewData.historico_locais || "");
        if (Array.isArray(interviewData.timeline_json)) setTimeline(interviewData.timeline_json);
        if (interviewData.dados_rurais) setRuralData((prev: any) => ({ ...prev, ...interviewData.dados_rurais }));
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar dados." });
    } finally {
      setLoading(false);
    }
  };

  // Handlers básicos (CEP, Máscaras) mantidos iguais...
  const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const mascaraTelefone = (v: string) => { v = v.replace(/\D/g, ""); v = v.replace(/^(\d{2})(\d)/g, "($1) $2"); v = v.replace(/(\d)(\d{4})$/, "$1-$2"); return v.substring(0, 15); };
  const mascaraCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);

  const handleCivilChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    if (name === 'cpf' || name === 'cpf_conjuge' || name === 'rep_cpf') value = mascaraCPF(value);
    if (name === 'telefone' || name === 'telefone_recado' || name === 'rep_telefone') value = mascaraTelefone(value);
    if (name === 'cep') value = mascaraCEP(value);
    setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRuralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRuralData({ ...ruralData, [e.target.name]: e.target.value });
  };

  const handleBlurCep = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev: any) => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: `${data.localidade} - ${data.uf}`,
            naturalidade: prev.naturalidade || `${data.localidade} - ${data.uf}`
          }));
          toast({ title: "CEP Encontrado", description: `${data.logradouro}, ${data.bairro}`, variant: "success" });
        }
      } catch (error) {}
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Sessão expirada.");

        const clientPayload = { 
            ...formData,
            user_id: user.id,
            data_nascimento: formData.data_nascimento || null,
            data_expedicao: formData.data_expedicao || null,
        };

        if (clientPayload.capacidade_civil === "Plena") {
            clientPayload.rep_nome = ""; clientPayload.rep_cpf = ""; clientPayload.rep_rg = "";
            clientPayload.rep_parentesco = ""; clientPayload.rep_endereco = ""; clientPayload.rep_telefone = "";
        }

        let currentClientId = clienteId;

        if (currentClientId) {
            const { error } = await supabase.from('clients').update(clientPayload).eq('id', currentClientId);
            if (error) throw error;
        } else {
            const { data, error } = await supabase.from('clients').insert(clientPayload).select().single();
            if (error) throw error;
            currentClientId = data.id;
        }

        if (currentClientId) {
            const { error: interviewError } = await supabase.from('interviews').upsert({
                client_id: currentClientId,
                historico_locais: historico,
                timeline_json: timeline,
                dados_rurais: ruralData,
                updated_at: getLocalDateISO()
            }, { onConflict: 'client_id' });
            if (interviewError) throw interviewError;
        }

        toast({ title: "Sucesso!", description: "Dados salvos.", variant: "success" });
        
        // Se for novo cadastro, redireciona para o dashboard ou para a página de edição do mesmo
        if (!clienteId && currentClientId) {
            navigate(`/cliente/${currentClientId}`);
        }

    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
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
                <h1 className="text-xl font-bold text-slate-800">{clienteId ? "Editar Cadastro" : "Novo Cliente"}</h1>
                <p className="text-xs text-slate-500 font-medium">Dossiê Completo</p>
            </div>
        </div>
        
        <div className="flex gap-2">
            {/* BOTÕES DE NAVEGAÇÃO RÁPIDA (Só aparecem se o cliente já existe) */}
            {clienteId && (
              <>
                <button onClick={() => navigate(`/analise/${clienteId}`)} className="hidden md:flex bg-orange-100 text-orange-700 hover:bg-orange-200 px-4 py-2 rounded-lg font-bold text-sm items-center gap-2 transition">
                  <Calculator size={16}/> Calculadora
                </button>
              </>
            )}

            <button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                <Save size={18}/> {loading ? "Salvando..." : "Salvar Tudo"}
            </button>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-white border-b px-4 flex gap-6 sticky top-[73px] z-10">
          <button onClick={() => setActiveTab('civil')} className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'civil' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <User size={18}/> Dados Civis
          </button>
          <button onClick={() => setActiveTab('rural')} className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'rural' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Tractor size={18}/> Ficha Rural
          </button>
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-32">
        
        {/* ABA 1: CIVIL */}
        {activeTab === 'civil' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2"><User className="text-emerald-500"/> 1. Identificação Civil</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                            <input name="nome" value={formData.nome} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500 transition-colors" placeholder="Nome do Segurado"/>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">Capacidade Civil {isIncapaz && <AlertTriangle size={12} className="text-amber-500"/>}</label>
                            <select name="capacidade_civil" value={formData.capacidade_civil} onChange={handleCivilChange} className={`w-full border rounded-lg p-3 text-sm outline-none font-bold cursor-pointer ${isIncapaz ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-300'}`}>
                                <option value="Plena">Plena (Padrão)</option>
                                <option value="Relativamente Incapaz">Relativamente Incapaz (16-18)</option>
                                <option value="Absolutamente Incapaz">Absolutamente Incapaz (Menor/Curatelado)</option>
                            </select>
                        </div>

                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">CPF</label><input name="cpf" value={formData.cpf} onChange={handleCivilChange} maxLength={14} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500" placeholder="000.000.000-00"/></div>
                        
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex justify-between">Data de Nascimento {idade !== null && <span className="text-emerald-600 font-black">{idade} Anos</span>}</label>
                            <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-emerald-600 uppercase ml-1">Sexo (Crucial p/ IA)</label>
                            <select name="sexo" value={formData.sexo} onChange={handleCivilChange} className="w-full border-2 border-emerald-100 bg-emerald-50 text-emerald-900 font-bold rounded-lg p-3 text-sm outline-none focus:border-emerald-500 cursor-pointer">
                                <option value="Masculino">Masculino</option>
                                <option value="Feminino">Feminino</option>
                            </select>
                        </div>

                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Naturalidade (Cidade-UF)</label><input name="naturalidade" value={formData.naturalidade} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Nacionalidade</label><input name="nacionalidade" value={formData.nacionalidade} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Profissão Atual</label><input name="profissao" value={formData.profissao} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>

                        <div className="flex items-end">
                            <div className={`flex items-center gap-3 p-3 border rounded-lg w-full transition-colors cursor-pointer ${formData.analfabeto ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                                <input type="checkbox" id="analfabeto" name="analfabeto" checked={formData.analfabeto} onChange={handleCivilChange} className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 accent-amber-500"/>
                                <label htmlFor="analfabeto" className={`text-sm font-bold cursor-pointer select-none flex items-center gap-2 ${formData.analfabeto ? 'text-amber-800' : 'text-slate-600'}`}><PenTool size={16}/> Não Assina / Analfabeto</label>
                            </div>
                        </div>
                    </div>
                </section>

                {isIncapaz && (
                    <section className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200">
                        <h2 className="text-lg font-bold text-amber-800 mb-6 flex items-center gap-2 border-b border-amber-200 pb-2"><Shield className="text-amber-600"/> Dados do Representante Legal</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="col-span-1 md:col-span-2"><label className="text-xs font-bold text-amber-700/70 uppercase ml-1">Nome do Representante</label><input name="rep_nome" value={formData.rep_nome} onChange={handleCivilChange} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/></div>
                            <div><label className="text-xs font-bold text-amber-700/70 uppercase ml-1">Vínculo</label><select name="rep_parentesco" value={formData.rep_parentesco} onChange={handleCivilChange} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none"><option value="">Selecione...</option><option value="Mãe">Mãe</option><option value="Pai">Pai</option><option value="Tutor">Tutor</option><option value="Curador">Curador</option></select></div>
                            <div><label className="text-xs font-bold text-amber-700/70 uppercase ml-1">CPF Rep.</label><input name="rep_cpf" value={formData.rep_cpf} onChange={handleCivilChange} maxLength={14} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/></div>
                            <div><label className="text-xs font-bold text-amber-700/70 uppercase ml-1">RG Rep.</label><input name="rep_rg" value={formData.rep_rg} onChange={handleCivilChange} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/></div>
                            <div><label className="text-xs font-bold text-amber-700/70 uppercase ml-1">Telefone Rep.</label><input name="rep_telefone" value={formData.rep_telefone} onChange={handleCivilChange} maxLength={15} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/></div>
                            <div className="col-span-1 md:col-span-3"><label className="text-xs font-bold text-amber-700/70 uppercase ml-1">Endereço Rep.</label><input name="rep_endereco" value={formData.rep_endereco} onChange={handleCivilChange} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/></div>
                        </div>
                    </section>
                )}

                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2"><MapPin className="text-orange-500"/> 4. Contato & Localização</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">CEP</label><input name="cep" value={formData.cep} onChange={handleCivilChange} onBlur={handleBlurCep} maxLength={9} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/></div>
                        <div className="md:col-span-3"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Endereço</label><input name="endereco" value={formData.endereco} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Bairro</label><input name="bairro" value={formData.bairro} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Cidade - UF</label><input name="cidade" value={formData.cidade} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Phone size={12}/> Telefone</label><input name="telefone" value={formData.telefone} onChange={handleCivilChange} maxLength={15} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-orange-500"/></div>
                    </div>
                </section>
            </div>
        )}

        {/* ABA 2: RURAL */}
        {activeTab === 'rural' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2"><LayoutList size={20} className="text-emerald-500"/> Caracterização do Imóvel</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Nome do Imóvel</label><input name="nome_imovel" value={ruralData.nome_imovel} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Município / UF</label><input name="municipio_uf" value={ruralData.municipio_uf} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">ITR / NIRF / CCIR</label><input name="itr_nirf" value={ruralData.itr_nirf} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Área Total (Ha)</label><input name="area_total" value={ruralData.area_total} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Condição de Posse</label>
                                <div className="relative">
                                    <select name="condicao_posse" value={ruralData.condicao_posse} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm appearance-none bg-white">
                                        <option value="proprietario">Proprietário</option>
                                        <option value="posseiro">Posseiro</option>
                                        <option value="arrendatario">Arrendatário</option>
                                        <option value="parceiro">Parceiro / Meeiro</option>
                                        <option value="comodatario">Comodatário</option>
                                        <option value="assentado">Assentado</option>
                                    </select>
                                    <ChevronRight size={14} className="absolute right-3 top-3.5 rotate-90 text-slate-400 pointer-events-none"/>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2"><ShoppingBag size={20} className="text-emerald-500"/> Produção & Família</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">O que produz/cria?</label><textarea name="culturas" rows={2} value={ruralData.culturas} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Grupo Familiar (Quem ajuda?)</label><textarea name="grupo_familiar" rows={2} value={ruralData.grupo_familiar} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}