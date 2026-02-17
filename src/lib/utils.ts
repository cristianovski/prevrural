import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Retorna a data atual no formato YYYY-MM-DD respeitando o fuso horário local.
 * Corrige o bug do toISOString() que retornava data em UTC (dia anterior/posterior).
 */
export function getLocalDateISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}