// ARQUIVO: src/lib/calculator.ts

// --- 1. INTERFACES (O que o erro dizia que faltava) ---
export interface RuralClient {
    nome: string;
    cpf: string;
    nascimento: string;
    genero: string;
    tipoSegurado: string;
    possuiTerra: boolean;
    tamanhoTerra?: number;
    documentos: string[];
  }
  
  export interface AnaliseResult {
    status: "APROVADO" | "NEGADO" | "ANALISE";
    motivo: string;
    idadeAtual: number;
    idadeFaltante: number;
    carenciaCumprida: boolean;
    mensagens: string[];
  }
  
  // --- 2. FUNÇÕES ---
  
  export function calcularIdade(dataNascimento: string): number {
    if (!dataNascimento) return 0;
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade;
  }
  
  export function analisarDireitoRural(cliente: RuralClient): AnaliseResult {
    const idade = calcularIdade(cliente.nascimento);
    const msgs: string[] = [];
    let status: "APROVADO" | "NEGADO" | "ANALISE" = "ANALISE";
  
    // Regras Básicas
    const genero = cliente.genero || "masculino";
    const idadeMinima = genero === "masculino" ? 60 : 55;
    const idadeFaltante = idadeMinima - idade;
  
    // 1. Idade
    if (idade < idadeMinima) {
      status = "NEGADO";
      msgs.push(`⛔ Idade insuficiente: ${idade} anos (Exige ${idadeMinima}).`);
    } else {
      msgs.push(`✅ Idade OK (${idade} anos).`);
    }
  
    // 2. Terra
    if (cliente.possuiTerra) {
      if (cliente.tamanhoTerra && cliente.tamanhoTerra > 4) {
        status = "NEGADO";
        msgs.push("⛔ Terra maior que 4 módulos fiscais.");
      } else {
        msgs.push("✅ Terra compatível (economia familiar).");
      }
    }
  
    // 3. Documentos
    if (!cliente.documentos || cliente.documentos.length === 0) {
      status = "NEGADO";
      msgs.push("⛔ Nenhuma prova documental apresentada.");
    } else {
      msgs.push(`✅ ${cliente.documentos.length} documentos listados.`);
    }
  
    if (status !== "NEGADO") status = "APROVADO";
  
    return {
      status,
      motivo: status === "APROVADO" ? "Aprovado" : "Reprovado",
      idadeAtual: idade,
      idadeFaltante: idadeFaltante > 0 ? idadeFaltante : 0,
      carenciaCumprida: true,
      mensagens: msgs
    };
  }