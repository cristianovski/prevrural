// src/services/financeService.ts
import { supabase } from '../lib/supabase';
import {
  FinancialResponsibility,
  FinancialResponsibilityInput,
  FinancialInstallment,
  FinancialInstallmentInput,
  FinancialExpense,
  FinancialExpenseInput
} from '../types/finance';

// ===== Responsabilidades =====
export async function fetchResponsibilities(clientId?: number) {
  let query = supabase.from('financial_responsibilities').select('*').order('data_inicio', { ascending: false });
  if (clientId) query = query.eq('client_id', clientId);
  const { data, error } = await query;
  if (error) throw error;
  return data as FinancialResponsibility[];
}

export async function createResponsibility(input: FinancialResponsibilityInput) {
  const { data, error } = await supabase
    .from('financial_responsibilities')
    .insert([input])
    .select()
    .single();
  if (error) throw error;
  return data as FinancialResponsibility;
}

export async function updateResponsibility(id: number, input: Partial<FinancialResponsibilityInput>) {
  const { data, error } = await supabase
    .from('financial_responsibilities')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FinancialResponsibility;
}

export async function deleteResponsibility(id: number) {
  const { error } = await supabase.from('financial_responsibilities').delete().eq('id', id);
  if (error) throw error;
}

// ===== Parcelas =====
export async function fetchInstallments(responsibilityId?: number, status?: string) {
  let query = supabase.from('financial_installments')
    .select(`
      *,
      comprovante:client_documents(*)
    `)
    .order('data_vencimento', { ascending: true });
  if (responsibilityId) query = query.eq('responsibility_id', responsibilityId);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data as (FinancialInstallment & { comprovante: any })[];
}

export async function createInstallment(input: FinancialInstallmentInput) {
  const { data, error } = await supabase
    .from('financial_installments')
    .insert([input])
    .select()
    .single();
  if (error) throw error;
  return data as FinancialInstallment;
}

export async function updateInstallment(id: number, input: Partial<FinancialInstallmentInput>) {
  const { data, error } = await supabase
    .from('financial_installments')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FinancialInstallment;
}

export async function deleteInstallment(id: number) {
  const { error } = await supabase.from('financial_installments').delete().eq('id', id);
  if (error) throw error;
}

export async function payInstallment(
  id: number,
  dataPagamento: string,
  valorPago: number,
  comprovanteId?: string
) {
  const updates: any = {
    status: 'pago',
    data_pagamento: dataPagamento,
    valor_pago: valorPago
  };
  if (comprovanteId) updates.comprovante_id = comprovanteId;

  const { data, error } = await supabase
    .from('financial_installments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FinancialInstallment;
}

// ===== Despesas =====
export async function fetchExpenses(status?: string, categoria?: string) {
  let query = supabase.from('financial_expenses').select('*').order('data_vencimento', { ascending: true });
  if (status) query = query.eq('status', status);
  if (categoria) query = query.eq('categoria', categoria);
  const { data, error } = await query;
  if (error) throw error;
  return data as FinancialExpense[];
}

export async function createExpense(input: FinancialExpenseInput) {
  const { data, error } = await supabase
    .from('financial_expenses')
    .insert([input])
    .select()
    .single();
  if (error) throw error;
  return data as FinancialExpense;
}

export async function updateExpense(id: number, input: Partial<FinancialExpenseInput>) {
  const { data, error } = await supabase
    .from('financial_expenses')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FinancialExpense;
}

export async function deleteExpense(id: number) {
  const { error } = await supabase.from('financial_expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function payExpense(id: number, dataPagamento: string) {
  const { data, error } = await supabase
    .from('financial_expenses')
    .update({ status: 'pago', data_pagamento: dataPagamento })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FinancialExpense;
}