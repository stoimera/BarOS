import { supabase } from './supabase'
import { PostgrestError } from '@supabase/supabase-js'

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError: PostgrestError | null = null
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Generic CRUD operations
export async function fetchAll<T = any>(
  table: string,
  select: string = '*'
): Promise<T[]> {
  const { data, error } = await supabase.from(table).select(select)
  
  if (error) {
    throw new DatabaseError(
      `Failed to fetch from ${table}: ${error.message}`,
      error
    )
  }
  
  return (data as T[]) || []
}

export async function fetchById<T = any>(
  table: string,
  id: string | number,
  select: string = '*'
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('id', id)
    .single()
  
  if (error) {
    throw new DatabaseError(
      `Failed to fetch ${table} with id ${id}: ${error.message}`,
      error
    )
  }
  
  if (!data) {
    throw new DatabaseError(`No ${table} found with id ${id}`)
  }
  
  return data as T
}

export async function create<T>(
  table: string,
  data: Partial<T>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single()
  
  if (error) {
    throw new DatabaseError(
      `Failed to create ${table}: ${error.message}`,
      error
    )
  }
  
  if (!result) {
    throw new DatabaseError(`Failed to create ${table}: No data returned`)
  }
  
  return result
}

export async function update<T>(
  table: string,
  id: string | number,
  data: Partial<T>
): Promise<T> {
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    throw new DatabaseError(
      `Failed to update ${table} with id ${id}: ${error.message}`,
      error
    )
  }
  
  if (!result) {
    throw new DatabaseError(`No ${table} found with id ${id}`)
  }
  
  return result
}

export async function remove(
  table: string,
  id: string | number
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
  
  if (error) {
    throw new DatabaseError(
      `Failed to delete ${table} with id ${id}: ${error.message}`,
      error
    )
  }
}

// User-specific operations
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function updateUserProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()
  
  if (error) {
    throw new DatabaseError(
      `Failed to update user profile: ${error.message}`,
      error
    )
  }
  
  if (!data) {
    throw new DatabaseError('No user profile found')
  }
  
  return data
} 