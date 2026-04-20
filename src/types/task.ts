export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskCategory = 'inventory' | 'staff' | 'events' | 'maintenance' | 'customer_service' | 'general';

export type Task = {
  id: string; // UUID
  title: string;
  description: string;
  due_date: string; // YYYY-MM-DD
  time?: string; // e.g. '10:00 AM'
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assigned_to?: string | null; // Staff member ID or null
  assigned_by?: string | null; // Who assigned the task
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null; // When task was completed
  related_event_id?: string;
}; 