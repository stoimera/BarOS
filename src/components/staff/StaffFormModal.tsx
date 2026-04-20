import { useState, useEffect } from "react"
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Staff, StaffRole, StaffPermission } from "@/types/common"
import { getRolePermissions } from "@/lib/staff"
import { toast } from "sonner"

interface StaffFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: Staff
  onSave: (staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
}

const roleOptions = [
  { value: StaffRole.OWNER, label: 'Admin' },
  { value: StaffRole.MANAGER, label: 'Manager' },
  { value: StaffRole.BARTENDER, label: 'Bartender' },
  { value: StaffRole.SERVER, label: 'Server' },
  { value: StaffRole.HOST, label: 'Host' },
  { value: StaffRole.SECURITY, label: 'Security' },
  { value: StaffRole.CLEANER, label: 'Cleaner' },
]

const permissionLabels: Record<StaffPermission, string> = {
  [StaffPermission.VIEW_CUSTOMERS]: 'View Customers',
  [StaffPermission.EDIT_CUSTOMERS]: 'Edit Customers',
  [StaffPermission.VIEW_EVENTS]: 'View Events',
  [StaffPermission.MANAGE_EVENTS]: 'Manage Events',
  [StaffPermission.VIEW_BOOKINGS]: 'View Bookings',
  [StaffPermission.MANAGE_BOOKINGS]: 'Manage Bookings',
  [StaffPermission.VIEW_INVENTORY]: 'View Inventory',
  [StaffPermission.MANAGE_INVENTORY]: 'Manage Inventory',
  [StaffPermission.VIEW_LOYALTY]: 'View Loyalty',
  [StaffPermission.MANAGE_LOYALTY]: 'Manage Loyalty',
  [StaffPermission.VIEW_ANALYTICS]: 'View Analytics',
  [StaffPermission.MANAGE_STAFF]: 'Manage Staff',
  [StaffPermission.VIEW_FINANCIAL]: 'View Financial',
  [StaffPermission.MANAGE_FINANCIAL]: 'Manage Financial',
}

export function StaffFormModal({ open, onOpenChange, initialValues, onSave }: StaffFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: StaffRole.SERVER,
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    is_active: true,
    permissions: [] as StaffPermission[],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialValues) {
      setFormData({
        name: initialValues.name,
        email: initialValues.email,
        role: initialValues.role,
        position: initialValues.position,
        hire_date: new Date(initialValues.hire_date).toISOString().split('T')[0],
        is_active: initialValues.is_active,
        permissions: initialValues.permissions || [],
      })
    } else {
      setFormData({
        name: '',
        email: '',
        role: StaffRole.SERVER,
        position: '',
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true,
        permissions: [],
      })
    }
  }, [initialValues, open])

  const handleRoleChange = (role: StaffRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: getRolePermissions(role)
    }))
  }

  const handlePermissionToggle = (permission: StaffPermission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.position) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      await onSave({
        user_id: initialValues?.user_id || '',
        name: formData.name,
        email: formData.email,
        role: formData.role,
        position: formData.position,
        hire_date: new Date(formData.hire_date),
        is_active: formData.is_active,
        permissions: formData.permissions,
      })
      
      toast.success(initialValues ? "Staff updated successfully!" : "Staff added successfully!")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to save staff", { description: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormModal
      open={open}
      onClose={() => onOpenChange(false)}
      onSubmit={handleSubmit}
      title={initialValues ? 'Edit Staff Member' : 'Add New Staff Member'}
      loading={loading}
      submitText={initialValues ? "Update Staff" : "Add Staff"}
      size="xl"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Name"
            name="name"
            type="text"
            value={formData.name}
            onChange={(value: string) => setFormData(prev => ({ ...prev, name: value }))}
            placeholder="Enter full name"
            required
            disabled={loading}
          />
          
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={(value: string) => setFormData(prev => ({ ...prev, email: value }))}
            placeholder="Enter email address"
            required
            disabled={loading}
          />
          
          <FormField
            label="Role"
            name="role"
            type="select"
            value={formData.role}
            onChange={(value: string) => handleRoleChange(value as StaffRole)}
            options={roleOptions}
            required
            disabled={loading}
          />
          
          <FormField
            label="Position"
            name="position"
            type="text"
            value={formData.position}
            onChange={(value: string) => setFormData(prev => ({ ...prev, position: value }))}
            placeholder="Enter position title"
            required
            disabled={loading}
          />
          
          <FormField
            label="Hire Date"
            name="hire_date"
            type="date"
            value={formData.hire_date}
            onChange={(value: string) => setFormData(prev => ({ ...prev, hire_date: value }))}
            required
            disabled={loading}
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
                disabled={loading}
              />
              <label htmlFor="is_active" className="text-sm font-normal">
                Active staff member
              </label>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Permissions</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(permissionLabels).map(([permission, label]) => (
              <div key={permission} className="flex items-center space-x-2">
                <Checkbox
                  id={permission}
                  checked={formData.permissions.includes(permission as StaffPermission)}
                  onCheckedChange={() => handlePermissionToggle(permission as StaffPermission)}
                  disabled={loading}
                />
                <label htmlFor={permission} className="text-sm font-normal">
                  {label}
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.permissions.map((permission) => (
              <Badge key={permission} variant="secondary" className="text-xs">
                {permissionLabels[permission]}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </FormModal>
  )
} 