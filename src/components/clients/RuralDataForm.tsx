import { useState } from "react";
import { LayoutList, ChevronRight, ShoppingBag, PenTool } from "lucide-react";
import { ClientRuralData } from "../../types/client";

interface RuralDataFormProps {
  initialData?: Partial<ClientRuralData>;
  historico?: string;
  onSave: (data: ClientRuralData, historico: string) => void;
  loading?: boolean;
}

export function RuralDataForm({ initialData, historico: initialHistorico, onSave, loading }: RuralDataFormProps) {
  const [ruralData, setRuralData] = useState<Partial<ClientRuralData>>(initialData || {
    nome_imovel: "",
    municipio_uf: "",
    itr_nirf: "",
    area_total: "",
    condicao_posse: "proprietario",
    outorgante_nome: "",
    outorgante_cpf: "",
    culturas: "",
    locais_venda: "",
    tem_empregados: "nao",
    tempo_empregados: "",
    grupo_familiar: ""
  });

  const [historico, setHistorico] = useState(initialHistorico || "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setRuralData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    onSave(ruralData as ClientRuralData, historico);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
                    <LayoutList size={20} className="text-emerald-500"/> Caracterização do Imóvel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nome do Imóvel</label>
                    <input name="nome_imovel" value={ruralData.nome_imovel} onChange={handleChange} className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition"/>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Município / UF</label>
                    <input name="municipio_uf" value={ruralData.municipio_uf} onChange={handleChange} className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition"/>
                </div>

                {/* Outros campos omitidos... */}

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Condição de Posse</label>
                    <div className="relative">
                        <select name="condicao_posse" value={ruralData.condicao_posse} onChange={handleChange} className="w-full p-3 border rounded-lg text-sm appearance-none bg-white cursor-pointer hover:border-emerald-500 transition">
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

        {/* NARRATIVA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
                <PenTool size={20} className="text-emerald-500"/> Narrativa Rural
            </h3>
            <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Histórico de Locais / Narrativa</label>
                <textarea
                    rows={6}
                    value={historico}
                    onChange={(e) => setHistorico(e.target.value)}
                    className="w-full p-3 border rounded-lg text-sm outline-none focus:border-emerald-500 min-h-[150px]"
                    placeholder="Descreva a história rural do cliente detalhadamente..."
                />
            </div>
        </div>

        <div className="flex justify-end">
            <button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow transition-all disabled:opacity-50">
                {loading ? "Salvando..." : "Salvar Ficha Rural"}
            </button>
        </div>
    </div>
  );
}
