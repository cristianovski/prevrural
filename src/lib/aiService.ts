// src/lib/aiService.ts
// Serviço unificado para chamadas à API DeepSeek (compatível com OpenAI)

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat'; // ou 'deepseek-reasoner' para modelos de raciocínio

if (!DEEPSEEK_API_KEY) {
  console.error('VITE_DEEPSEEK_API_KEY não encontrada no .env');
}

/**
 * Faz uma chamada genérica à API DeepSeek
 * @param messages Lista de mensagens no formato OpenAI
 * @param temperature Criatividade (0-2)
 * @returns Texto gerado
 */
async function callDeepSeek(messages: { role: string; content: string }[], temperature = 0.7): Promise<string> {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DeepSeek API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro na chamada DeepSeek:', error);
    throw error;
  }
}

/**
 * Gera um parecer jurídico com base nos dados do cliente e na tese selecionada
 * (usado em LegalOpinionPage)
 */
export async function gerarParecerIA(cliente: any, teseJuridica: string) {
  const prompt = `
    ATUE COMO AUDITOR FEDERAL RIGOROSO DO INSS.
    
    SUA MISSÃO:
    Analise a viabilidade deste benefício rural. Seja cético. Aponte falhas.
    
    --- 1. O SEGURADO ---
    Nome: ${cliente.nome}
    Idade: ${cliente.idade_calculada}
    Sexo: ${cliente.sexo}
    Profissão: ${cliente.profissao}
    CNIS Urbano: ${cliente.resumo_cnis || "Limpo"}
    CNPJ: ${cliente.possui_cnpj ? `SIM (${cliente.detalhes_cnpj})` : "NÃO"}
    
    --- 2. A PROVA ---
    Documentos: ${JSON.stringify(cliente.docs_checklist)}

    --- 3. REGRA APLICÁVEL ---
    "${teseJuridica}"

    --- 4. SEU PARECER ---
    Retorne APENAS neste formato Markdown:

    ## 🚦 VEREDITO: [VIÁVEL / RISCO MÉDIO / INVIÁVEL]
    
    ### 🔎 PONTOS DE ATENÇÃO (Onde o INSS nega):
    - [Item 1]
    - [Item 2]

    ### ✅ PONTOS FORTES:
    - [Item 1]

    ### 📝 PLANO DE AÇÃO (Antes de ajuizar):
    1. [Ação 1]
    2. [Ação 2]
  `;

  const messages = [
    { role: 'system', content: 'Você é um assistente jurídico especializado em direito previdenciário rural.' },
    { role: 'user', content: prompt },
  ];

  return await callDeepSeek(messages, 0.3);
}

/**
 * Preenche um modelo de documento com dados do cliente e do escritório
 * (usado em DocumentsPage)
 */
export async function gerarDocumentoIA(cliente: any, officeProfile: any, rawTemplate: string): Promise<string> {
  const prompt = `
    Aja como um Assistente Jurídico Expert.
    
    CONTEXTO: Você está gerando um documento para um sistema multiusuário.
    Você deve cruzar os dados do CLIENTE com os dados do ADVOGADO/ESCRITÓRIO para preencher o modelo.
    
    1. DADOS DO CLIENTE (CONTRATANTE):
    Nome: ${cliente.nome}
    CPF: ${cliente.cpf}
    Profissão: ${cliente.profissao || "Não informada"}
    Estado Civil: ${cliente.estado_civil || "Não informado"}
    Endereço: ${cliente.endereco || "Endereço não cadastrado"}
    RG: ${cliente.rg || "Não informado"}
    
    2. DADOS DO ESCRITÓRIO/ADVOGADO (CONTRATADA):
    Nome do Advogado(s): ${officeProfile.nome_advogado}
    OAB: ${officeProfile.oab}
    Endereço Profissional: ${officeProfile.endereco_profissional}
    Cidade/UF: ${officeProfile.cidade_uf}
    
    3. MODELO BRUTO:
    """
    ${rawTemplate}
    """
    
    TAREFA: 
    Substitua TODOS os placeholders do modelo pelos dados reais acima.
    Formate o resultado em HTML SIMPLES (usando <b> para negrito em nomes/dados).
    Justifique o texto. Centralize títulos.
    
    Retorne APENAS o HTML do conteúdo.
  `;

  const messages = [
    { role: 'system', content: 'Você é um assistente especializado em gerar documentos jurídicos.' },
    { role: 'user', content: prompt },
  ];

  return await callDeepSeek(messages, 0.5);
}

/**
 * Gera um resumo executivo do caso com base nos dados da entrevista
 * (usado em MasterReportPage)
 */
export async function gerarResumoIA(cliente: any, interview: any): Promise<string> {
  const prompt = `
    Atue como um advogado sênior previdenciarista.
    Leia os dados fáticos do cliente rural e crie um "Resumo Executivo do Caso" em 1 parágrafo (máx 5 linhas).
    O objetivo é que outro advogado leia e entenda a história de vida rural da pessoa instantaneamente.
    
    Cliente: ${cliente.nome}, Nascido em: ${cliente.data_nascimento}.
    Propriedade: ${interview.dados_rurais?.nome_imovel} (${interview.dados_rurais?.area_total} Ha). Condição: ${interview.dados_rurais?.condicao_posse}.
    Culturas: ${interview.dados_rurais?.culturas}. Destino: ${interview.dados_rurais?.destinacao}.
    História contada: ${interview.historico_locais}
    
    Gere apenas o texto do resumo, sem introduções ou saudações. Tom profissional e direto.
  `;

  const messages = [
    { role: 'system', content: 'Você é um advogado especialista em direito previdenciário rural.' },
    { role: 'user', content: prompt },
  ];

  return await callDeepSeek(messages, 0.4);
}

/**
 * Função de fallback que tenta gerar com diferentes parâmetros
 * (usado em DocumentsPage para compatibilidade)
 */
export async function generateWithFallback(prompt: string): Promise<string> {
  const messages = [
    { role: 'system', content: 'Você é um assistente jurídico.' },
    { role: 'user', content: prompt },
  ];
  return await callDeepSeek(messages, 0.7);
}