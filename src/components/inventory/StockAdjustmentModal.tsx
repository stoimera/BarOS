"use client"

import { useState, useEffect } from "react"
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InventoryItem, StockAdjustmentData } from "@/types/inventory"
import { toast } from "sonner"
import { calculateStockStatus, calculateNewQuantity, validateStockAdjustment } from '@/utils/business-logic'
import { handleComponentError } from '@/utils/error-handling'

interface StockAdjustmentModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: StockAdjustmentData) => Promise<void>
  item: InventoryItem | null
  loading?: boolean
}

export function StockAdjustmentModal({ 
  open, 
  onClose, 
  onSubmit, 
  item, 
  loading = false 
}: StockAdjustmentModalProps) {
  const [form, setForm] = useState<StockAdjustmentData>({
    item_id: "",
    change: 0,
    reason: "usage",
    notes: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (item) {
      setForm({
        item_id: item.id,
        change: 0,
        reason: "usage",
        notes: ""
      })
    }
    setErrors({})
  }, [item, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!form.item_id) {
      newErrors.item_id = "Item is required"
    }

    if (!form.reason) {
      newErrors.reason = "Reason is required"
    }

    // Use utility function for stock adjustment validation
    try {
      if (item) {
        validateStockAdjustment(item.current_stock, form.change)
      }
    } catch (error) {
      if (error instanceof Error) {
        newErrors.change = error.message
      }
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
      await onSubmit(form)
      onClose()
    } catch (error) {
      handleComponentError(error, 'adjust stock')
    }
  }

  const getNewQuantity = (): number => {
    if (!item) return 0
    return calculateNewQuantity(item.current_stock, form.change)
  }

  if (!item) return null

  const newQuantity = getNewQuantity()
  const stockStatus = calculateStockStatus(newQuantity, item.min_stock_level)

  const reasonOptions = [
    { value: "purchase", label: "Purchase" },
    { value: "usage", label: "Usage" },
    { value: "correction", label: "Correction" },
    { value: "waste", label: "Waste" }
  ]

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Adjust Stock: ${item.name}`}
      loading={loading}
      submitText="Adjust Stock"
      size="xl"
    >
      <div className="space-y-6">
        {/* Current Stock Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">#</span>
              <h3 className="font-medium">Current Stock</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Quantity</p>
                <p className="text-2xl font-bold">{item.current_stock}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Threshold</p>
                <p className="text-2xl font-bold">{item.min_stock_level}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Current Status</p>
              <span className={`
                inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium mt-1
                ${calculateStockStatus(item.current_stock, item.min_stock_level).color}
              `}>
                {calculateStockStatus(item.current_stock, item.min_stock_level).icon}
                {calculateStockStatus(item.current_stock, item.min_stock_level).label}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Adjustment Details */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">📦</span>
              <h3 className="font-medium">Adjustment Details</h3>
            </div>

            <div>
              <label className="text-sm font-medium">Change Amount *</label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm(prev => ({ ...prev, change: prev.change - 1 }))}
                  disabled={form.change <= -item.current_stock}
                >
                  <span className="text-sm">➖</span>
                </Button>
                <FormField
                  label=""
                  name="change"
                  type="number"
                  value={form.change}
                  onChange={(value: string) => setForm(prev => ({ ...prev, change: Number(value) }))}
                  error={errors.change}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm(prev => ({ ...prev, change: prev.change + 1 }))}
                >
                  <span className="text-sm">➕</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use negative numbers to remove stock, positive to add stock
              </p>
            </div>

            <FormField
              label="Reason"
              name="reason"
              type="select"
              value={form.reason}
              onChange={(value: string) => setForm(prev => ({ ...prev, reason: value as any }))}
              options={reasonOptions}
              required
              error={errors.reason}
              disabled={loading}
            />

            <FormField
              label="Notes"
              name="notes"
              type="textarea"
              value={form.notes}
              onChange={(value: string) => setForm(prev => ({ ...prev, notes: value }))}
              placeholder="Optional notes about this adjustment..."
              rows={3}
              disabled={loading}
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">⚠</span>
              <h3 className="font-medium">Preview</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Quantity:</span>
                <span className="font-medium">{item.current_stock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Change:</span>
                <span className={`font-medium ${form.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {form.change > 0 ? '+' : ''}{form.change}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">New Quantity:</span>
                <span className="font-bold text-lg">{newQuantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Status:</span>
                <span className={`
                  px-2 py-1 rounded text-xs font-medium
                  ${stockStatus.color}
                `}>
                  {stockStatus.icon} {stockStatus.label}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FormModal>
  )
} 