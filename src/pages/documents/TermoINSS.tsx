import { Client, Lawyer } from '../../types';

interface TermoINSSProps {
  cliente: Client;
  lawyers: Lawyer[];
  officeAddress: string;
  dataExtenso: string;
  cidade: string;
}

export function TermoINSS({ cliente, lawyers, officeAddress, dataExtenso, cidade }: TermoINSSProps) {
  return (
    <div className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none print:w-full text-black leading-relaxed text-justify font-serif text-[11pt]">
      <div className="text-center mb-6">
        <p className="text-[10pt] uppercase font-bold mb-1">Portaria Conjunta Nº 3/DIRAT/DIRBEN/INSS, de 8 de dezembro de 2017</p>
      </div>

      <h2 className="text-center font-bold text-[11pt] mb-6 uppercase border-y-2 border-black py-2 bg-slate-100 print:bg-transparent">
        Termo de Representação e Autorização de Acesso a Informações Previdenciárias
      </h2>

      <p className="mb-4 leading-loose text-justify">
        Eu, <strong>{cliente.nome.toUpperCase()}</strong>, inscrito(a) no CPF nº <strong>{cliente.cpf}</strong>, RG nº{' '}
        <strong>{cliente.rg || '___________'}</strong>, residente e domiciliado(a) em{' '}
        <strong>{cliente.endereco || '_________________________'}</strong>, representado pelos Advogados:{' '}
        {lawyers.length === 0 ? (
          <span className="text-red-600 font-bold"> [NENHUM ADVOGADO CADASTRADO] </span>
        ) : (
          lawyers.map((adv, idx) => (
            <span key={adv.id}>
              {idx > 0 && ', '} <strong>{adv.nome.toUpperCase()}</strong> (OAB {adv.oab}, CPF {adv.cpf})
            </span>
          ))
        )}
        , todos estabelecidos profissionalmente no endereço <strong>{officeAddress}</strong>, <strong>CONFIRO PODERES ESPECÍFICOS</strong>{' '}
        para me representar perante o INSS na solicitação do serviço ou benefício abaixo indicado e <strong>AUTORIZO</strong> a referida
        Entidade, na pessoa de seus agentes autorizados, a terem acesso apenas às informações pessoais necessárias a subsidiar o
        requerimento eletrônico do serviço ou benefício abaixo elencado:
      </p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 pl-2 text-[10pt] font-medium border border-slate-300 p-4 rounded print:border-black">
        <div className="space-y-1">
          <p>I. ( ) Aposentadoria por Idade ( ) rural ( ) urbana</p>
          <p>II. ( ) Aposentadoria por Tempo de Contribuição</p>
          <p>III. ( ) Pensão por Morte Previdenciária ( ) rural ( ) urbana</p>
          <p>IV. ( ) Auxílio-Reclusão ( ) rural ( ) urbano</p>
          <p>V. ( ) Salário Maternidade ( ) rural ( ) urbano</p>
        </div>
        <div className="space-y-1">
          <p>VI. ( ) Cópia de processos</p>
          <p>VII. ( ) Extratos previdenciários</p>
          <p>VIII. ( ) Revisão de benefício</p>
          <p>IX. ( ) Recurso à JRPS</p>
          <p>X. ( ) Benefício Assistencial</p>
        </div>
      </div>

      <p className="mb-8 text-justify">
        Podendo, para tanto, praticar os atos necessários ao cumprimento deste mandato, em especial, prestar informações, acompanhar
        requerimentos, cumprir exigências, ter vistas e tomar ciência de decisões sobre processos de requerimento de benefícios
        operacionalizados pelo Instituto.
      </p>

      <p className="mb-10 text-center font-bold">{cidade}, {dataExtenso}.</p>

      <div className="flex justify-center mb-12">
        <div className="border-t border-black w-2/3 pt-1 text-center">
          <span className="font-bold uppercase block text-sm">{cliente.nome}</span>
          <span className="text-xs">Assinatura do(a) Representado(a)</span>
        </div>
      </div>

      <div className="border border-black p-4 mt-4 print:break-inside-avoid">
        <h3 className="text-center font-bold uppercase mb-3 text-sm bg-slate-100 print:bg-transparent py-1">Termo de Responsabilidade</h3>
        <p className="text-justify text-[10pt] mb-3 leading-snug">
          Por este Termo de Responsabilidade, comprometo-me a comunicar ao INSS qualquer evento que possa anular esta Procuração, no
          prazo de trinta dias, a contar da data que o mesmo ocorra, principalmente o óbito do segurado / pensionista, mediante
          apresentação da respectiva certidão.
        </p>
        <p className="text-justify text-[10pt] mb-6 leading-snug">
          Estou ciente de que o descumprimento do compromisso ora assumido, além de obrigar a devolução de importâncias recebidas
          indevidamente, quando for o caso, sujeitar-me-á às penalidades previstas nos arts. 171 e 299, ambos do Código Penal.
        </p>
        <div className="mt-8 space-y-8">
          {lawyers.map((adv) => (
            <div key={adv.id} className="text-center">
              <div className="border-t border-black w-2/3 mx-auto pt-1">
                <span className="font-bold uppercase block text-[9pt]">{adv.nome}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-[8pt] text-justify text-slate-600 print:text-black font-bold border-t border-black pt-4">
        <p className="mb-1 uppercase text-center mb-4">CÓDIGO PENAL</p>
        <p className="mb-4 font-normal">
          <strong>Art. 171.</strong> Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, induzindo ou manter alguém
          em erro, mediante artifício, ardil ou qualquer outro meio fraudulento.
        </p>
        <p className="font-normal">
          <strong>Art. 299.</strong> Omitir, em documento público ou particular, declaração que devia constar, ou nele inserir ou
          fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obrigação ou
          alterar a verdade sobre fato juridicamente relevante.
        </p>
      </div>
    </div>
  );
}