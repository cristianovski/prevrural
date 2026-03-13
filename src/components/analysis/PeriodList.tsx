import { Calendar, CheckCircle, Edit2, HelpCircle, Paperclip, Trash2, XCircle } from 'lucide-react';
import { Periodo } from '../../hooks/useBenefitAnalysis';

interface PeriodListProps {
  periodos: Periodo[];
  onEditClick: (p: Periodo) => void;
  onRemoveClick: (id: string) => void;
}

export function PeriodList({ periodos, onEditClick, onRemoveClick }: PeriodListProps) {
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const diffMonths = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const months = (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()) + 1;
    return months > 0 ? months : 0;
  };

  return (
    <div className="space-y-3">
      {periodos.map((p) => {
        const meses = diffMonths(p.inicio, p.fim);
        let bgColor = 'bg-white',
          borderColor = 'border-slate-200',
          icon = <Calendar size={18} className="text-slate-400" />,
          statusText = '';
        if (p.tipo === 'rural') {
          bgColor = 'bg-emerald-50';
          borderColor = 'border-emerald-200';
          icon = <CheckCircle size={18} className="text-emerald-600" />;
          statusText = 'Conta como Carência';
        } else if (p.tipo === 'urbano') {
          bgColor = 'bg-red-50';
          borderColor = 'border-red-200';
          icon = <XCircle size={18} className="text-red-600" />;
          statusText = 'Interrupção (>120 dias)';
        } else if (p.tipo === 'beneficio') {
          bgColor = 'bg-blue-50';
          borderColor = 'border-blue-200';
          icon = <HelpCircle size={18} className="text-blue-600" />;
          statusText = 'Benefício Intercalado (Conta Carência)';
        } else if (p.tipo === 'prova de retorno') {
          bgColor = 'bg-purple-50';
          borderColor = 'border-purple-200';
          icon = <Paperclip size={18} className="text-purple-600" />;
          statusText = 'Prova de Retorno';
        }
        return (
          <div
            key={p.id}
            className={`p-4 rounded-xl border ${bgColor} ${borderColor} shadow-sm transition-all hover:shadow-md relative group`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <div className="mt-1">{icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 uppercase text-sm tracking-wide">{p.tipo}</h4>
                    <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {meses} meses
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium mt-1">
                    {fmtDate(p.inicio)} até {fmtDate(p.fim)}
                  </p>
                  <p className="text-xs text-slate-500 italic mt-1">{p.obs || 'Sem observações'}</p>
                  <div className="mt-2 text-xs font-bold opacity-80">{statusText}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEditClick(p)}
                  className="text-slate-400 hover:text-amber-500 p-2 rounded hover:bg-amber-50 transition"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => onRemoveClick(p.id)}
                  className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition"
                  title="Remover"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
