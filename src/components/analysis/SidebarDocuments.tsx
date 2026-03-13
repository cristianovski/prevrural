import { Eye, FileText, Paperclip } from 'lucide-react';

interface SidebarDocumentsProps {
  documentos: any[];
}

export function SidebarDocuments({ documentos }: SidebarDocumentsProps) {
  return (
    <div className="w-full md:w-80 bg-slate-100 border-l border-slate-200 p-4 overflow-y-auto hidden md:block">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Paperclip size={14} /> Documentos de Prova
      </h3>
      {documentos.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs">Nenhum documento da categoria "Provas" encontrado.</div>
      ) : (
        <div className="space-y-3">
          {documentos.map((doc, i) => {
            let dataFormatada = '';
            if (doc.issueDate && doc.issueDate !== 'S/D') {
              const [ano, mes, dia] = doc.issueDate.split('T')[0].split('-');
              dataFormatada = `${dia}/${mes}/${ano}`;
            } else {
              dataFormatada = 'S/D';
            }
            return (
              <div
                key={`${doc.id}-${i}`}
                className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {dataFormatada}
                  </span>
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                      <Eye size={14} />
                    </a>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-700 leading-tight mb-1">{doc.type}</p>
                <div className="flex items-center gap-1">
                  <FileText size={10} className="text-slate-400" />
                  <span className="text-[9px] text-slate-400">{doc.origem}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
