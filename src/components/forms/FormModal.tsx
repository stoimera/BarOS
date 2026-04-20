"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { outlineButton } from "@/styles/theme"

export interface FormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  title: string
  description?: string
  children: React.ReactNode
  loading?: boolean
  submitText?: string
  cancelText?: string
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  submitClassName?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  disableSubmit?: boolean
  className?: string
}

export function FormModal({
  open,
  onClose,
  onSubmit,
  title,
  description,
  children,
  loading = false,
  submitText = "Save",
  cancelText = "Cancel",
  submitVariant = "default",
  submitClassName,
  size = "md",
  showCloseButton = true,
  disableSubmit = false,
  className,
}: FormModalProps) {
  // Ensure title is never empty for accessibility
  const modalTitle = title?.trim() || "Form";

  // Add runtime logging to catch accessibility issues
  if (!title?.trim()) {
    console.warn("[FormModal] Title is empty or undefined. Using fallback title for accessibility.");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading && !disableSubmit) {
      try {
        // Try to get form data from the form element first
        const formElement = e.target as HTMLFormElement
        if (formElement) {
          const formData = new FormData(formElement)
          await onSubmit(formData)
        } else {
          // Fallback to calling onSubmit without data
          await onSubmit({})
        }
      } catch (error) {
        console.error('Form submission error:', error)
      }
    }
  }

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-[95vw] w-full",
  }

  // Don't render if no title is provided
  if (!modalTitle) {
    console.error("[FormModal] Title is required for accessibility");
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "w-[95vw] max-h-[90vh] overflow-y-auto sm:w-full bg-background border border-border",
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        aria-describedby={description ? "form-modal-description" : undefined}
        showCloseButton={showCloseButton}
      >
        <DialogHeader>
          <DialogTitle id="form-modal-title" className="text-lg sm:text-xl">
            {modalTitle}
          </DialogTitle>
          {description && (
            <DialogDescription id="form-modal-description" className="text-sm">{description}</DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-4" role="group" aria-labelledby="form-modal-title">
            {children}
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className={cn(
                "w-full sm:w-auto bg-background hover:bg-muted",
                outlineButton
              )}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant={submitVariant}
              disabled={loading || disableSubmit}
              className={cn("w-full sm:w-auto", submitClassName)}
            >
              {loading && <span className="mr-2 text-sm animate-spin">⟳</span>}
              {submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 