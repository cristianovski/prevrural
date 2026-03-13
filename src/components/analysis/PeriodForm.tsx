import { Edit2, Plus, Save, X } from 'lucide-react';
import { Periodo } from '../../hooks/useBenefitAnalysis';

interface PeriodFormProps {
  form: Partial<Periodo>;
  setForm: (form: Partial<Periodo>) => void;
  editingId: string | null;
  onCancelEdit: () => void;
  onSavePeriod: () => void;
}

export function PeriodForm({ form, setForm, editingId, onCancelEdit, onSavePeriod }: PeriodFormProps) {
  return (
    <div
      id="form-anchor"
      className={`p-6 rounded-2xl border shadow-sm transition-colors ${
        editingId ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-bold flex items-center gap-2 ${editingId ? 'text-amber-700' : 'text-slate-700'}`}>
          {editingId ? <Edit2 size={18} /> : <Plus size={18} />} {editingId ? 'Editando Período' : 'Adicionar Período'}
        </h3>
        {editingId && (
          <button
            onClick={onCancelEdit}
            className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-800 px-3 py-1 rounded border border-slate-300 bg-white"
          >
            <X size={12} /> Cancelar Edição
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-3">
          <label className="text-xs font-bold text-slate-500 block mb-1">Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
            className="w-full p-2.5 border rounded-lg bg-white outline-none focus:border-amber-500 text-sm"
          >
            <option value="rural">🌾 Atividade Rural</option>
            <option value="urbano">🏭 Urbano / CNIS</option>
            <option value="beneficio">🏥 Benefício INSS</option>
            <option value="lacuna">🕊️ Sem Atividade</option>
            <option value="prova de retorno">📄 Prova de Retorno</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-500 block mb-1">Início</label>
          <input
            type="date"
            value={form.inicio}
            onChange={(e) => setForm({ ...form, inicio: e.target.value })}
            className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-500 block mb-1">Fim</label>
          <input
            type="date"
            value={form.fim}
            onChange={(e) => setForm({ ...form, fim: e.target.value })}
            className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm"
          />
        </div>
        <div className="md:col-span-9">
          <label className="text-xs font-bold text-slate-500 block mb-1">Observação / Justificativa</label>
          <input
            type="text"
            placeholder="Ex: Safra de milho, Sítio do Pai..."
            value={form.obs}
            onChange={(e) => setForm({ ...form, obs: e.target.value })}
            className="w-full p-2.5 border rounded-lg outline-none focus:border-amber-500 text-sm"
          />
        </div>
        <div className="md:col-span-3">
          <button
            onClick={onSavePeriod}
            className={`w-full text-white p-2.5 rounded-lg font-bold text-sm transition flex justify-center gap-2 ${
              editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {editingId ? (
              <>
                <Save size={16} /> Salvar Alteração
              </>
            ) : (
              <>
                <Plus size={16} /> Inserir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
