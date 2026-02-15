import { differenceInYears, parseISO } from 'date-fns';

interface ClientData {
  sexo: string; // 'Masculino' | 'Feminino'
  data_nascimento: string;
  profissao: string;
  tempo_rural_anos?: number; 
  tempo_urbano_anos?: number;
  data_ultima_atividade?: string; 
  possui_cnpj?: boolean;
  possui_outra_renda?: boolean;
  area_imovel_modulos?: number;
}

export interface AnalysisResult {
  viable: boolean;
  status: 'aprovado' | 'rejeitado' | 'atencao';
  messages: string[];
}

// 1. Calculadora de Idade
export const calcularIdade = (dataNasc: string): number => {
  if (!dataNasc) return 0;
  return differenceInYears(new Date(), parseISO(dataNasc));
};

// 2. Motor de Validação Principal
export const analisarViabilidade = (
  tipoBeneficio: 'rural_idade' | 'hibrida' | 'maternidade',
  cliente: ClientData
): AnalysisResult => {
  
  const messages: string[] = [];
  let status: 'aprovado' | 'rejeitado' | 'atencao' = 'aprovado';
  const idade = calcularIdade(cliente.data_nascimento);
  
  // --- REGRAS GLOBAIS (IMPEDIMENTOS) ---
  if (cliente.possui_cnpj) {
    status = 'atencao';
    messages.push("⚠️ Cliente possui CNPJ ativo. Necessário provar inatividade ou baixa renda.");
  }
  if (cliente.possui_outra_renda) {
    status = 'atencao';
    messages.push("⚠️ Cliente possui outra fonte de renda. Verifique se é superior ao Salário Mínimo.");
  }

  // --- REGRAS POR BENEFÍCIO ---

  // A. APOSENTADORIA POR IDADE RURAL
  if (tipoBeneficio === 'rural_idade') {
    // Regra de Idade
    const idadeMinima = cliente.sexo === 'Masculino' ? 60 : 55;
    if (idade < idadeMinima) {
      status = 'rejeitado';
      messages.push(`❌ Idade insuficiente. Atual: ${idade}. Exigido: ${idadeMinima}.`);
    } else {
      messages.push(`✅ Requisito Etário Cumprido (${idade} anos).`);
    }

    // Regra de Carência (Estimada)
    const tempoRural = cliente.tempo_rural_anos || 0;
    if (tempoRural < 15) {
      status = status === 'rejeitado' ? 'rejeitado' : 'atencao';
      messages.push(`⚠️ Tempo rural declarado (${tempoRural} anos) é menor que a carência (15 anos).`);
    } else {
      messages.push(`✅ Carência temporal aparentemente cumprida.`);
    }
  }

  // B. APOSENTADORIA HÍBRIDA
  if (tipoBeneficio === 'hibrida') {
    const idadeMinima = cliente.sexo === 'Masculino' ? 65 : 62;
    
    if (idade < idadeMinima) {
      status = 'rejeitado';
      messages.push(`❌ Idade insuficiente para Híbrida. Atual: ${idade}. Exigido: ${idadeMinima}.`);
    } else {
      messages.push(`✅ Requisito Etário Híbrido Cumprido.`);
    }

    const totalTempo = (cliente.tempo_rural_anos || 0) + (cliente.tempo_urbano_anos || 0);
    if (totalTempo < 15) {
      status = status === 'rejeitado' ? 'rejeitado' : 'atencao';
      messages.push(`⚠️ Soma dos tempos (${totalTempo} anos) inferior a 15 anos.`);
    }
  }

  // C. SALÁRIO MATERNIDADE
  if (tipoBeneficio === 'maternidade') {
    messages.push("ℹ️ Verifique se houve atividade rural nos 10 meses anteriores ao parto.");
    if (idade < 16) {
        messages.push("⚠️ Atenção: Menor de 16 anos. Verificar Súmula 657 STJ.");
    }
  }

  const viable = status !== 'rejeitado';
  return { viable, status, messages };
};