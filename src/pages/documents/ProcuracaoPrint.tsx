import { useState, useEffect } from "react";
import { ArrowLeft, Printer, Scale, Building2, Users, FileText, ChevronRight, FileCheck, Tractor } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Client, Lawyer, Period } from "../../types"; 

interface ProcuracaoProps {
  cliente: Client; 
  onBack: () => void;
}

interface LegacyPeriod extends Period {
    start?: string;
    end?: string;
}

const MODELOS = {
  ad_judicia: {
    titulo: "Procuração Ad Judicia et Extra",
    icone: Scale,
    desc: "Para processos judiciais em geral (Cível, Trabalhista, Previdenciário).",
    layout: "texto_corrido", 
    texto: `Pelo presente instrumento particular de procuração, constituo meus bastantes procuradores os outorgados acima para o fim de representar-me em ação judicial, com os poderes da cláusula ad judicia et extra, para o foro em geral, onde quer que com estes se apresentem, outorgando-lhes todos e quaisquer poderes para representar o(a) Outorgante em Juízo e fora dele, em qualquer processo em que for autor, réu ou terceiro interessado. Conferindo-lhes, ainda, poderes especiais para pedir, requerer, assinar, transigir, renunciar, desistir, contestar, reconvir, concordar, discordar, ratificar, retificar, confessar, assinar declaração de hipossuficiência econômica, solicitar isenção de imposto de renda, receber quantias, dar quitação, levantar alvarás, RPVs e Precatórios, firmar compromisso e praticar todos os demais atos processuais e extraprocessuais que se fizerem necessários para o satisfatório cumprimento do presente MANDATO, acompanhando o processo em todas as suas fases e por todas suas instâncias, podendo substabelecer, no todo ou em parte, com ou sem reservas, os poderes aqui outorgados.`
  },
  previdenciaria: {
    titulo: "Procuração Administrativa (INSS)",
    icone: Building2,
    desc: "Específica para requerimentos, recursos e revisão no INSS.",
    layout: "texto_corrido",
    texto: `Pelo presente instrumento particular de procuração, constituo meus bastantes procuradores os outorgados acima, com poderes específicos para representar o(a) Outorgante perante o Instituto Nacional do Seguro Social (INSS), podendo requerer benefícios, formular pedidos de reconsideração, interpor recursos, solicitar cópias de processos, apresentar provas, documentos, justificativas, receber cartas de concessão/indeferimento, cadastrar senhas (Meu INSS), e praticar todos os atos necessários para o fiel cumprimento deste mandato, inclusive substabelecer.`
  },
  representacao_menor: {
    titulo: "Representação de Menor/Incapaz",
    icone: Users,
    desc: "Quando os pais/curadores representam o titular do direito.",
    layout: "texto_corrido",
    texto: `Pelo presente instrumento particular, o(a) Outorgante, na qualidade de representante legal do menor/incapaz acima qualificado, constitui seus bastantes procuradores os outorgados acima, conferindo-lhes os poderes da cláusula ad judicia et extra para o foro em geral, especificamente para propor Ação Previdenciária ou Cível em defesa dos interesses do representado, podendo transigir, fazer acordo, firmar compromisso, substabelecer, renunciar, desistir, receber e dar quitação, levantar valores e praticar todos os atos necessários ao bom e fiel desempenho deste mandato.`
  },
  termo_inss: {
    titulo: "Termo de Representação (Anexo VI)",
    icone: FileCheck,
    desc: "Modelo oficial da Portaria Conjunta nº 3 para acesso a dados previdenciários.",
    layout: "termo_inss", 
    texto: ""
  },
  autodeclaracao: {
    titulo: "Autodeclaração Rural (Anexo VIII)",
    icone: Tractor,
    desc: "Preenchimento automático com base na Linha do Tempo e Anamnese.",
    layout: "autodeclaracao",
    texto: ""
  }
};

