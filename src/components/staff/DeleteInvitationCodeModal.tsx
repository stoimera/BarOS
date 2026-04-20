"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InvitationCode } from "@/types/auth"
import { toast } from "sonner"

interface DeleteInvitationCodeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  invitationCode: InvitationCode | null
}

export function DeleteInvitationCodeModal({ 
  open, 
  onClose, 
  onSuccess, 
  invitationCode 
}: DeleteInvitationCodeModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!invitationCode) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/invitation-codes?id=${invitationCode.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete invitation code')
      }

      toast.success("Invitation code deleted successfully!")
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Failed to delete invitation code:", error)
      toast.error(error.message || "Failed to delete invitation code")
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getRoleIcon = (role: string) => {
    return role === "admin" ? '👑' : '👥'
  }

  const getStatusBadge = (code: InvitationCode) => {
    if (!code.is_active) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (code.used_by) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Used</Badge>
    }
    if (new Date() > new Date(code.expires_at)) {
      return <Badge variant="destructive">Expired</Badge>
    }
    return <Badge variant="outline">Active</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-red-100 dark:bg-red-900/20">
              <span className="text-red-600 dark:text-red-400 text-lg">⚠</span>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Delete Invitation Code
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {invitationCode && (
          <div className="space-y-4">
            <div className="rounded border bg-muted/50 p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/20">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">🔑</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="font-mono text-sm bg-background px-2 py-1 rounded border">
                        {invitationCode.code}
                      </code>
                      {getStatusBadge(invitationCode)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getRoleIcon(invitationCode.role)}
                      <span className="capitalize">{invitationCode.role} invitation</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div className="font-medium">{formatDate(invitationCode.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Expires</div>
                    <div className="font-medium flex items-center gap-1">
                      {formatDate(invitationCode.expires_at)}
                      {new Date() > new Date(invitationCode.expires_at) && (
                        <span className="text-red-500 text-xs">⚠</span>
                      )}
                    </div>
                  </div>
                </div>

                {invitationCode.used_by_user && (
                  <div>
                    <div className="text-muted-foreground text-sm">Used by</div>
                    <div className="text-sm font-medium">
                      {`${invitationCode.used_by_user.first_name || ''} ${invitationCode.used_by_user.last_name || ''}`.trim()}
                    </div>
                    <div className="text-muted-foreground text-sm">{invitationCode.used_by_user.email}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded bg-muted border border-border p-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">⚠</span>
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    Warning
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Deleting this invitation code will permanently remove it from the system. 
                    {invitationCode.used_by ? " The user who used this code will not be affected." : " This code will no longer be usable for registration."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            {isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                Delete Code
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
