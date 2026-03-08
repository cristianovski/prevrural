import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Save, User, MapPin, Phone, 
  AlertTriangle, Shield, PenTool,
  Tractor, LayoutList, ChevronRight, ShoppingBag,
  Calculator, TrendingUp
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/use-toast";
import { getLocalDateISO } from "../../lib/utils";
import { ClientFormData, RuralFormData, Period } from "../../types";

// TIPAGEM ESTRITA: Estendemos o DTO base para cobrir todos os campos do seu ecrã
interface FormCivilState extends Partial<ClientFormData> {
  analfabeto?: boolean;
  capacidade_civil?: string;
  rep_nome?: string; rep_cpf?: string; rep_rg?: string; rep_parentesco?: string; rep_endereco?: string; rep_telefone?: string;
  rg?: string; orgao_expedidor?: string; data_expedicao?: string; nit?: string; ctps?: string; senha_meu_inss?: string;
  nome_mae?: string; nome_pai?: string; nome_conjuge?: string; cpf_conjuge?: string;
  telefone_recado?: string; resumo_cnis?: string; historico_beneficios?: string;
  detalhes_cnpj?: string; detalhes_renda?: string;
  endereco_divergente?: boolean; justificativa_endereco?: string;
}

interface FormRuralState extends Partial<RuralFormData> {
  area_total?: string; area_util?: string; municipio_uf?: string;
  outorgante_nome?: string; outorgante_cpf?: string;
  destinacao?: string; locais_venda?: string;
  tem_empregados?: string; tempo_empregados?: string; grupo_familiar?: string;
}

interface ClientFormProps {
  onBack: () => void;
  clienteId: number | null;
}

