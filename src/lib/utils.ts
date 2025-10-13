import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string or Date object to PT-BR format (DD/MM/YYYY)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return "—";
    
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return "—";
  }
}

/**
 * Format a date string or Date object to time format (HH:MM)
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return "—";
    
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "—";
  }
}

/**
 * Format a date string or Date object to full PT-BR format (DD/MM/YYYY HH:MM)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    
    if (isNaN(d.getTime())) return "—";
    
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "—";
  }
}
