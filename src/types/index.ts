// ARQUIVO: src/types/index.ts

export type BenefitStatus = 'A Iniciar' | 'Em Andamento' | 'Finalizado' | 'Suspenso';
export type DocumentCategory = 'Provas' | 'Pessoal' | 'Processual' | 'Diversos';
export type PeriodType = 'rural' | 'urbano' | 'beneficio' | 'lacuna';

export interface Client {
  id: number;
  user_id?: string;
  nome: string;
  cpf: string;
  rg?: string;
  data_nascimento?: string; // YYYY-MM-DD (Fuso Local)
  sexo?: 'Masculino' | 'Feminino';
  profissao?: string;
  nacionalidade?: string;
  naturalidade?: string;
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
  status_processo?: BenefitStatus | string;
  
  // Impedimentos
  possui_cnpj?: boolean;
  possui_outra_renda?: boolean;
  
  // Dados financeiros
  honorarios?: number;
  
  // Array legado (Apenas Leitura - Protegido contra 'any')
  personal_docs?: Record<string, unknown>[]; 
  
  // Sistema
  created_at: string;
  updated_at?: string;
}

export interface ClientDocument {
  id: string; // UUID
  client_id: number;
  title: string;
  category: DocumentCategory;
  file_url: string;
  reference_date?: string | null; // YYYY-MM-DD ou null
  description?: string;
  source_origin?: string;
  created_at?: string;
}

export interface Period {
  id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  type: PeriodType;
  description?: string;
  linked_document_id?: string; // FK opcional para ClientDocument
}

export interface Interview {
  id: number;
  client_id: number;
  
  // Anamnese Rural
  tamanho_terra?: string;
  condicao_posse?: string; // Arrendatário, Meeiro, Proprietário
  nome_imovel?: string;
  itr_nirf?: string; 
  culturas?: string;
  animais?: string;
  destino_producao?: string; // Subsistência, Comercialização
  empregados?: boolean;
  narrativa_fatica?: string;
  
  // Estruturas Complexas
  analise_periodos?: Period[]; // JSONB no banco: Linha do tempo
  ai_summary?: string;         // Resumo gerado pelo Gemini
  
  created_at?: string;
  updated_at?: string;
}

export interface Lawyer {
  id: number;
  nome: string;
  oab: string;
  cpf: string;
  estado_civil?: string; 
  created_at?: string;
}

export interface OfficeProfile {
  id: number;
  user_id: string;
  nome_escritorio: string;
  endereco_master: string;
  oab_principal: string;
  created_at?: string;
}

export interface LibraryThesis {
  id: number;
  title: string;
  content: string; // Pode ser HTML ou Texto Rico
  category: string; // FIX: Aceita qualquer categoria agora (incluindo 'Prompt Mestre')
  created_at?: string;
}

// --- DTOs (Data Transfer Objects) para tipagem de formulários ---

export type ClientFormData = Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'personal_docs'>;
export type RuralFormData = Omit<Interview, 'id' | 'client_id' | 'created_at' | 'updated_at' | 'analise_periodos' | 'ai_summary'>;