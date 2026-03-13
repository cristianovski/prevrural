import { useState } from 'react';
import { ArrowLeft, Printer, Scale, Building2, Users, FileText, FileCheck, Tractor } from 'lucide-react';
import { Client } from '../../types';
import { useProcuracaoData } from '../../hooks/useProcuracaoData';
import { ModeloSelector } from './ModeloSelector'; // Ajustado: mesmo diretório
import { ProcuracaoAdJudicia } from './ProcuracaoAdJudicia'; // Ajustado
import { TermoINSS } from './TermoINSS'; // Ajustado
import { AutodeclaracaoRural } from './AutodeclaracaoRural';

interface ProcuracaoProps {
  cliente: Client;
  onBack: () => void;
}

const MODELOS = {
  ad_judicia: {
    titulo: 'Procuração Ad Judicia et Extra',
    icone: Scale,
    desc: 'Para processos judiciais em geral (Cível, Trabalhista, Previdenciário).',
    layout: 'texto_corrido',
    texto: '',
  },
  previdenciaria: {
    titulo: 'Procuração Administrativa (INSS)',
    icone: Building2,
    desc: 'Específica para requerimentos, recursos e revisão no INSS.',
    layout: 'texto_corrido',
    texto: `Pelo presente instrumento particular de procuração, constituo meus bastantes procuradores os outorgados acima, com poderes específicos para representar o(a) Outorgante perante o Instituto Nacional do Seguro Social (INSS), podendo requerer benefícios, formular pedidos de reconsideração, interpor recursos, solicitar cópias de processos, apresentar provas, documentos, justificativas, receber cartas de concessão/indeferimento, cadastrar senhas (Meu INSS), e praticar todos os atos necessários para o fiel cumprimento deste mandato, inclusive substabelecer.`,
  },
  representacao_menor: {
    titulo: 'Representação de Menor/Incapaz',
    icone: Users,
    desc: 'Quando os pais/curadores representam o titular do direito.',
    layout: 'texto_corrido',
    texto: `Pelo presente instrumento particular, o(a) Outorgante, na qualidade de representante legal do menor/incapaz acima qualificado, constitui seus bastantes procuradores os outorgados acima, conferindo-lhes os poderes da cláusula ad judicia et extra para o foro em geral, especificamente para propor Ação Previdenciária ou Cível em defesa dos interesses do representado, podendo transigir, fazer acordo, firmar compromisso, substabelecer, renunciar, desistir, receber e dar quitação, levantar valores e praticar todos os atos necessários ao bom e fiel desempenho deste mandato.`,
  },
  termo_inss: {
    titulo: 'Termo de Representação (Anexo VI)',
    icone: FileCheck,
    desc: 'Modelo oficial da Portaria Conjunta nº 3 para acesso a dados previdenciários.',
    layout: 'termo_inss',
    texto: '',
  },
  autodeclaracao: {
    titulo: 'Autodeclaração Rural (Anexo VIII)',
    icone: Tractor,
    desc: 'Preenchimento automático com base na Linha do Tempo e Anamnese.',
    layout: 'autodeclaracao',
    texto: '',
  },
};

export function ProcuracaoPrint({ cliente, onBack }: ProcuracaoProps) {
  const { lawyers, timeline, loading, officeAddress, getStart, getEnd } = useProcuracaoData(cliente);
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(null);

  const dataHoje = new Date();
  const dia = dataHoje.getDate().toString().padStart(2, '0');
  const ano = dataHoje.getFullYear();
  const dataExtenso = dataHoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const cidade = 'Vitória da Conquista';

  const fmtDate = (d?: string) => (d ? d.split('-').reverse().join('/') : '___/___/_____');

  const handlePrint = () => window.print();

  if (loading) return <div className="p-10 text-center text-slate-400">Carregando dados...</div>;

  if (!selectedModelKey) {
    return <ModeloSelector modelos={MODELOS} onSelect={setSelectedModelKey} onBack={onBack} />;
  }

  const modeloAtual = MODELOS[selectedModelKey as keyof typeof MODELOS];

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col font-sans">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center print:hidden shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedModelKey(null)}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white flex items-center gap-2 text-sm font-bold"
          >
            <ArrowLeft size={18} /> Voltar
          </button>
          <span className="text-slate-500">|</span>
          <span className="font-bold text-blue-200">{modeloAtual.titulo}</span>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95"
        >
          <Printer size={18} /> Imprimir
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible flex justify-center">
        <div className="bg-white w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl print:shadow-none print:w-full text-black leading-relaxed text-justify font-serif text-[11pt]">
          {modeloAtual.layout === 'autodeclaracao' ? (
            <AutodeclaracaoRural
              cliente={cliente}
              timeline={timeline}
              cidade={cidade}
              dataExtenso={dataExtenso}
            />
          ) : modeloAtual.layout === 'termo_inss' ? (
            <TermoINSS
              cliente={cliente}
              lawyers={lawyers}
              officeAddress={officeAddress}
              cidade={cidade}
              dataExtenso={dataExtenso}
            />
          ) : (
            <ProcuracaoAdJudicia
              cliente={cliente}
              lawyers={lawyers}
              officeAddress={officeAddress}
              cidade={cidade}
              dataExtenso={dataExtenso}
            />
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white;
          }
          @page {
            margin: 0;
            size: A4;
          }
          [contenteditable]:empty:before {
            content: '';
            display: none;
          }
        }
      `}</style>
    </div>
  );
}