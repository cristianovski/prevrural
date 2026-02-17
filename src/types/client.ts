// src/types/client.ts

export type ClientStatus = 'A Iniciar' | 'Em Andamento' | 'Finalizado' | 'Suspenso';

export interface ClientCivilData {
  id?: number;
  user_id?: string;
  nome: string;
  sexo: 'Masculino' | 'Feminino';
  analfabeto: boolean;
  cpf: string;
  data_nascimento: string;
  naturalidade: string;
  nacionalidade: string;
  profissao: string;
  capacidade_civil: 'Plena' | 'Relativamente Incapaz' | 'Absolutamente Incapaz';

  // Representante Legal (Opcional)
  rep_nome?: string;
  rep_cpf?: string;
  rep_rg?: string;
  rep_parentesco?: string;
  rep_endereco?: string;
  rep_telefone?: string;

  // Documentos
  rg: string;
  orgao_expedidor: string;
  data_expedicao: string;
  nit: string;
  ctps: string;
  senha_meu_inss: string;

  // Filiação
  nome_mae: string;
  nome_pai: string;
  estado_civil: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';
  nome_conjuge?: string;
  cpf_conjuge?: string;

  // Endereço e Contato
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  telefone: string;
  telefone_recado?: string;

  // Checklists
  resumo_cnis?: string;
  historico_beneficios?: string;
  possui_cnpj: boolean;
  detalhes_cnpj?: string;
  possui_outra_renda: boolean;
  detalhes_renda?: string;
  endereco_divergente: boolean;
  justificativa_endereco?: string;

  status_processo: ClientStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ClientRuralData {
  nome_imovel: string;
  municipio_uf: string;
  itr_nirf: string;
  area_total: string;
  condicao_posse: 'proprietario' | 'posseiro' | 'arrendatario' | 'parceiro' | 'comodatario' | 'assentado';
  outorgante_nome?: string; // Se não for proprietário
  outorgante_cpf?: string;
  culturas: string;
  locais_venda: string;
  tem_empregados: 'sim' | 'nao';
  tempo_empregados?: string;
  grupo_familiar: string; // Quem ajuda
}

export interface ClientTimelineItem {
  id: string;
  year: string;
  type: string;
  fileUrl?: string;
  issueDate?: string;
}

export interface ClientInterviewData {
  id?: number;
  client_id: number;
  historico_locais: string;
  timeline_json: ClientTimelineItem[];
  dados_rurais: ClientRuralData;
  analise_periodos?: any[]; // Refinar depois
  analise_params?: any;
  updated_at?: string;
}