export function ClientFormPage({ onBack, clienteId }: ClientFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'civil' | 'rural'>('civil');
  const [idade, setIdade] = useState<number | null>(null);
  
  // ADEUS 'any': Estados fortemente tipados
  const [formData, setFormData] = useState<FormCivilState>({
    nome: "", sexo: "Masculino", analfabeto: false, cpf: "", data_nascimento: "",
    naturalidade: "", nacionalidade: "Brasileiro(a)", profissao: "Agricultor(a)",
    capacidade_civil: "Plena", 
    rep_nome: "", rep_cpf: "", rep_rg: "", rep_parentesco: "", rep_endereco: "", rep_telefone: "",
    rg: "", orgao_expedidor: "", data_expedicao: "", nit: "", ctps: "", senha_meu_inss: "",
    nome_mae: "", nome_pai: "", estado_civil: "Solteiro(a)", nome_conjuge: "", cpf_conjuge: "",
    cep: "", endereco: "", bairro: "", cidade: "", telefone: "", telefone_recado: "",
    resumo_cnis: "", historico_beneficios: "",
    possui_cnpj: false, detalhes_cnpj: "", possui_outra_renda: false, detalhes_renda: "",
    endereco_divergente: false, justificativa_endereco: "",
    status_processo: "A Iniciar"
  });

  const [ruralData, setRuralData] = useState<FormRuralState>({
    nome_imovel: "", itr_nirf: "", area_total: "", area_util: "", municipio_uf: "",
    condicao_posse: "proprietario", outorgante_nome: "", outorgante_cpf: "",
    culturas: "", animais: "", destinacao: "subsistencia_venda", locais_venda: "",
    tem_empregados: "nao", tempo_empregados: "", grupo_familiar: ""
  });
  
  const [historico, setHistorico] = useState("");
  const [timeline, setTimeline] = useState<Period[]>([]);

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

  // REFATORAÇÃO DE PERFORMANCE: Fim do Waterfall (Promise.all)
  const loadFullData = async () => {
    setLoading(true);
    try {
      const [clientRes, interviewRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clienteId).single(),
        supabase.from('interviews').select('*').eq('client_id', clienteId).maybeSingle()
      ]);

      if (clientRes.error) throw clientRes.error;
      
      if (clientRes.data) {
        setFormData((prev) => ({
          ...prev,
          ...clientRes.data,
          nome: clientRes.data.nome || "",
          sexo: clientRes.data.sexo || "Masculino",
          analfabeto: clientRes.data.analfabeto || false,
          cpf: clientRes.data.cpf || "",
          data_nascimento: clientRes.data.data_nascimento || ""
        }));
      }

      if (interviewRes.data) {
        setHistorico(interviewRes.data.historico_locais || "");
        if (Array.isArray(interviewRes.data.timeline_json)) {
            setTimeline(interviewRes.data.timeline_json as Period[]);
        }
        if (interviewRes.data.dados_rurais) {
            setRuralData((prev) => ({ ...prev, ...(interviewRes.data.dados_rurais as FormRuralState) }));
        }
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar dados." });
    } finally {
      setLoading(false);
    }
  };

  const mascaraCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const mascaraTelefone = (v: string) => { v = v.replace(/\D/g, ""); v = v.replace(/^(\d{2})(\d)/g, "($1) $2"); v = v.replace(/(\d)(\d{4})$/, "$1-$2"); return v.substring(0, 15); };
  const mascaraCEP = (v: string) => v.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);

  const handleCivilChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    if (name === 'cpf' || name === 'cpf_conjuge' || name === 'rep_cpf') value = mascaraCPF(value);
    if (name === 'telefone' || name === 'telefone_recado' || name === 'rep_telefone') value = mascaraTelefone(value);
    if (name === 'cep') value = mascaraCEP(value);
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleRuralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRuralData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlurCep = async () => {
    if (!formData.cep) return;
    const cepLimpo = formData.cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: `${data.localidade} - ${data.uf}`,
            naturalidade: prev.naturalidade || `${data.localidade} - ${data.uf}`
          }));
          toast({ title: "CEP Encontrado", description: `${data.logradouro}, ${data.bairro}`, variant: "success" });
        }
      } catch (error) {
         console.error("Erro na busca de CEP:", error);
      }
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
        
        if (!clienteId && currentClientId) {
            navigate(`/cliente/${currentClientId}`);
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao guardar.";
        toast({ title: "Erro", description: errorMessage, variant: "destructive" });
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

                        {/* NOVOS CAMPOS - DADOS CIVIS */}
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">RG</label><input name="rg" value={formData.rg} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Órgão Expedidor</label><input name="orgao_expedidor" value={formData.orgao_expedidor} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Data de Expedição</label><input type="date" name="data_expedicao" value={formData.data_expedicao} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>

                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome da Mãe</label><input name="nome_mae" value={formData.nome_mae} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome do Pai</label><input name="nome_pai" value={formData.nome_pai} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>

                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">NIT / PIS</label><input name="nit" value={formData.nit} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">CTPS (Número/Série)</label><input name="ctps" value={formData.ctps} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha Meu INSS</label><input name="senha_meu_inss" value={formData.senha_meu_inss} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Estado Civil</label>
                            <select name="estado_civil" value={formData.estado_civil} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500 bg-white">
                                <option value="Solteiro(a)">Solteiro(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                                <option value="Divorciado(a)">Divorciado(a)</option>
                                <option value="Viúvo(a)">Viúvo(a)</option>
                                <option value="União Estável">União Estável</option>
                            </select>
                        </div>

                        {(formData.estado_civil === "Casado(a)" || formData.estado_civil === "União Estável") && (
                            <>
                                <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome do Cônjuge</label><input name="nome_conjuge" value={formData.nome_conjuge} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">CPF do Cônjuge</label><input name="cpf_conjuge" value={formData.cpf_conjuge} onChange={handleCivilChange} maxLength={14} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"/></div>
                            </>
                        )}
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

                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2"><TrendingUp className="text-indigo-500"/> 5. Análise & Check</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Resumo CNIS</label><textarea name="resumo_cnis" rows={4} value={formData.resumo_cnis} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-indigo-500"/></div>
                            <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Histórico de Benefícios</label><textarea name="historico_beneficios" rows={4} value={formData.historico_beneficios} onChange={handleCivilChange} className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-indigo-500"/></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                             {/* CNPJ */}
                             <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="possui_cnpj" name="possui_cnpj" checked={formData.possui_cnpj} onChange={handleCivilChange} className="w-4 h-4 text-indigo-600 rounded"/>
                                    <label htmlFor="possui_cnpj" className="text-sm font-bold text-slate-700">Possui CNPJ Ativo?</label>
                                </div>
                                {formData.possui_cnpj && (
                                    <input name="detalhes_cnpj" value={formData.detalhes_cnpj} onChange={handleCivilChange} placeholder="Detalhes do CNPJ" className="w-full border border-slate-300 rounded-lg p-2 text-sm"/>
                                )}
                             </div>

                             {/* RENDA */}
                             <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="possui_outra_renda" name="possui_outra_renda" checked={formData.possui_outra_renda} onChange={handleCivilChange} className="w-4 h-4 text-indigo-600 rounded"/>
                                    <label htmlFor="possui_outra_renda" className="text-sm font-bold text-slate-700">Possui Outra Renda?</label>
                                </div>
                                {formData.possui_outra_renda && (
                                    <input name="detalhes_renda" value={formData.detalhes_renda} onChange={handleCivilChange} placeholder="Qual a fonte?" className="w-full border border-slate-300 rounded-lg p-2 text-sm"/>
                                )}
                             </div>

                             {/* ENDEREÇO DIVERGENTE */}
                             <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="endereco_divergente" name="endereco_divergente" checked={formData.endereco_divergente} onChange={handleCivilChange} className="w-4 h-4 text-indigo-600 rounded"/>
                                    <label htmlFor="endereco_divergente" className="text-sm font-bold text-slate-700">Endereço Divergente?</label>
                                </div>
                                {formData.endereco_divergente && (
                                    <input name="justificativa_endereco" value={formData.justificativa_endereco} onChange={handleCivilChange} placeholder="Justificativa" className="w-full border border-slate-300 rounded-lg p-2 text-sm"/>
                                )}
                             </div>
                        </div>
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

                        {/* DADOS DO PROPRIETÁRIO */}
                        <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Nome do Proprietário (Se não for)</label><input name="outorgante_nome" value={ruralData.outorgante_nome} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm bg-white"/></div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">CPF do Proprietário</label><input name="outorgante_cpf" value={ruralData.outorgante_cpf} onChange={handleRuralChange} maxLength={14} className="w-full p-3 border rounded-lg text-sm bg-white"/></div>
                        </div>

                     </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2"><ShoppingBag size={20} className="text-emerald-500"/> Produção & Família</h3>
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">O que produz/cria?</label><textarea name="culturas" rows={2} value={ruralData.culturas} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>
                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Locais de Venda</label><input name="locais_venda" value={ruralData.locais_venda} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Tem Empregados?</label>
                                <select name="tem_empregados" value={ruralData.tem_empregados} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm">
                                    <option value="nao">Não</option>
                                    <option value="sim">Sim</option>
                                </select>
                            </div>
                            <div><label className="text-xs font-bold text-slate-500 mb-1 block">Tempo com Empregados?</label><input name="tempo_empregados" value={ruralData.tempo_empregados} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>
                        </div>

                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Grupo Familiar (Quem ajuda?)</label><textarea name="grupo_familiar" rows={2} value={ruralData.grupo_familiar} onChange={handleRuralChange} className="w-full p-3 border rounded-lg text-sm"/></div>
                    </div>
                </div>

                {/* NARRATIVA */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2"><PenTool size={20} className="text-emerald-500"/> Narrativa Rural</h3>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Histórico de Locais / Narrativa</label>
                        <textarea rows={6} value={historico} onChange={(e) => setHistorico(e.target.value)} className="w-full p-3 border rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="Descreva a história rural do cliente..."/>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}