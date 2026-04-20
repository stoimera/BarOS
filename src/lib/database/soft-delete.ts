/**
 * Soft Delete Utilities
 * 
 * Provides functions for soft deleting records instead of hard deletion
 */

import { createServiceRoleClient } from '@/utils/supabase/service-role'

/**
 * Soft delete a record by setting deleted_at timestamp
 */
export async function softDelete(
  table: string,
  id: string
): Promise<boolean> {
  const supabase = await createServiceRoleClient()
  
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error(`Failed to soft delete ${table} with id ${id}:`, error);
    return false;
  }

  return true;
}

/**
 * Restore a soft-deleted record
 */
export async function restoreRecord(
  table: string,
  id: string
): Promise<boolean> {
  const supabase = await createServiceRoleClient()
  
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) {
    console.error(`Failed to restore ${table} with id ${id}:`, error);
    return false;
  }

  return true;
}

/**
 * Permanently delete old soft-deleted records
 */
export async function purgeSoftDeleted(
  table: string,
  olderThanDays: number = 90
): Promise<number> {
  const supabase = await createServiceRoleClient()
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { data, error } = await supabase
    .from(table)
    .delete()
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error(`Failed to purge soft-deleted records from ${table}:`, error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Query builder helper to exclude soft-deleted records
 */
export function excludeSoftDeleted(query: any): any {
  return query.is('deleted_at', null);
}

/**
 * Query builder helper to include only soft-deleted records
 */
export function onlySoftDeleted(query: any): any {
  return query.not('deleted_at', 'is', null);
}

