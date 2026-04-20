"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { EventTemplate } from "@/types/event"

interface EventTemplateDeleteDialogProps {
  template: EventTemplate | null
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function EventTemplateDeleteDialog({
  template,
  open,
  onClose,
  onConfirm,
  isDeleting
}: EventTemplateDeleteDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-red-100 dark:bg-red-900/20">
              <span className="text-lg text-red-600 dark:text-red-400">⚠</span>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Delete Event Template
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded bg-muted border border-border p-3">
            <div className="flex items-start gap-2">
              <span className="text-sm text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">⚠</span>
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Warning
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Deleting &quot;{template.name}&quot; will remove this template permanently. Any events generated from this template will remain, but the template will no longer be available for generating new events.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Template Details</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Name:</strong> {template.name}</p>
              <p><strong>Category:</strong> {template.category}</p>
              <p><strong>Duration:</strong> {template.default_duration} hours</p>
              <p><strong>Capacity:</strong> {template.default_capacity} people</p>
              <p><strong>Price:</strong> €{template.default_price}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming || isDeleting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirming || isDeleting}
            className="flex-1 sm:flex-none"
          >
            {isConfirming || isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <span className="mr-2">🗑️</span>
                Delete Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 