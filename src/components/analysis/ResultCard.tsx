import { CheckCircle } from 'lucide-react';

interface ResultCardProps {
  der: string;
  setDer: (val: string) => void;
  totalRural: number;
  totalHibrido: number;
}

export function ResultCard({ der, setDer, totalRural, totalHibrido }: ResultCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <label className="text-xs font-bold text-slate-500 mb-1">Data do Requerimento (DER)</label>
        <input
          type="date"
          value={der}
          onChange={(e) => setDer(e.target.value)}
          className="w-full p-2 border rounded font-mono text-lg text-slate-700 bg-slate-50 focus:bg-white transition"
        />
      </div>
      <div
        className={`p-4 rounded-xl border shadow-sm flex flex-col justify-center ${
          totalRural >= 180 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-slate-500">Tempo Rural</span>
          {totalRural >= 180 && <CheckCircle size={16} className="text-emerald-600" />}
        </div>
        <div className="text-3xl font-bold text-slate-800">
          {totalRural} <span className="text-sm font-normal text-slate-500">/ 180 meses</span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${Math.min((totalRural / 180) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
        <span className="text-xs font-bold text-slate-500 mb-1">Total Híbrido</span>
        <div className="text-3xl font-bold text-slate-800">
          {totalHibrido} <span className="text-sm font-normal text-slate-500">meses</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Soma Rural + Urbano</p>
      </div>
    </div>
  );
}
