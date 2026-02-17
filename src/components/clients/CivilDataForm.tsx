import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, PenTool, AlertTriangle, Shield, MapPin, Phone, TrendingUp } from "lucide-react";
import { ClientCivilData } from "../../types/client";

// Zod Schema
const civilSchema = z.object({
  nome: z.string().min(3, "Nome muito curto"),
  cpf: z.string().length(14, "CPF inválido"),
  data_nascimento: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  sexo: z.enum(["Masculino", "Feminino"]),
  analfabeto: z.boolean(),
  capacidade_civil: z.enum(["Plena", "Relativamente Incapaz", "Absolutamente Incapaz"]),

  // Opcionais
  rep_nome: z.string().optional(),
  rep_cpf: z.string().optional(),

  // Endereço
  cep: z.string().min(9, "CEP incompleto"),
  endereco: z.string().min(5, "Endereço incompleto"),
  bairro: z.string().optional(),
  cidade: z.string().min(2, "Cidade obrigatória"),
  telefone: z.string().min(14, "Telefone inválido"),

  // Outros campos podem ser adicionados conforme necessidade
});

type CivilFormValues = z.infer<typeof civilSchema>;

interface CivilDataFormProps {
  initialData?: Partial<ClientCivilData>;
  onSubmit: (data: CivilFormValues) => void;
  loading?: boolean;
}

export function CivilDataForm({ initialData, onSubmit, loading }: CivilDataFormProps) {
  const { control, register, handleSubmit, formState: { errors }, watch } = useForm<CivilFormValues>({
    resolver: zodResolver(civilSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      cpf: initialData?.cpf || "",
      sexo: initialData?.sexo || "Masculino",
      analfabeto: initialData?.analfabeto || false,
      capacidade_civil: initialData?.capacidade_civil || "Plena",
      cep: initialData?.cep || "",
      endereco: initialData?.endereco || "",
      cidade: initialData?.cidade || "",
      telefone: initialData?.telefone || "",
      // ... outros campos
    }
  });

  const isIncapaz = watch("capacidade_civil") !== "Plena";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">

      {/* SEÇÃO 1: IDENTIFICAÇÃO */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2 border-b pb-2">
          <User className="text-emerald-500"/> 1. Identificação Civil
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
            <input
              {...register("nome")}
              className={`w-full border rounded-lg p-3 text-sm outline-none focus:border-emerald-500 transition-colors ${errors.nome ? 'border-red-500' : 'border-slate-300'}`}
              placeholder="Nome do Segurado"
            />
            {errors.nome && <span className="text-red-500 text-xs">{errors.nome.message}</span>}
          </div>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase ml-1">CPF</label>
             <input
                {...register("cpf")}
                maxLength={14} // Máscara deve ser aplicada no onChange ou via Controller
                className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-emerald-500"
                placeholder="000.000.000-00"
             />
             {errors.cpf && <span className="text-red-500 text-xs">{errors.cpf.message}</span>}
          </div>

          <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                  Capacidade Civil {isIncapaz && <AlertTriangle size={12} className="text-amber-500"/>}
              </label>
              <select {...register("capacidade_civil")} className={`w-full border rounded-lg p-3 text-sm outline-none font-bold cursor-pointer ${isIncapaz ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-300'}`}>
                  <option value="Plena">Plena (Padrão)</option>
                  <option value="Relativamente Incapaz">Relativamente Incapaz (16-18)</option>
                  <option value="Absolutamente Incapaz">Absolutamente Incapaz (Menor/Curatelado)</option>
              </select>
          </div>

          {/* Outros campos omitidos para brevidade neste exemplo de refatoração */}
        </div>
      </section>

      {/* SEÇÃO REPRESENTANTE LEGAL (Condicional) */}
      {isIncapaz && (
          <section className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200">
              <h2 className="text-lg font-bold text-amber-800 mb-6 flex items-center gap-2 border-b border-amber-200 pb-2">
                  <Shield className="text-amber-600"/> Dados do Representante Legal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                      <label className="text-xs font-bold text-amber-700/70 uppercase ml-1">Nome do Representante</label>
                      <input {...register("rep_nome")} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-amber-700/70 uppercase ml-1">CPF Rep.</label>
                      <input {...register("rep_cpf")} className="w-full border border-amber-300 bg-white rounded-lg p-3 text-sm outline-none focus:border-amber-500"/>
                  </div>
              </div>
          </section>
      )}

      <div className="flex justify-end">
          <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold shadow transition-all disabled:opacity-50">
              {loading ? "Salvando..." : "Salvar Dados Civis"}
          </button>
      </div>
    </form>
  );
}