export function ProcuracaoPrint({ cliente, onBack }: ProcuracaoProps) {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]); 
  const [timeline, setTimeline] = useState<LegacyPeriod[]>([]); 
  const [loading, setLoading] = useState(true);
  const [officeAddress, setOfficeAddress] = useState("Endereço não configurado");
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(null);

  const dataHoje = new Date();
  const dia = dataHoje.getDate().toString().padStart(2, '0');
  const ano = dataHoje.getFullYear();
  const dataExtenso = dataHoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const cidade = "Vitória da Conquista"; 

  const fmtDate = (d?: string) => d ? d.split('-').reverse().join('/') : '___/___/_____';
  
  const getStart = (p: LegacyPeriod) => p.start_date || p.start || "";
  const getEnd = (p: LegacyPeriod) => p.end_date || p.end || "";

  useEffect(() => {
    const fetchInfo = async () => {
      const savedAddress = localStorage.getItem("officeAddress");
      if (savedAddress) setOfficeAddress(savedAddress);

      const [advRes, interviewRes] = await Promise.all([
          supabase.from('lawyers').select('*'),
          supabase.from('interviews').select('timeline_json').eq('client_id', cliente.id).maybeSingle()
      ]);

      if (advRes.data) setLawyers(advRes.data as Lawyer[]);

      if (interviewRes.data?.timeline_json) {
         const rurais = (interviewRes.data.timeline_json as LegacyPeriod[])
            .filter((t) => t.type === 'rural')
            .sort((a, b) => new Date(getStart(a)).getTime() - new Date(getStart(b)).getTime());
         setTimeline(rurais);
      }
      
      setLoading(false);
    };
    fetchInfo();
  }, [cliente]);

  const handlePrint = () => window.print();

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando dados...</div>;

  if (!selectedModelKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-slate-900 text-white p-4 shadow-lg shrink-0 flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white"><ArrowLeft size={20}/></button>
            <h1 className="text-lg font-bold flex items-center gap-2"><FileText size={20} className="text-blue-400"/> Central de Documentos</h1>
        </header>
        <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
            <h2 className="text-xl font-bold text-slate-700 mb-6">Escolha o documento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(MODELOS).map(([key, modelo]) => (
                    <button key={key} onClick={() => setSelectedModelKey(key)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4 transition-colors group-hover:bg-blue-50"></div>
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="p-3 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><modelo.icone size={24}/></div>
                            <div><h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-700">{modelo.titulo}</h3><p className="text-sm text-slate-500 leading-relaxed">{modelo.desc}</p></div>
                        </div>
                        <div className="absolute bottom-4 right-4 text-slate-300 group-hover:text-blue-500 transition-colors"><ChevronRight size={20}/></div>
                    </button>
                ))}
            </div>
        </main>
      </div>
    );
  }

  const modeloAtual = MODELOS[selectedModelKey as keyof typeof MODELOS];

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col font-sans">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center print:hidden shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
            <button onClick={() => setSelectedModelKey(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white flex items-center gap-2 text-sm font-bold"><ArrowLeft size={18}/> Voltar</button>
            <span className="text-slate-500">|</span>
            <span className="font-bold text-blue-200">{modeloAtual.titulo}</span>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95"><Printer size={18}/> Imprimir</button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible flex justify-center">
        <div className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none print:w-full text-black leading-relaxed text-justify font-serif text-[11pt]">
            
            {modeloAtual.layout === 'termo_inss' ? (
                <>
                    <div className="text-center mb-6">
                        <p className="text-[10pt] uppercase font-bold mb-1">Portaria Conjunta Nº 3/DIRAT/DIRBEN/INSS, de 8 de dezembro de 2017</p>
                    </div>

                    <h2 className="text-center font-bold text-[11pt] mb-6 uppercase border-y-2 border-black py-2 bg-slate-100 print:bg-transparent">
                        Termo de Representação e Autorização de Acesso a Informações Previdenciárias
                    </h2>

                    <p className="mb-4 leading-loose text-justify">
                        Eu, <strong>{cliente.nome.toUpperCase()}</strong>, inscrito(a) no CPF nº <strong>{cliente.cpf}</strong>, 
                        RG nº <strong>{cliente.rg || '___________'}</strong>, residente e domiciliado(a) em <strong>{cliente.endereco || '_________________________'}</strong>, 
                        representado pelos Advogados: 
                        {lawyers.length === 0 ? <span className="text-red-600 font-bold"> [NENHUM ADVOGADO CADASTRADO] </span> : 
                            lawyers.map((adv, idx) => (
                                <span key={adv.id}>
                                    {idx > 0 && ", "} <strong>{adv.nome.toUpperCase()}</strong> (OAB {adv.oab}, CPF {adv.cpf})
                                </span>
                            ))
                        }, 
                        todos estabelecidos profissionalmente no endereço <strong>{officeAddress}</strong>, 
                        <strong> CONFIRO PODERES ESPECÍFICOS</strong> para me representar perante o INSS na solicitação do 
                        serviço ou benefício abaixo indicado e <strong>AUTORIZO</strong> a referida Entidade, na pessoa de seus agentes autorizados, 
                        a terem acesso apenas às informações pessoais necessárias a subsidiar o requerimento eletrônico do serviço ou benefício abaixo elencado:
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
                        Podendo, para tanto, praticar os atos necessários ao cumprimento deste mandato, em especial, prestar informações, acompanhar requerimentos, cumprir exigências, ter vistas e tomar ciência de decisões sobre processos de requerimento de benefícios operacionalizados pelo Instituto.
                    </p>

                    <p className="mb-10 text-center font-bold">
                        {cidade}, {dataExtenso}.
                    </p>

                    <div className="flex justify-center mb-12">
                        <div className="border-t border-black w-2/3 pt-1 text-center">
                            <span className="font-bold uppercase block text-sm">{cliente.nome}</span>
                            <span className="text-xs">Assinatura do(a) Representado(a)</span>
                        </div>
                    </div>

                    <div className="border border-black p-4 mt-4 print:break-inside-avoid">
                        <h3 className="text-center font-bold uppercase mb-3 text-sm bg-slate-100 print:bg-transparent py-1">Termo de Responsabilidade</h3>
                        <p className="text-justify text-[10pt] mb-3 leading-snug">
                            Por este Termo de Responsabilidade, comprometo-me a comunicar ao INSS qualquer evento que possa anular esta Procuração, no prazo de trinta dias, a contar da data que o mesmo ocorra, principalmente o óbito do segurado / pensionista, mediante apresentação da respectiva certidão.
                        </p>
                        <p className="text-justify text-[10pt] mb-6 leading-snug">
                            Estou ciente de que o descumprimento do compromisso ora assumido, além de obrigar a devolução de importâncias recebidas indevidamente, quando for o caso, sujeitar-me-á às penalidades previstas nos arts. 171 e 299, ambos do Código Penal.
                        </p>
                        
                        <div className="mt-8 space-y-8">
                            {lawyers.map(adv => (
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
                        <p className="mb-4 font-normal"><strong>Art. 171.</strong> Obter, para si ou para outrem, vantagem ilícita, em prejuízo alheio, induzindo ou manter alguém em erro, mediante artifício, ardil ou qualquer outro meio fraudulento.</p>
                        <p className="font-normal"><strong>Art. 299.</strong> Omitir, em documento público ou particular, declaração que devia constar, ou nele inserir ou fazer inserir declaração falsa ou diversa da que devia ser escrita, com o fim de prejudicar direito, criar obrigação ou alterar a verdade sobre fato juridicamente relevante.</p>
                    </div>
                </>

            ) : modeloAtual.layout === 'autodeclaracao' ? (
                /* AUTODECLARAÇÃO */
                <div className="text-[10pt] font-sans">
                    <div className="text-center font-bold mb-4 border-b-2 border-black pb-2">
                        <p>INSTITUTO NACIONAL DO SEGURO SOCIAL</p>
                        <p>ANEXO VIII</p>
                        <p className="text-[8pt]">INSTRUÇÃO NORMATIVA PRES/INSS Nº 128, 28 DE MARÇO DE 2022</p>
                        <h1 className="text-lg mt-2">AUTODECLARAÇÃO DO SEGURADO ESPECIAL - RURAL</h1>
                        <p className="text-[8pt] font-normal italic">TODAS AS INFORMAÇÕES SERÃO CHECADAS NOS SISTEMAS OFICIAIS</p>
                    </div>

                    <div className="mb-4 border border-black p-2">
                        <h2 className="font-bold bg-slate-200 print:bg-transparent px-1 mb-2 border-b border-slate-300 print:border-black">1. DADOS DO SEGURADO</h2>
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex gap-2"><span className="font-bold">NOME:</span> <div className="flex-1 uppercase font-medium">{cliente.nome}</div></div>
                            <div className="flex gap-4">
                                <div className="flex gap-2 w-1/2"><span className="font-bold">APELIDO:</span> <div className="flex-1 border-b border-dotted border-black min-h-[1.2em]" contentEditable suppressContentEditableWarning></div></div>
                                <div className="flex gap-2 w-1/2"><span className="font-bold">NASCIMENTO:</span> <div>{fmtDate(cliente.data_nascimento)}</div></div>
                            </div>
                            <div className="flex gap-2"><span className="font-bold">ENDEREÇO:</span> <div className="flex-1 uppercase font-medium border-b border-dotted border-black" contentEditable suppressContentEditableWarning>{cliente.endereco || "PREENCHER ENDEREÇO COMPLETO"}</div></div>
                            <div className="flex gap-4">
                                <div className="flex gap-2 w-1/3"><span className="font-bold">CPF:</span> <div>{cliente.cpf}</div></div>
                                <div className="flex gap-2 w-1/3"><span className="font-bold">RG:</span> <div className="flex-1 border-b border-dotted border-black" contentEditable suppressContentEditableWarning>{cliente.rg}</div></div>
                                <div className="flex gap-2 w-1/3"><span className="font-bold">ORG. EXP:</span> <div className="flex-1 border-b border-dotted border-black" contentEditable suppressContentEditableWarning>SSP/BA</div></div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h2 className="font-bold mb-1">2. PERÍODO(S) DE ATIVIDADE RURAL:</h2>
                        <table className="w-full border-collapse border border-black text-xs">
                            <thead>
                                <tr className="bg-slate-100 print:bg-transparent">
                                    <th className="border border-black p-1 w-1/3">PERÍODO (Início a Fim)</th>
                                    <th className="border border-black p-1 w-1/3">CONDIÇÃO EM RELAÇÃO AO IMÓVEL*</th>
                                    <th className="border border-black p-1 w-1/3">SITUAÇÃO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timeline.length > 0 ? timeline.map((periodo, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-black p-2 text-center font-bold">{fmtDate(getStart(periodo))} a {fmtDate(getEnd(periodo))}</td>
                                        <td className="border border-black p-2 text-center" contentEditable suppressContentEditableWarning>POSSEIRO / PROPRIETÁRIO</td>
                                        <td className="border border-black p-2">
                                            <div className="flex flex-col gap-1">
                                                <label className="flex items-center gap-1"><input type="checkbox" className="print:hidden"/> ( ) Individualmente</label>
                                                <label className="flex items-center gap-1"><input type="checkbox" defaultChecked className="print:hidden"/> (X) Regime de Economia Familiar</label>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td className="border border-black p-4 text-center">__/__/____ a __/__/____</td>
                                        <td className="border border-black p-4" contentEditable></td>
                                        <td className="border border-black p-4"></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-4 border border-black p-2">
                        <h2 className="font-bold bg-slate-200 print:bg-transparent px-1 mb-2 border-b border-slate-300 print:border-black">3. DADOS DAS TERRAS</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex gap-2 mb-1"><span className="font-bold">NOME DO IMÓVEL:</span><div className="flex-1 border-b border-dotted border-black" contentEditable suppressContentEditableWarning>FAZENDA...</div></div>
                                <div className="flex gap-2 mb-1"><span className="font-bold">ÁREA TOTAL (Ha):</span><div className="flex-1 border-b border-dotted border-black" contentEditable suppressContentEditableWarning>__ Ha</div></div>
                            </div>
                            <div>
                                <div className="flex gap-2 mb-1"><span className="font-bold">MUNICÍPIO/UF:</span><div className="flex-1 border-b border-dotted border-black uppercase" contentEditable suppressContentEditableWarning>ANAGÉ - BA</div></div>
                                <div className="flex gap-2 mb-1"><span className="font-bold">TITULAR:</span><div className="flex-1 border-b border-dotted border-black uppercase" contentEditable suppressContentEditableWarning>{cliente.nome}</div></div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 border border-black p-2">
                        <h2 className="font-bold mb-2">5. PRINCIPAIS PRODUTOS:</h2>
                        <div className="flex gap-4 text-xs font-medium"><div className="flex-1 border-b border-dotted border-black pb-1" contentEditable suppressContentEditableWarning>MILHO, FEIJÃO, MANDIOCA (SUBSISTÊNCIA E VENDA DE EXCEDENTE)</div></div>
                    </div>

                    <div className="mt-8 pt-4 border-t-2 border-black">
                        <p className="text-justify text-[10pt] mb-6 font-bold">Declaro, sob as penas previstas na legislação, que as informações prestadas nesta declaração são verdadeiras, estando ciente das penalidades do Art. 299 do Código Penal Brasileiro (Falsidade Ideológica).</p>
                        <div className="flex justify-between items-end mt-12 px-8">
                            <div className="text-center">
                                <p className="mb-2">Anagé - BA, {dia} de {dataHoje.toLocaleDateString('pt-BR', { month: 'long' })} de {ano}</p>
                                <div className="border-t border-black w-64"></div>
                                <p className="text-[8pt] font-bold mt-1">Local e Data</p>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-black w-64 mb-1"></div>
                                <span className="font-bold uppercase text-xs block">{cliente.nome}</span>
                                <span className="text-[8pt]">Assinatura do Segurado</span>
                            </div>
                        </div>
                    </div>
                </div>

            ) : (
                /* PROCURAÇÃO AD JUDICIA */
                <>
                    <h1 className="text-center font-bold text-xl mb-12 uppercase tracking-wide border-b-2 border-black pb-2">{modeloAtual.titulo}</h1>
                    <p className="mb-6">
                        <strong className="uppercase">OUTORGANTE:</strong> <strong>{cliente.nome.toUpperCase()}</strong>, nacionalidade brasileira, estado civil {cliente.estado_civil || 'não informado'}, {cliente.profissao || 'Agricultor(a)'}, 
                        inscrito(a) no CPF sob o nº {cliente.cpf}, residente e domiciliado(a) em {cliente.endereco || 'Endereço não cadastrado'}.
                    </p>
                    <p className="mb-6">
                        <strong className="uppercase">OUTORGADOS:</strong> {lawyers.length === 0 ? <span className="text-red-600 font-bold">[ATENÇÃO: NENHUM ADVOGADO CADASTRADO]</span> : 
                        lawyers.map((adv, index) => (
                            <span key={adv.id}>
                                <strong>{adv.nome.toUpperCase()}</strong>, brasileiro(a), {adv.estado_civil}, advogado(a), inscrito(a) na OAB sob o nº <strong>{adv.oab}</strong>, inscrito(a) no CPF sob nº {adv.cpf}
                                {index < lawyers.length - 1 ? "; " : ""}
                            </span>
                        ))}
                        , todos estabelecidos profissionalmente no endereço: {officeAddress}.
                    </p>
                    <p className="mb-6"><strong className="uppercase">PODERES:</strong> {modeloAtual.texto}</p>
                    <p className="mt-12 text-center">{cidade}, {dataExtenso}.</p>
                    
                    <div className="mt-24 border-t border-black w-2/3 mx-auto pt-2 text-center mb-12">
                        <span className="font-bold block uppercase">{cliente.nome}</span>
                        <span className="text-sm">Outorgante</span>
                    </div>

                    {lawyers.map(adv => (
                        <div key={adv.id} className="mt-8 border-t border-black w-2/3 mx-auto pt-2 text-center">
                            <span className="font-bold block uppercase">{adv.nome}</span>
                            <span className="text-sm">Advogado(a)</span>
                        </div>
                    ))}
                </>
            )}
        </div>
      </div>

      <style>{`@media print { body { background: white; } @page { margin: 0; size: A4; } [contenteditable]:empty:before { content: ""; display: none; } }`}</style>
    </div>
  );
}