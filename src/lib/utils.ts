import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function to merge Tailwind CSS classes with conflict resolution
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency amounts with Euro symbol and proper decimal places
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '€0.00'
  }
  
  // Use toFixed(2) for precise 2 decimal places without rounding issues
  // Prevents floating point precision errors
  const fixedAmount = Number(amount).toFixed(2)
  return `€${fixedAmount}`
}
