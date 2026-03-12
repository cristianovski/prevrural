import { ArrowLeft, FileText } from 'lucide-react';

interface Modelo {
  titulo: string;
  icone: React.ElementType;
  desc: string;
  layout: string;
  texto: string;
}

interface ModeloSelectorProps {
  modelos: Record<string, Modelo>;
  onSelect: (key: string) => void;
  onBack: () => void;
}

export function ModeloSelector({ modelos, onSelect, onBack }: ModeloSelectorProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-lg shrink-0 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <FileText size={20} className="text-blue-400" /> Central de Documentos
        </h1>
      </header>
      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <h2 className="text-xl font-bold text-slate-700 mb-6">Escolha o documento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(modelos).map(([key, modelo]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4 transition-colors group-hover:bg-blue-50"></div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <modelo.icone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-700">{modelo.titulo}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{modelo.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}