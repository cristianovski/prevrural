import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

if (!API_KEY) {
  console.error("VITE_GOOGLE_API_KEY não encontrada no .env");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export async function gerarParecerIA(cliente: any, teseJuridica: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Erro na IA:", error);
    return `Erro técnico: ${error}`;
  }
}