// ARQUIVO: src/types/index.ts

export type BenefitStatus = 'A Iniciar' | 'Em Andamento' | 'Finalizado' | 'Suspenso';

export interface Client {
  id: number;
  user_id?: string;
  nome: string;
  cpf: string;
  rg?: string;
  data_nascimento?: string; // YYYY-MM-DD
  sexo?: 'Masculino' | 'Feminino';
  profissao?: string;
  nacionalidade?: string;
  estado_civil?: string;
  
  // Contato
  telefone?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  bairro?: string;
  
  // Previdenciário
  nit?: string;
  ctps?: string;
  senha_meu_inss?: string;
  status_processo?: BenefitStatus | string; // Allow string for flexibility
  
  // Dados financeiros
  honorarios?: number;
  
  // Array legado (apenas para leitura se necessário)
  personal_docs?: any[];
  
  // Sistema
  created_at: string;
  updated_at?: string;
}

export interface ClientDocument {
  id: string; // UUID
  client_id: number;
  title: string;
  category: 'Provas' | 'Pessoal' | 'Processual' | 'Diversos';
  file_url: string;
  reference_date?: string | null; // YYYY-MM-DD ou null
  description?: string;
  source_origin?: string;
  created_at?: string;
}

export interface Lawyer {
  id: number;
  nome: string;
  oab: string;
  cpf: string;
  nacionalidade: string;
  estado_civil: string;
}

export interface Thesis {
  id: number;
  title: string;
  content: string;
  category: string;
  active: boolean;
}
