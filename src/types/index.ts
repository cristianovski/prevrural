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
  data_nascimento?: string;
  sexo?: 'Masculino' | 'Feminino';
  profissao?: string;
  nacionalidade?: string;
  naturalidade?: string;
  estado_civil?: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  bairro?: string;
  nit?: string;
  ctps?: string;
  senha_meu_inss?: string;
  status_processo?: BenefitStatus;
  possui_cnpj?: boolean;
  possui_outra_renda?: boolean;
  honorarios?: number;
  personal_docs?: Record<string, unknown>[];
  created_at: string;
  updated_at?: string;
}

export interface ClientDocument {
  id: string;
  client_id: number;
  title: string;
  category: DocumentCategory;
  file_url: string;
  reference_date?: string | null;
  description?: string;
  source_origin?: string;
  created_at?: string;
}

export interface Period {
  id: string;
  start_date: string;
  end_date: string;
  type: PeriodType;
  description?: string;
  linked_document_id?: string;
}

export interface Interview {
  id: number;
  client_id: number;
  tamanho_terra?: string;
  condicao_posse?: string;
  nome_imovel?: string;
  itr_nirf?: string;
  culturas?: string;
  animais?: string;
  destino_producao?: string;
  empregados?: boolean;
  narrativa_fatica?: string;
  analise_periodos?: Period[];
  ai_summary?: string;
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
  content: string;
  category: string;
  created_at?: string;
}

export type ClientFormData = Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'personal_docs'>;
export type RuralFormData = Omit<Interview, 'id' | 'client_id' | 'created_at' | 'updated_at' | 'analise_periodos' | 'ai_summary'>;
