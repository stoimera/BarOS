import type { OperationsPermission } from '@/types/operations'

type UserRole = 'admin' | 'staff' | 'customer'

/**
 * Track 5.1 — Human-readable matrix for audits, admin UI, and API `requirePermission` alignment.
 */
export const OPERATIONS_PERMISSION_MATRIX: ReadonlyArray<{
  permission: OperationsPermission
  description: string
}> = [
  { permission: 'orders.read', description: 'View orders, lists, and order events' },
  { permission: 'orders.write', description: 'Create and mutate orders, tabs, items, tips, splits' },
  { permission: 'orders.settle', description: 'Void, close, and payment settlement transitions' },
  { permission: 'inventory.read', description: 'Read inventory, stocktakes, waste, variance' },
  { permission: 'inventory.write', description: 'Create stocktakes, waste, stock adjustments' },
  { permission: 'procurement.read', description: 'Read suppliers and purchase orders' },
  { permission: 'procurement.write', description: 'Mutate suppliers, POs, receiving' },
  { permission: 'staff_time.read', description: 'Read attendance and timesheets' },
  { permission: 'staff_time.write', description: 'Clock events and timesheet submissions' },
  { permission: 'event_commerce.read', description: 'Read ticket tiers, sales, promos, check-in' },
  { permission: 'event_commerce.write', description: 'Sell, refund, mutate promos and check-in' },
  { permission: 'locations.read', description: 'Read location records' },
  { permission: 'locations.write', description: 'Manage locations and assignments' },
  { permission: 'compliance.read', description: 'Read consent ledger and compliance exports' },
  { permission: 'compliance.write', description: 'Append consent events and run retention audit entries' },
] as const

const rolePermissions: Record<UserRole, OperationsPermission[]> = {
  admin: [
    'orders.read',
    'orders.write',
    'orders.settle',
    'inventory.read',
    'inventory.write',
    'procurement.read',
    'procurement.write',
    'staff_time.read',
    'staff_time.write',
    'event_commerce.read',
    'event_commerce.write',
    'locations.read',
    'locations.write',
    'compliance.read',
    'compliance.write',
  ],
  staff: [
    'orders.read',
    'orders.write',
    'orders.settle',
    'inventory.read',
    'inventory.write',
    'procurement.read',
    'procurement.write',
    'staff_time.read',
    'staff_time.write',
    'event_commerce.read',
    'event_commerce.write',
    'locations.read',
    'compliance.read',
    'compliance.write',
  ],
  customer: [],
}

export function hasPermission(role: string, permission?: OperationsPermission): boolean {
  if (!permission) return true
  const typedRole: UserRole = role === 'admin' || role === 'staff' ? role : 'customer'
  return rolePermissions[typedRole].includes(permission)
}

export function listPermissionsForRole(role: string): OperationsPermission[] {
  const typedRole: UserRole = role === 'admin' || role === 'staff' ? role : 'customer'
  return [...rolePermissions[typedRole]]
}

/** True if the role has at least one of the listed permissions (Track 5.1). */
export function hasAnyPermission(role: string, permissions: OperationsPermission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

/** True if the role has every listed permission (Track 5.1). */
export function hasAllPermissions(role: string, permissions: OperationsPermission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}
