import { format, isAfter, isBefore, addDays } from 'date-fns'

// Format date in British format (dd/MM/yyyy)
export function formatDateGB(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy');
}

// Format date and time in British format (dd/MM/yyyy HH:mm)
export function formatDateTimeGB(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm');
}

// Format date for HTML date input field (yyyy-MM-dd)
export function formatDateForInput(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

// Format time for HTML time input field (HH:mm)
export function formatTimeForInput(time: Date | string): string {
  if (!time) return '';
  const t = typeof time === 'string' ? new Date(`2000-01-01T${time}`) : time;
  return format(t, 'HH:mm');
}

// Check if a date is overdue (past due date)
export function isOverdue(date: string): boolean {
  if (!date) return false;
  const dueDate = new Date(date);
  const today = new Date();
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return isBefore(dueDate, today);
}

// Check if a date is due within the next 3 days
export function isDueSoon(date: string): boolean {
  if (!date) return false;
  const dueDate = new Date(date);
  const today = new Date();
  const threeDaysFromNow = addDays(today, 3);
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  threeDaysFromNow.setHours(0, 0, 0, 0);
  
  return isAfter(dueDate, today) && isBefore(dueDate, threeDaysFromNow);
} 