"use client"

import { useState, useEffect } from "react"
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { Card, CardContent } from "@/components/ui/card"
import { InventoryItem, CreateInventoryItemData, UpdateInventoryItemData } from "@/types/inventory"
import { toast } from "sonner"

interface InventoryFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateInventoryItemData | UpdateInventoryItemData) => Promise<void>
  item?: InventoryItem | null
  loading?: boolean
}

export function InventoryFormModal({ 
  open, 
  onClose, 
  onSubmit, 
  item, 
  loading = false 
}: InventoryFormModalProps) {
  const [form, setForm] = useState<CreateInventoryItemData>({
    item_name: "",
    category: "drinks",
    quantity: 0,
    threshold: 0,
    cost: undefined
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      console.log('Setting form for editing item:', item)
      setForm({
        item_name: item.name,
        category: item.category,
        quantity: item.current_stock,
        threshold: item.min_stock_level,
        cost: item.cost ?? undefined
      })
    } else {
      console.log('Setting form for new item')
      setForm({
        item_name: "",
        category: "drinks",
        quantity: 0,
        threshold: 0,
        cost: undefined
      })
    }
    setErrors({})
  }, [item, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!form.item_name.trim()) {
      newErrors.item_name = "Item name is required"
    }

    if (!form.category) {
      newErrors.category = "Category is required"
    }

    if (form.quantity < 0) {
      newErrors.quantity = "Quantity cannot be negative"
    }

    if (form.threshold < 0) {
      newErrors.threshold = "Threshold cannot be negative"
    }

    if (form.cost !== undefined && form.cost < 0) {
      newErrors.cost = "Cost cannot be negative"
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors in the form")
      return false
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      console.log('Form submitting with data:', form)
      await onSubmit(form)
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error("Failed to save inventory item")
    }
  }

  const categoryOptions = [
    { value: "drinks", label: "Drinks" },
    { value: "food", label: "Food" },
    { value: "raw_material", label: "Raw Material" },
    { value: "utensils", label: "Utensils" }
  ]

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={item ? "Edit Inventory Item" : "Add New Inventory Item"}
      loading={loading}
      submitText={item ? "Update Item" : "Add Item"}
      size="xl"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">📦</span>
              <h3 className="font-medium">Item Information</h3>
            </div>
            
            <FormField
              label="Item Name"
              name="item_name"
              type="text"
              value={form.item_name}
              onChange={(value: string) => setForm(prev => ({ ...prev, item_name: value }))}
              placeholder="Enter item name"
              required
              error={errors.item_name}
              disabled={loading}
            />

            <FormField
              label="Category"
              name="category"
              type="select"
              value={form.category}
              onChange={(value: string) => setForm(prev => ({ ...prev, category: value as any }))}
              options={categoryOptions}
              required
              error={errors.category}
              disabled={loading}
            />
          </CardContent>
        </Card>

        {/* Stock Information */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">#</span>
              <h3 className="font-medium">Stock Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Current Quantity"
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={(value: string) => setForm(prev => ({ ...prev, quantity: Number(value) }))}
                min={0}
                error={errors.quantity}
                disabled={loading}
              />
              <FormField
                label="Low Stock Threshold"
                name="threshold"
                type="number"
                value={form.threshold}
                onChange={(value: string) => setForm(prev => ({ ...prev, threshold: Number(value) }))}
                min={0}
                error={errors.threshold}
                disabled={loading}
                helpText="Alert when quantity falls below this number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cost Information */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">€</span>
              <h3 className="font-medium">Cost Information</h3>
            </div>

            <FormField
              label="Unit Cost (EUR)"
              name="cost"
              type="number"
              value={form.cost ?? ""}
              onChange={(value: string) => setForm(prev => ({ 
                ...prev, 
                cost: value === "" ? undefined : Number(value)
              }))}
              min={0}
              step={0.01}
              placeholder="0.00"
              error={errors.cost}
              disabled={loading}
              helpText="Optional: Cost per unit for value calculations"
            />
          </CardContent>
        </Card>

        {/* Stock Status Preview */}
        {form.quantity !== undefined && form.threshold !== undefined && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">⚠</span>
                <h3 className="font-medium">Stock Status Preview</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Quantity:</span>
                  <span className="font-medium">{form.quantity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Threshold:</span>
                  <span className="font-medium">{form.threshold}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${form.quantity === 0 
                      ? "bg-red-100 text-red-800" 
                      : form.quantity <= form.threshold 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-green-100 text-green-800"
                    }
                  `}>
                    {form.quantity === 0 
                      ? "Out of Stock" 
                      : form.quantity <= form.threshold 
                      ? "Low Stock" 
                      : "In Stock"
                    }
                  </span>
                </div>
                {form.cost && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Value:</span>
                    <span className="font-medium">
                      €{(form.cost * form.quantity).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FormModal>
  )
} 