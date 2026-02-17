// ARQUIVO: src/types/index.ts

// Tipos para status do processo
export type BenefitStatus = 'A Iniciar' | 'Em Andamento' | 'Finalizado' | 'Suspenso';

// Interface do Cliente (Atualizada)
export interface Client {
  id: number;
  user_id: string;
  nome: string;
  cpf: string;
  rg?: string;
  data_nascimento?: string;
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
  status_processo?: BenefitStatus;
  
  // Financeiro
  honorarios?: number;
  
  // Legado (opcional, pois migramos)
  personal_docs?: any[];
  
  // Sistema
  created_at: string;
  updated_at?: string;
}

// --- NOVA INTERFACE PARA O GED (Essencial para corrigir o erro 'any') ---
export interface ClientDocument {
  id: string; // UUID vindo do banco
  client_id: number;
  title: string;
  category: 'Provas' | 'Pessoal' | 'Processual' | 'Diversos';
  file_url: string;
  reference_date?: string | null;
  description?: string;
  source_origin?: string;
  created_at: string;
}

// Interface para Advogados
export interface Lawyer {
  id: number;
  nome: string;
  oab: string;
  cpf: string;
  nacionalidade: string;
  estado_civil: string;
}

// Interface para Teses
export interface Thesis {
  id: number;
  title: string;
  content: string;
  category: string;
  active: boolean;
}