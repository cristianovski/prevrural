// src/types/finance.ts
import { ClientDocument } from './index';

export type FinancialResponsibilityType = 'parcelado_fixo' | 'exito' | 'ambos';
export type InstallmentStatus = 'pendente' | 'pago' | 'atrasado';
export type ExpenseStatus = 'pendente' | 'pago';

export interface FinancialResponsibility {
  id: number;
  client_id: number;
  descricao: string;
  valor_total: number;
  tipo: FinancialResponsibilityType;
  numero_parcelas?: number | null;
  data_inicio: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialInstallment {
  id: number;
  responsibility_id: number;
  numero_parcela?: number | null;
  valor_previsto: number;
  data_vencimento: string;
  status: InstallmentStatus;
  data_pagamento?: string | null;
  valor_pago?: number | null;
  comprovante_id?: string | null;
  comprovante?: ClientDocument;
  created_at: string;
  updated_at: string;
}

export interface FinancialExpense {
  id: number;
  descricao: string;
  categoria: string;
  valor: number;
  data_vencimento: string;
  status: ExpenseStatus;
  data_pagamento?: string | null;
  comprovante_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type FinancialResponsibilityInput = Omit<FinancialResponsibility, 'id' | 'created_at' | 'updated_at'>;
export type FinancialInstallmentInput = Omit<FinancialInstallment, 'id' | 'created_at' | 'updated_at' | 'comprovante'>;
export type FinancialExpenseInput = Omit<FinancialExpense, 'id' | 'created_at' | 'updated_at'>;