import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutList, ChevronRight, ShoppingBag, PenTool } from "lucide-react";
import { ruralSchema } from "../../schemas/clientSchemas";
import { z } from "zod";
import { maskCPF } from "../../lib/utils";

type RuralFormValues = z.infer<typeof ruralSchema>;

interface RuralDataFormProps {
  initialData?: Partial<RuralFormValues>;
  historico?: string;
  onSave: (data: RuralFormValues, historico: string) => void;
  loading?: boolean;
}

export function RuralDataForm({ initialData, historico: initialHistorico, onSave, loading }: RuralDataFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<RuralFormValues>({
    resolver: zodResolver(ruralSchema),
    defaultValues: {
      nome_imovel: initialData?.nome_imovel || "",
      municipio_uf: initialData?.municipio_uf || "",
      itr_nirf: initialData?.itr_nirf || "",
      area_total: initialData?.area_total || "",
      area_util: initialData?.area_util || "",
      condicao_posse: initialData?.condicao_posse || "proprietario",
      outorgante_nome: initialData?.outorgante_nome || "",
      outorgante_cpf: initialData?.outorgante_cpf || "",
      culturas: initialData?.culturas || "",
      animais: initialData?.animais || "",
      destinacao: initialData?.destinacao || "",
      locais_venda: initialData?.locais_venda || "",
      tem_empregados: initialData?.tem_empregados || "nao",
      tempo_empregados: initialData?.tempo_empregados || "",
      grupo_familiar: initialData?.grupo_familiar || "",
    }
  });

  const [historico, setHistorico] = useState(initialHistorico || "");

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = maskCPF(e.target.value);
  };

  const onSubmit = (data: RuralFormValues) => {
    onSave(data, historico);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
          <LayoutList size={20} className="text-emerald-500"/> Caracterização do Imóvel
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Nome do Imóvel</label>
            <input {...register("nome_imovel")} className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Município / UF</label>
            <input {...register("municipio_uf")} className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">ITR / NIRF / CCIR</label>
            <input {...register("itr_nirf")} className="w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white transition"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Área Total (Ha)</label>
              <input {...register("area_total")} className="w-full p-3 border rounded-lg text-sm"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Condição de Posse</label>
              <div className="relative">
                <select {...register("condicao_posse")} className="w-full p-3 border rounded-lg text-sm appearance-none bg-white">
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
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Nome do Proprietário (Se não for)</label>
              <input {...register("outorgante_nome")} className="w-full p-3 border rounded-lg text-sm bg-white"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">CPF do Proprietário</label>
              <input {...register("outorgante_cpf")} onChange={handleCpfChange} maxLength={14} className="w-full p-3 border rounded-lg text-sm bg-white"/>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
          <ShoppingBag size={20} className="text-emerald-500"/> Produção & Família
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">O que produz/cria?</label>
            <textarea {...register("culturas")} rows={2} className="w-full p-3 border rounded-lg text-sm"/>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Locais de Venda</label>
            <input {...register("locais_venda")} className="w-full p-3 border rounded-lg text-sm"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Tem Empregados?</label>
              <select {...register("tem_empregados")} className="w-full p-3 border rounded-lg text-sm">
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Tempo com Empregados?</label>
              <input {...register("tempo_empregados")} className="w-full p-3 border rounded-lg text-sm"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Grupo Familiar (Quem ajuda?)</label>
            <textarea {...register("grupo_familiar")} rows={2} className="w-full p-3 border rounded-lg text-sm"/>
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
        <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow transition-all disabled:opacity-50">
          {loading ? "Salvando..." : "Salvar Ficha Rural"}
        </button>
      </div>
    </form>
  );
}