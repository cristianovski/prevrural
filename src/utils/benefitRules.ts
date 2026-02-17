import { differenceInYears, parseISO, differenceInMonths, isBefore, addMonths } from 'date-fns';

export interface ClientData {
  sexo: string; // 'Masculino' | 'Feminino'
  data_nascimento: string;
  profissao: string;
  
  // Dados de Tempo (Calculadora)
  tempo_rural_anos?: number; 
  tempo_urbano_anos?: number;
  
  // Impedimentos
  possui_cnpj?: boolean;
  possui_outra_renda?: boolean;

  // PARÂMETROS ESPECÍFICOS (Novos)
  data_dii?: string; // Data de Início da Incapacidade
  is_acidente?: boolean; // Isenção de carência (Art. 151)
  
  data_obito?: string; // Data do Óbito (Instituidor)
  data_casamento?: string; // Data do Casamento/União
  idade_conjuge_obito?: number; // Idade do viúvo(a) na data do óbito
}

export interface AnalysisResult {
  viable: boolean;
  status: 'aprovado' | 'rejeitado' | 'atencao';
  messages: string[];
}

// 1. Calculadora de Idade Simples
export const calcularIdade = (dataNasc: string): number => {
  if (!dataNasc) return 0;
  return differenceInYears(new Date(), parseISO(dataNasc));
};

// 2. Tabela de Duração da Pensão (Lei 13.135/2015 + Portaria ME 424/2020)
const calcularDuracaoPensao = (idade: number): string => {
  if (idade < 22) return "3 anos";
  if (idade < 28) return "6 anos";
  if (idade < 31) return "10 anos";
  if (idade < 42) return "15 anos";
  if (idade < 45) return "20 anos";
  return "VITALÍCIA";
};

