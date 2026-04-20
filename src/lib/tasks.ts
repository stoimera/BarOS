import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { createClient } from '@/utils/supabase/client';

// Helper function to check user authentication and role
async function checkUserAuth(): Promise<{ user: any; profile: any; role: string | null }> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated. Please log in again.')
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    throw new Error('Unable to fetch user profile. Please contact support.')
  }

  if (!profile) {
    throw new Error('User profile not found. Please contact support.')
  }

  return { user, profile, role: profile.role }
}

// Fetch all tasks, with optional filters
export async function getTasks({ due_date, status, priority }: { due_date?: string; status?: TaskStatus; priority?: TaskPriority } = {}): Promise<Task[]> {
  const supabase = await createClient()
  
  // Check user authentication and role
  const { role } = await checkUserAuth()
  
  if (!role || !['staff', 'admin'].includes(role)) {
    throw new Error(`Access denied. Your role (${role}) does not have permission to view tasks.`)
  }

  let query = supabase.from('tasks').select('*');
  if (due_date) query = query.eq('due_date', due_date);
  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  const { data, error } = await query.order('due_date', { ascending: true });
  if (error) throw error;
  return data as Task[];
}

// Add a new task
export async function addTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const supabase = await createClient()
  
  // Check user authentication and role
  const { user, role } = await checkUserAuth()
  
  if (!role || !['staff', 'admin'].includes(role)) {
    throw new Error(`Access denied. Your role (${role}) does not have permission to create tasks.`)
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...task, created_by: user.id }])
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

// Update an existing task
export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> {
  const supabase = await createClient()
  
  // Check user authentication and role
  const { role } = await checkUserAuth()
  
  if (!role || !['staff', 'admin'].includes(role)) {
    throw new Error(`Access denied. Your role (${role}) does not have permission to update tasks.`)
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

// Delete a task
export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient()
  
  // Check user authentication and role
  const { role } = await checkUserAuth()
  
  if (!role || !['staff', 'admin'].includes(role)) {
    throw new Error(`Access denied. Your role (${role}) does not have permission to delete tasks.`)
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
} 