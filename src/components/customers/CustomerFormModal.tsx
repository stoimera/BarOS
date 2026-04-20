import { useState, useEffect } from "react"
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Customer } from "@/types/customer"

const TAG_OPTIONS = ["VIP", "Regular", "Birthday", "Student", "Corporate"]

interface CustomerFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Customer>) => Promise<void>
  initialValues?: Partial<Customer> | null
}

export function CustomerFormModal({ open, onClose, onSave, initialValues }: CustomerFormModalProps) {
  const [form, setForm] = useState<Partial<Omit<Customer, 'birthday'> & { birthday?: string }>>({
    name: "",
    email: "",
    phone: "",
    birthday: undefined,
    tags: [],
    notes: ""
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialValues) {
      setForm({
        ...initialValues,
        birthday: initialValues.birthday
          ? typeof initialValues.birthday === 'string'
            ? (initialValues.birthday as string).slice(0, 10)
            : undefined
          : undefined,
        tags: initialValues.tags || []
      })
    } else {
      setForm({ name: "", email: "", phone: "", birthday: undefined, tags: [], notes: "" })
    }
  }, [initialValues, open])

  const handleChange = (field: keyof Customer, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleTagToggle = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...(prev.tags || []), tag]
    }))
  }

  const handleSubmit = async (formData: FormData) => {
    setSaving(true)
    try {
      // Extract data from FormData and combine with current form state
      const dataToSave = {
        ...form,
        name: formData.get('name') as string || form.name || '',
        email: formData.get('email') as string || form.email || '',
        phone: formData.get('phone') as string || form.phone || '',
        birthday: form.birthday ? new Date(form.birthday) : undefined,
        tags: form.tags || [],
        notes: formData.get('notes') as string || form.notes || ''
      }
      await onSave(dataToSave)
      onClose()
    } catch {
      // FormModal handles API errors through parent-level toasts.
    }
    setSaving(false)
  }

  const formFields = [
    {
      label: "Name",
      name: "name",
      type: "text" as const,
      required: true,
      value: form.name || "",
      onChange: (value: string) => handleChange("name", value)
    },
    {
      label: "Email",
      name: "email",
      type: "email" as const,
      value: form.email || "",
      onChange: (value: string) => handleChange("email", value)
    },
    {
      label: "Phone",
      name: "phone",
      type: "text" as const,
      value: form.phone || "",
      onChange: (value: string) => handleChange("phone", value)
    },
    {
      label: "Birthday",
      name: "birthday",
      type: "date" as const,
      value: typeof form.birthday === 'string' ? form.birthday : "",
      onChange: (value: string) => handleChange("birthday", value)
    }
  ]

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialValues ? "Edit Customer" : "Add Customer"}
      description={initialValues ? "Update customer details." : "Enter new customer information."}
      loading={saving}
      submitText={initialValues ? "Update" : "Add"}
    >
      <div className="space-y-4">
        {formFields.map((field) => (
          <FormField
            key={field.name}
            label={field.label}
            name={field.name}
            type={field.type}
            value={field.value}
            onChange={field.onChange}
            required={field.required}
            disabled={saving}
          />
        ))}
        
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map(tag => (
              <button
                type="button"
                key={tag}
                className={form.tags?.includes(tag) ? "ring-2 ring-primary" : ""}
                onClick={() => handleTagToggle(tag)}
                disabled={saving}
              >
                <Badge variant={form.tags?.includes(tag) ? "default" : "secondary"} className="text-xs sm:text-sm">{tag}</Badge>
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Textarea
            name="notes"
            value={form.notes || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("notes", e.target.value)}
            rows={3}
            disabled={saving}
            className="w-full"
          />
        </div>
      </div>
    </FormModal>
  )
} 