// 3. Motor de Validação Principal
export const analisarViabilidade = (
  tipoBeneficio: string,
  cliente: ClientData
): AnalysisResult => {
  
  const messages: string[] = [];
  let status: 'aprovado' | 'rejeitado' | 'atencao' = 'aprovado';
  const idadeAtual = calcularIdade(cliente.data_nascimento);
  const tempoRural = cliente.tempo_rural_anos || 0;
  
  // --- REGRAS GLOBAIS (IMPEDIMENTOS) ---
  if (cliente.possui_cnpj) {
    status = 'atencao';
    messages.push("⚠️ Cliente possui CNPJ ativo. Necessário provar inatividade ou baixa renda (Tema 214 TNU).");
  }
  if (cliente.possui_outra_renda) {
    status = 'atencao';
    messages.push("⚠️ Cliente possui outra fonte de renda. Risco de descaracterização se > 1 Salário Mínimo.");
  }

  // =================================================================
  // A. APOSENTADORIA POR IDADE RURAL (Art. 48, § 1º da Lei 8.213/91)
  // =================================================================
  if (tipoBeneficio === 'Aposentadoria por Idade Rural' || tipoBeneficio === 'rural_idade') {
    const idadeMinima = cliente.sexo === 'Masculino' ? 60 : 55;
    
    if (idadeAtual < idadeMinima) {
      status = 'rejeitado';
      messages.push(`❌ Idade insuficiente. Atual: ${idadeAtual}. Exigido: ${idadeMinima}.`);
    } else {
      messages.push(`✅ Requisito Etário Cumprido (${idadeAtual} anos).`);
    }

    if (tempoRural < 15) {
      status = status === 'rejeitado' ? 'rejeitado' : 'atencao';
      messages.push(`⚠️ Carência Rural: ${tempoRural.toFixed(1)} anos provados. Meta: 15 anos (180 meses).`);
    } else {
      messages.push(`✅ Carência temporal (180 meses) aparentemente cumprida.`);
    }
  }

  // =================================================================
  // B. APOSENTADORIA HÍBRIDA (Art. 48, § 3º da Lei 8.213/91)
  // =================================================================
  else if (tipoBeneficio === 'Aposentadoria Híbrida' || tipoBeneficio === 'hibrida') {
    const idadeMinima = cliente.sexo === 'Masculino' ? 65 : 62;
    
    if (idadeAtual < idadeMinima) {
      status = 'rejeitado';
      messages.push(`❌ Idade insuficiente para Híbrida. Atual: ${idadeAtual}. Exigido: ${idadeMinima}.`);
    } else {
      messages.push(`✅ Requisito Etário Híbrido Cumprido.`);
    }

    const totalTempo = tempoRural + (cliente.tempo_urbano_anos || 0);
    if (totalTempo < 15) {
      status = status === 'rejeitado' ? 'rejeitado' : 'atencao';
      messages.push(`⚠️ Soma dos tempos (${totalTempo.toFixed(1)} anos) inferior a 15 anos.`);
    } else {
      messages.push(`✅ Soma Rural + Urbano atinge a carência.`);
    }
  }

  // =================================================================
  // C. SALÁRIO MATERNIDADE RURAL (Art. 71 da Lei 8.213/91)
  // =================================================================
  else if (tipoBeneficio === 'Salário Maternidade Rural' || tipoBeneficio === 'maternidade') {
    if (idadeAtual < 16) {
        messages.push("⚠️ Atenção: Menor de 16 anos. Verificar Súmula 657 STJ (Indígena) ou ação judicial.");
    }
    
    if (tempoRural < 0.83) { // 10 meses
        status = 'atencao';
        messages.push(`⚠️ Carência: É necessário provar atividade rural nos 10 meses anteriores ao parto/adoção.`);
    } else {
        messages.push(`✅ Período de 10 meses de atividade rural indicado.`);
    }
    messages.push("ℹ️ Obrigatório: Qualidade de Segurada Especial na data do parto.");
  }

  // =================================================================
  // D. AUXÍLIO POR INCAPACIDADE / DOENÇA (Art. 59 da Lei 8.213/91)
  // =================================================================
  else if (tipoBeneficio.includes("incapacidade") || tipoBeneficio.includes("doença")) {
    
    // 1. Carência (12 meses)
    if (cliente.is_acidente) {
        messages.push("✅ Isenção de carência aplicada (Acidente/Doença Grave - Art. 151).");
    } else {
        if (tempoRural < 1) { // Menos de 1 ano
             status = 'rejeitado';
             messages.push("❌ Carência mínima de 12 meses não atingida (e não marcado como acidente).");
        } else {
             messages.push("✅ Carência de 12 meses cumprida.");
        }
    }

    // 2. Qualidade de Segurado na DII
    if (cliente.data_dii) {
        messages.push(`ℹ️ Verificar documentos rurais próximos a ${new Date(cliente.data_dii).toLocaleDateString('pt-BR')} (DII).`);
        
        // Se houver rural, assumimos qualidade. Se for zero, alerta.
        if (tempoRural === 0) {
             status = 'rejeitado';
             messages.push("❌ Não há tempo rural lançado. Impossível verificar qualidade de segurado.");
        }
    } else {
        messages.push("⚠️ DII não informada. Não é possível fixar o marco da Qualidade de Segurado.");
    }
  }

  // =================================================================
  // E. PENSÃO POR MORTE RURAL (Art. 74 da Lei 8.213/91)
  // =================================================================
  else if (tipoBeneficio === 'Pensão por morte' || tipoBeneficio === 'pensao') {
      
      // 1. Qualidade de Segurado do Instituidor (Falecido)
      if (tempoRural > 0) {
          messages.push("✅ Há indícios de atividade rural do instituidor (falecido).");
      } else {
          status = 'atencao';
          messages.push("⚠️ Necessário provar que o falecido trabalhava na roça na Data do Óbito (ou estava no período de graça).");
      }

      // 2. Duração do Casamento (Lei 13.135/2015)
      let casamentoLongo = true;
      if (cliente.data_casamento && cliente.data_obito) {
          const mesesCasamento = differenceInMonths(parseISO(cliente.data_obito), parseISO(cliente.data_casamento));
          if (mesesCasamento < 24) {
              casamentoLongo = false;
              messages.push(`⚠️ Casamento/União com menos de 2 anos (${mesesCasamento} meses). Pensão durará apenas 4 MESES.`);
          } else {
              messages.push(`✅ Casamento/União consolidada (> 2 anos).`);
          }
      }

      // 3. Cálculo da Duração (Cotas) pela Idade do Dependente
      // Nota: Para Segurado Especial, considera-se 18 contribuições fictas se provada atividade.
      if (casamentoLongo && cliente.idade_conjuge_obito) {
          const duracao = calcularDuracaoPensao(cliente.idade_conjuge_obito);
          messages.push(`ℹ️ Duração estimada (Cônjuge com ${cliente.idade_conjuge_obito} anos): ${duracao}.`);
      } else if (!cliente.idade_conjuge_obito) {
          messages.push("ℹ️ Informe a idade do viúvo(a) para calcular a duração do benefício.");
      }
  }

  const viable = status !== 'rejeitado';
  return { viable, status, messages };
};