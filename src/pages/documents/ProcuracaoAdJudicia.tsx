import { Client, Lawyer } from '../../types';

interface ProcuracaoAdJudiciaProps {
  cliente: Client;
  lawyers: Lawyer[];
  officeAddress: string;
  dataExtenso: string;
  cidade: string;
}

export function ProcuracaoAdJudicia({
  cliente,
  lawyers,
  officeAddress,
  dataExtenso,
  cidade,
}: ProcuracaoAdJudiciaProps) {
  return (
    <div className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none print:w-full text-black leading-relaxed text-justify font-serif text-[11pt]">
      <h1 className="text-center font-bold text-xl mb-12 uppercase tracking-wide border-b-2 border-black pb-2">
        Procuração Ad Judicia et Extra
      </h1>
      <p className="mb-6">
        <strong className="uppercase">OUTORGANTE:</strong> <strong>{cliente.nome.toUpperCase()}</strong>,
        nacionalidade brasileira, estado civil {cliente.estado_civil || 'não informado'},{' '}
        {cliente.profissao || 'Agricultor(a)'}, inscrito(a) no CPF sob o nº {cliente.cpf}, residente e domiciliado(a) em{' '}
        {cliente.endereco || 'Endereço não cadastrado'}.
      </p>
      <p className="mb-6">
        <strong className="uppercase">OUTORGADOS:</strong>{' '}
        {lawyers.length === 0 ? (
          <span className="text-red-600 font-bold">[ATENÇÃO: NENHUM ADVOGADO CADASTRADO]</span>
        ) : (
          lawyers.map((adv, index) => (
            <span key={adv.id}>
              <strong>{adv.nome.toUpperCase()}</strong>, brasileiro(a), {adv.estado_civil}, advogado(a), inscrito(a) na OAB
              sob o nº <strong>{adv.oab}</strong>, inscrito(a) no CPF sob nº {adv.cpf}
              {index < lawyers.length - 1 ? '; ' : ''}
            </span>
          ))
        )}
        , todos estabelecidos profissionalmente no endereço: {officeAddress}.
      </p>
      <p className="mb-6">
        <strong className="uppercase">PODERES:</strong> Pelo presente instrumento particular de procuração, constituo meus
        bastantes procuradores os outorgados acima para o fim de representar-me em ação judicial, com os poderes da cláusula ad
        judicia et extra, para o foro em geral, onde quer que com estes se apresentem, outorgando-lhes todos e quaisquer poderes
        para representar o(a) Outorgante em Juízo e fora dele, em qualquer processo em que for autor, réu ou terceiro interessado.
        Conferindo-lhes, ainda, poderes especiais para pedir, requerer, assinar, transigir, renunciar, desistir, contestar,
        reconvir, concordar, discordar, ratificar, retificar, confessar, assinar declaração de hipossuficiência econômica,
        solicitar isenção de imposto de renda, receber quantias, dar quitação, levantar alvarás, RPVs e Precatórios, firmar
        compromisso e praticar todos os demais atos processuais e extraprocessuais que se fizerem necessários para o satisfatório
        cumprimento do presente MANDATO, acompanhando o processo em todas as suas fases e por todas suas instâncias, podendo
        substabelecer, no todo ou em parte, com ou sem reservas, os poderes aqui outorgados.
      </p>
      <p className="mt-12 text-center">{cidade}, {dataExtenso}.</p>
      <div className="mt-24 border-t border-black w-2/3 mx-auto pt-2 text-center mb-12">
        <span className="font-bold block uppercase">{cliente.nome}</span>
        <span className="text-sm">Outorgante</span>
      </div>
      {lawyers.map((adv) => (
        <div key={adv.id} className="mt-8 border-t border-black w-2/3 mx-auto pt-2 text-center">
          <span className="font-bold block uppercase">{adv.nome}</span>
          <span className="text-sm">Advogado(a)</span>
        </div>
      ))}
    </div>
  );
}