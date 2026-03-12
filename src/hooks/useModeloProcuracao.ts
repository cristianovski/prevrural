import { useState } from 'react';
import { Scale, Building2, Users, FileCheck, Tractor } from 'lucide-react';

export const MODELOS = {
  ad_judicia: {
    titulo: 'Procuração Ad Judicia et Extra',
    icone: Scale,
    desc: 'Para processos judiciais em geral (Cível, Trabalhista, Previdenciário).',
    layout: 'texto_corrido',
    texto: `Pelo presente instrumento particular de procuração, constituo meus bastantes procuradores os outorgados acima para o fim de representar-me em ação judicial, com os poderes da cláusula ad judicia et extra, para o foro em geral, onde quer que com estes se apresentem, outorgando-lhes todos e quaisquer poderes para representar o(a) Outorgante em Juízo e fora dele, em qualquer processo em que for autor, réu ou terceiro interessado. Conferindo-lhes, ainda, poderes especiais para pedir, requerer, assinar, transigir, renunciar, desistir, contestar, reconvir, concordar, discordar, ratificar, retificar, confessar, assinar declaração de hipossuficiência econômica, solicitar isenção de imposto de renda, receber quantias, dar quitação, levantar alvarás, RPVs e Precatórios, firmar compromisso e praticar todos os demais atos processuais e extraprocessuais que se fizerem necessários para o satisfatório cumprimento do presente MANDATO, acompanhando o processo em todas as suas fases e por todas suas instâncias, podendo substabelecer, no todo ou em parte, com ou sem reservas, os poderes aqui outorgados.`,
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

export type ModeloKey = keyof typeof MODELOS;

export function useModeloProcuracao() {
  const [selectedModelKey, setSelectedModelKey] = useState<ModeloKey | null>(null);

  const modeloAtual = selectedModelKey ? MODELOS[selectedModelKey] : null;

  return {
    selectedModelKey,
    setSelectedModelKey,
    modeloAtual,
    modelos: MODELOS,
  };
}