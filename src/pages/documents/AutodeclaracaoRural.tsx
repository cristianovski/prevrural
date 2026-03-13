import { Client } from '../../types';

interface Props {
  cliente: Client;
  timeline: any[];
  cidade: string;
  dataExtenso: string;
}

export function AutodeclaracaoRural({ cliente, timeline, cidade, dataExtenso }: Props) {
  return (
    <div>
      <h1 className="text-center font-bold text-xl mb-4">AUTODECLARAÇÃO DO SEGURADO ESPECIAL – RURAL</h1>
      <p>
        Eu, {cliente.nome}, portador(a) do CPF nº {cliente.cpf || '_______________'},
        residente e domiciliado(a) no endereço: {cliente.endereco || '_______________'},
        declaro sob as penas da lei que exerci atividades rurais nos períodos e condições abaixo informados.
      </p>
      <div className="mt-8 mb-8">
        <h2 className="font-bold text-lg mb-2">Períodos de Atividade:</h2>
        <ul className="list-disc pl-5">
          {timeline && timeline.filter(t => t.type === 'rural').map((event, idx) => (
            <li key={idx}>
              De {event.start_date || '___/___/____'} até {event.end_date || '___/___/____'}
              {event.description && ` - ${event.description}`}
            </li>
          ))}
          {(!timeline || timeline.filter(t => t.type === 'rural').length === 0) && (
            <li>Nenhum período rural registrado na linha do tempo.</li>
          )}
        </ul>
      </div>
      <p className="mt-8 text-right">
        {cidade}, {dataExtenso}.
      </p>
      <div className="mt-16 text-center">
        <p>_________________________________________________</p>
        <p className="font-bold">{cliente.nome}</p>
        <p>Declarante</p>
      </div>
    </div>
  );
}
