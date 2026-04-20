"use client"

import { ReactNode } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onSubmit: () => void
  onCancel: () => void
  loading?: boolean
  submitText?: string
  cancelText?: string
  children: ReactNode
  maxWidth?: string
}

export function FormModal({
  open,
  onOpenChange,
  title,
  onSubmit,
  onCancel,
  loading = false,
  submitText = "Save",
  cancelText = "Cancel",
  children,
  maxWidth = "max-w-2xl"
}: FormModalProps) {
  // Ensure title is never empty for accessibility
  const modalTitle = title?.trim() || "Form";
  
  // Add runtime logging to catch accessibility issues
  if (!title?.trim()) {
    console.warn("[FormModal] Title is empty or undefined. Using fallback title for accessibility.");
  }
  
  // Don't render if no title is provided
  if (!modalTitle) {
    console.error("[FormModal] Title is required for accessibility");
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`w-[95vw] ${maxWidth} max-h-[90vh] overflow-y-auto sm:w-full`}>
        <DialogHeader>
          {/* Always render DialogTitle for accessibility */}
          <DialogTitle className="text-lg sm:text-xl">{modalTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {children}
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {cancelText}
            </Button>
            <Button 
              onClick={onSubmit} 
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 