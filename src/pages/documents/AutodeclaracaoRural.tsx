import { Client } from '../../types';
import { LegacyPeriod } from '../../hooks/useProcuracaoData';

interface AutodeclaracaoRuralProps {
  cliente: Client;
  timeline: LegacyPeriod[];
  dataExtenso: string;
  cidade: string;
}

export function AutodeclaracaoRural({ cliente, timeline, dataExtenso, cidade }: AutodeclaracaoRuralProps) {
  const getStart = (p: LegacyPeriod) => p.start_date || p.start || '';
  const getEnd = (p: LegacyPeriod) => p.end_date || p.end || '';

  const ruralItems = timeline.filter(item =>
    item.type?.toLowerCase().includes('rural') ||
    item.description?.toLowerCase().includes('rural')
  );

  return (
    <div className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none text-black font-serif text-[11pt]">
      <h1 className="text-center font-bold text-xl mb-8 uppercase">AUTODECLARAÇÃO DO SEGURADO ESPECIAL</h1>
      <p className="mb-4">
        Eu, <strong>{cliente.nome}</strong>, CPF nº <strong>{cliente.cpf}</strong>, residente e domiciliado em{' '}
        <strong>{cliente.endereco || '____________________'}</strong>, declaro para os devidos fins que exerci atividade rural em regime de economia familiar nos seguintes períodos:
      </p>

      <table className="w-full border-collapse border border-black mt-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2">Período (início)</th>
            <th className="border border-black p-2">Período (fim)</th>
            <th className="border border-black p-2">Atividade / Observação</th>
          </tr>
        </thead>
        <tbody>
          {ruralItems.length > 0 ? (
            ruralItems.map((item, idx) => {
              const start = getStart(item);
              const end = getEnd(item);
              return (
                <tr key={idx}>
                  <td className="border border-black p-2">
                    {start ? new Date(start).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '___/___/____'}
                  </td>
                  <td className="border border-black p-2">
                    {end ? new Date(end).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '___/___/____'}
                  </td>
                  <td className="border border-black p-2">{item.description || item.type}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={3} className="border border-black p-2 text-center">Nenhum período rural cadastrado.</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="mt-8 text-justify">
        Declaro, sob as penas da lei, que as informações acima são verdadeiras e que estou ciente de que a falsidade desta declaração constitui crime de falsidade ideológica (art. 299 do Código Penal).
      </p>

      <div className="mt-16 text-center">
        <p>{cidade}, {dataExtenso}.</p>
        <div className="border-t border-black w-2/3 mx-auto mt-8 pt-2">
          <span className="font-bold uppercase">{cliente.nome}</span>
          <p className="text-sm">Assinatura do Declarante</p>
        </div>
      </div>
    </div>
  );
}