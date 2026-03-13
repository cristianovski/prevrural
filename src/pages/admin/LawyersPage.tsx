import { useState, useEffect } from "react";
import { 
  ArrowLeft, Plus, Trash2, User, FileText, 
  Hash, Briefcase, Save, Building
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Lawyer } from "../../types"; // FIX: Usar a Interface Global
import { useToast } from "../../hooks/use-toast";
import { useConfirm } from "../../hooks/useConfirm";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

// FIX: Estender a interface global para suportar o campo nacionalidade apenas neste ecrã
interface LawyerExtended extends Lawyer {
  nacionalidade?: string;
}

// FIX: Interface específica para o estado do formulário (onde o ID pode ser nulo antes de criar)
type LawyerFormData = Partial<LawyerExtended>;

function validarCPF(cpf: string) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
}

export function LawyersPage({ onBack }: { onBack: () => void }) {
  const [lawyers, setLawyers] = useState<LawyerExtended[]>([]); // FIX: Array Tipado
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [officeAddress, setOfficeAddress] = useState("");

  const [formData, setFormData] = useState<LawyerFormData>({
    nome: "",
    nacionalidade: "Brasileiro",
    estado_civil: "Casado",
    oab: "",
    cpf: ""
  });

  const { toast } = useToast();
  const { isOpen, config, confirm: confirmAction, handleConfirm, handleCancel } = useConfirm();

  useEffect(() => {
    fetchLawyers();
    const savedAddress = localStorage.getItem("officeAddress");
    if (savedAddress) setOfficeAddress(savedAddress);
  }, []);

  const fetchLawyers = async () => {
    setLoading(true);
    const { data } = await supabase.from('lawyers').select('*').order('nome');
    if (data) setLawyers(data as LawyerExtended[]);
    setLoading(false);
  };

  const handleSaveLawyer = async () => {
    if (!formData.nome || !formData.oab || !formData.cpf) {
      return toast({ title: "Erro", description: "Nome, OAB e CPF são obrigatórios.", variant: "destructive" });
    }
    if (!validarCPF(formData.cpf)) {
      return toast({ title: "Erro", description: "CPF inválido!", variant: "destructive" });
    }

    setSaving(true);
    const payload = {
        nome: formData.nome,
        nacionalidade: formData.nacionalidade,
        estado_civil: formData.estado_civil,
        oab: formData.oab,
        cpf: formData.cpf
    };

    if (formData.id) {
        await supabase.from('lawyers').update(payload).eq('id', formData.id);
    } else {
        await supabase.from('lawyers').insert([payload]);
    }
    setSaving(false);
    setShowModal(false);
    resetForm();
    fetchLawyers();
  };

  const handleSaveAddress = () => {
      localStorage.setItem("officeAddress", officeAddress);
      toast({ title: "Sucesso", description: "Endereço do escritório atualizado!", variant: "success" });
  };

  const handleEdit = (lawyer: LawyerExtended) => {
      setFormData(lawyer);
      setShowModal(true);
  };

  const handleDelete = async (id: number) => {
      confirmAction("Atenção", "Remover este advogado?", async () => {
          await supabase.from('lawyers').delete().eq('id', id);
          fetchLawyers();
      });
  };

  const resetForm = () => {
      setFormData({ nome: "", nacionalidade: "Brasileiro", estado_civil: "Casado", oab: "", cpf: "" });
  };

  // FIX: Tipagem do evento DOM
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setFormData({...formData, cpf: v});
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800">
      <header className="bg-slate-900 text-white p-4 shadow-lg shrink-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white"><ArrowLeft size={20}/></button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2"><Briefcase className="text-blue-400" size={20}/> Equipe Jurídica</h1>
              <p className="text-xs text-slate-400 font-medium">Cadastro para Procurações</p>
            </div>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-lg transition-all active:scale-95">
            <Plus size={16}/> Novo Advogado
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
            
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-end">
                <div className="flex-1 w-full">
                    <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><Building size={18}/> Endereço do Escritório (Único)</h3>
                    <p className="text-xs text-blue-600 mb-3">Este endereço aparecerá na procuração para todos os advogados.</p>
                    <input 
                        className="w-full p-3 bg-white border border-blue-200 rounded-lg outline-none focus:border-blue-500 text-slate-700" 
                        placeholder="Ex: Rua das Flores, 123, Centro, Vitória da Conquista - BA"
                        value={officeAddress}
                        onChange={(e) => setOfficeAddress(e.target.value)}
                    />
                </div>
                <button onClick={handleSaveAddress} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all whitespace-nowrap flex items-center gap-2">
                    <Save size={16}/> Salvar Endereço
                </button>
            </div>

            <div>
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><User size={18}/> Advogados Cadastrados</h3>
                {loading ? <div className="text-center text-slate-400">Carregando...</div> : lawyers.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <Briefcase size={48} className="mx-auto text-slate-300 mb-4"/><p className="text-slate-500 font-medium">Nenhum advogado cadastrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lawyers.map(adv => (
                            <div key={adv.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{adv.nome?.charAt(0)}</div>
                                    <div><h3 className="font-bold text-slate-800">{adv.nome}</h3><p className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit mt-1">OAB: {adv.oab}</p></div>
                                </div>
                                <div className="space-y-2 text-xs text-slate-500 mb-4">
                                    <div className="flex items-center gap-2"><User size={12}/> {adv.nacionalidade}, {adv.estado_civil}</div>
                                    <div className="flex items-center gap-2"><Hash size={12}/> CPF: {adv.cpf}</div>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                                    <button onClick={() => handleEdit(adv)} className="flex-1 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100">Editar</button>
                                    <button onClick={() => handleDelete(adv.id!)} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-blue-500"/> Dados do Advogado</h3><button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button></div>
                <div className="p-6 space-y-4">
                    <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nome Completo</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={formData.nome || ""} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Dr. Fulano..." /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nº OAB</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={formData.oab || ""} onChange={e => setFormData({...formData, oab: e.target.value})} placeholder="UF 00.000" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">CPF</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={formData.cpf || ""} onChange={handleCpfChange} placeholder="000.000.000-00" maxLength={14} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nacionalidade</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={formData.nacionalidade || ""} onChange={e => setFormData({...formData, nacionalidade: e.target.value})} /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Estado Civil</label><select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={formData.estado_civil || "Casado"} onChange={e => setFormData({...formData, estado_civil: e.target.value})}><option value="Solteiro">Solteiro(a)</option><option value="Casado">Casado(a)</option><option value="Divorciado">Divorciado(a)</option><option value="Viúvo">Viúvo(a)</option></select></div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"><button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button><button onClick={handleSaveLawyer} disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">{saving ? "Salvando..." : "Salvar Advogado"}</button></div>
            </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        title={config?.title}
        message={config?.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
}