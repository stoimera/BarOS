/**
 * Audit Logging System
 *
 * Logs all important user actions for security and compliance
 */

import { createServiceRoleClient } from '@/utils/supabase/service-role'
import { createLogger } from '@/lib/logger'

const auditLogger = createLogger('security.audit')
import type { NextRequest } from 'next/server'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'view'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'grant_permission'
  | 'revoke_permission'

export type ResourceType =
  | 'customer'
  | 'booking'
  | 'event'
  | 'inventory'
  | 'staff'
  | 'user'
  | 'reward'
  | 'campaign'
  | 'task'
  | 'visit'
  | 'menu_item'
  | 'organization'
  | 'compliance_retention_run'

export interface AuditLogEntry {
  user_id?: string
  organization_id?: string
  action: AuditAction
  resource_type: ResourceType
  resource_id?: string
  changes?: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  }
  metadata?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

/**
 * Get client information from request
 */
export function getClientInfo(req: NextRequest | Request): {
  ip_address?: string
  user_agent?: string
} {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || undefined
  const userAgent = req.headers.get('user-agent') || undefined

  return {
    ip_address: ip,
    user_agent: userAgent,
  }
}

/**
 * Create an audit log entry
 */
export async function auditLog(entry: AuditLogEntry, req?: NextRequest | Request): Promise<void> {
  try {
    const supabase = await createServiceRoleClient()

    // Get client info if request is provided
    const clientInfo = req ? getClientInfo(req) : {}

    const recordId = entry.resource_id
    const { error } = await supabase.from('audit_logs').insert({
      user_id: entry.user_id,
      organization_id: entry.organization_id,
      action: entry.action,
      resource_type: entry.resource_type,
      record_id: recordId ?? null,
      table_name: entry.resource_type,
      changes: entry.changes || {},
      metadata: entry.metadata || {},
      old_values: entry.changes?.before ?? null,
      new_values: entry.changes?.after ?? null,
      ip_address: clientInfo.ip_address,
      user_agent: clientInfo.user_agent,
      created_at: new Date().toISOString(),
    })

    if (error) {
      // Don't throw - audit logging should not break the application
      auditLogger.error('audit_insert_failed', { code: error.code, message: error.message })
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    auditLogger.error('audit_unexpected', { errorMessage: err.message })
  }
}

/**
 * Helper function to create audit log for create actions
 */
export async function auditCreate(
  resourceType: ResourceType,
  resourceId: string,
  data: Record<string, unknown>,
  userId?: string,
  organizationId?: string,
  req?: NextRequest | Request
): Promise<void> {
  await auditLog(
    {
      user_id: userId,
      organization_id: organizationId,
      action: 'create',
      resource_type: resourceType,
      resource_id: resourceId,
      changes: { after: data },
    },
    req
  )
}

/**
 * Helper function to create audit log for update actions
 */
export async function auditUpdate(
  resourceType: ResourceType,
  resourceId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  userId?: string,
  organizationId?: string,
  req?: NextRequest | Request
): Promise<void> {
  await auditLog(
    {
      user_id: userId,
      organization_id: organizationId,
      action: 'update',
      resource_type: resourceType,
      resource_id: resourceId,
      changes: { before, after },
    },
    req
  )
}

/**
 * Helper function to create audit log for delete actions
 */
export async function auditDelete(
  resourceType: ResourceType,
  resourceId: string,
  data: Record<string, unknown>,
  userId?: string,
  organizationId?: string,
  req?: NextRequest | Request
): Promise<void> {
  await auditLog(
    {
      user_id: userId,
      organization_id: organizationId,
      action: 'delete',
      resource_type: resourceType,
      resource_id: resourceId,
      changes: { before: data },
    },
    req
  )
}

/**
 * Helper function to create audit log for view actions (sensitive data)
 */
export async function auditView(
  resourceType: ResourceType,
  resourceId: string,
  userId?: string,
  organizationId?: string,
  req?: NextRequest | Request
): Promise<void> {
  await auditLog(
    {
      user_id: userId,
      organization_id: organizationId,
      action: 'view',
      resource_type: resourceType,
      resource_id: resourceId,
    },
    req
  )
}
