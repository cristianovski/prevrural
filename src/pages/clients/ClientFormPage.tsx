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
import { CivilDataForm } from "../../components/clients/CivilDataForm";
import { RuralDataForm } from "../../components/clients/RuralDataForm";
import { CivilFormValues, RuralFormValues } from "../../schemas/clientSchemas";
import { Client, Period } from "../../types";

interface ClientFormProps {
  cliente?: Client | null;
  onBack: () => void;
}

export function ClientFormPage({ cliente, onBack }: ClientFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'civil' | 'rural'>('civil');
  const [idade, setIdade] = useState<number | null>(null);
  
  // Estados separados para dados civis e rurais
  const [civilData, setCivilData] = useState<Partial<CivilFormValues>>({});
  const [ruralData, setRuralData] = useState<Partial<RuralFormValues>>({});
  const [historico, setHistorico] = useState("");
  const [timeline, setTimeline] = useState<Period[]>([]);

  // Carregar dados se for edição
  useEffect(() => {
    if (cliente?.id) loadFullData();
  }, [cliente]);

  useEffect(() => {
    if (civilData.data_nascimento) {
      const hoje = new Date();
      const nasc = new Date(civilData.data_nascimento);
      let idadeCalc = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idadeCalc--;
      }
      setIdade(idadeCalc);
    } else {
      setIdade(null);
    }
  }, [civilData.data_nascimento]);

  const loadFullData = async () => {
    setLoading(true);
    try {
      const [clientRes, interviewRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', cliente!.id).single(),
        supabase.from('interviews').select('*').eq('client_id', cliente!.id).maybeSingle()
      ]);

      if (clientRes.error) throw clientRes.error;
      
      if (clientRes.data) {
        // Mapeia os dados do cliente para CivilFormValues
        const mapped: CivilFormValues = {
          nome: clientRes.data.nome || "",
          cpf: clientRes.data.cpf || "",
          data_nascimento: clientRes.data.data_nascimento || "",
          sexo: clientRes.data.sexo || "Masculino",
          analfabeto: clientRes.data.analfabeto || false,
          capacidade_civil: clientRes.data.capacidade_civil || "Plena",
          rep_nome: clientRes.data.rep_nome || "",
          rep_cpf: clientRes.data.rep_cpf || "",
          rep_rg: clientRes.data.rep_rg || "",
          rep_parentesco: clientRes.data.rep_parentesco || "",
          rep_endereco: clientRes.data.rep_endereco || "",
          rep_telefone: clientRes.data.rep_telefone || "",
          rg: clientRes.data.rg || "",
          orgao_expedidor: clientRes.data.orgao_expedidor || "",
          data_expedicao: clientRes.data.data_expedicao || "",
          nit: clientRes.data.nit || "",
          ctps: clientRes.data.ctps || "",
          senha_meu_inss: clientRes.data.senha_meu_inss || "",
          nome_mae: clientRes.data.nome_mae || "",
          nome_pai: clientRes.data.nome_pai || "",
          estado_civil: clientRes.data.estado_civil || "Solteiro(a)",
          nome_conjuge: clientRes.data.nome_conjuge || "",
          cpf_conjuge: clientRes.data.cpf_conjuge || "",
          cep: clientRes.data.cep || "",
          endereco: clientRes.data.endereco || "",
          bairro: clientRes.data.bairro || "",
          cidade: clientRes.data.cidade || "",
          telefone: clientRes.data.telefone || "",
          telefone_recado: clientRes.data.telefone_recado || "",
          resumo_cnis: clientRes.data.resumo_cnis || "",
          historico_beneficios: clientRes.data.historico_beneficios || "",
          possui_cnpj: clientRes.data.possui_cnpj || false,
          detalhes_cnpj: clientRes.data.detalhes_cnpj || "",
          possui_outra_renda: clientRes.data.possui_outra_renda || false,
          detalhes_renda: clientRes.data.detalhes_renda || "",
          endereco_divergente: clientRes.data.endereco_divergente || false,
          justificativa_endereco: clientRes.data.justificativa_endereco || "",
          status_processo: clientRes.data.status_processo || "A Iniciar",
        };
        setCivilData(mapped);
      }

      if (interviewRes.data) {
        setHistorico(interviewRes.data.historico_locais || "");
        if (Array.isArray(interviewRes.data.timeline_json)) {
          setTimeline(interviewRes.data.timeline_json as Period[]);
        }
        if (interviewRes.data.dados_rurais) {
          setRuralData(interviewRes.data.dados_rurais as RuralFormValues);
        }
      }
    } catch (error) {
      console.error("Erro:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar dados." });
    } finally {
      setLoading(false);
    }
  };

  const handleCivilSubmit = (data: CivilFormValues) => {
    setCivilData(data);
    // Opcional: Salvar automaticamente ou apenas atualizar estado
    toast({ title: "Dados civis atualizados", description: "Clique em 'Salvar Tudo' para persistir." });
  };

  const handleRuralSave = (data: RuralFormValues, hist: string) => {
    setRuralData(data);
    setHistorico(hist);
    toast({ title: "Dados rurais atualizados", description: "Clique em 'Salvar Tudo' para persistir." });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada.");

      // Prepara payload do cliente
      const clientPayload = {
        ...civilData,
        user_id: user.id,
        data_nascimento: civilData.data_nascimento || null,
        data_expedicao: civilData.data_expedicao || null,
      };

      // Se capacidade civil for plena, limpa representante
      if (clientPayload.capacidade_civil === "Plena") {
        clientPayload.rep_nome = "";
        clientPayload.rep_cpf = "";
        clientPayload.rep_rg = "";
        clientPayload.rep_parentesco = "";
        clientPayload.rep_endereco = "";
        clientPayload.rep_telefone = "";
      }

      let currentClientId = cliente?.id;

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
      
      if (!cliente && currentClientId) {
        navigate(`/cliente/${currentClientId}`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao guardar.";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition">
            <ArrowLeft className="text-slate-600"/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{cliente ? "Editar Cadastro" : "Novo Cliente"}</h1>
            <p className="text-xs text-slate-500 font-medium">Dossiê Completo</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {cliente && (
            <button onClick={() => navigate(`/analise/${cliente.id}`)} className="hidden md:flex bg-orange-100 text-orange-700 hover:bg-orange-200 px-4 py-2 rounded-lg font-bold text-sm items-center gap-2 transition">
              <Calculator size={16}/> Calculadora
            </button>
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
        {activeTab === 'civil' && (
          <CivilDataForm
            initialData={civilData}
            onSubmit={handleCivilSubmit}
            loading={loading}
          />
        )}
        {activeTab === 'rural' && (
          <RuralDataForm
            initialData={ruralData}
            historico={historico}
            onSave={handleRuralSave}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}