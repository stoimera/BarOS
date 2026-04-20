import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Customer } from '@/types/customer'
import { Trash2, Users } from 'lucide-react'

interface CustomerBulkDeleteDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  selectedCustomers: Customer[]
  isDeleting: boolean
}

export function CustomerBulkDeleteDialog({
  open,
  onClose,
  onConfirm,
  selectedCustomers,
  isDeleting
}: CustomerBulkDeleteDialogProps) {
  const customerCount = selectedCustomers.length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-red-100">
              <span className="text-lg text-red-600">🗑️</span>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Delete Multiple Customers</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete {customerCount} customer{customerCount > 1 ? 's' : ''}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <div className="flex items-start gap-3 rounded border border-border bg-muted p-4">
            <span className="text-base text-primary mt-0.5">⚠</span>
            <div className="text-sm">
              <p className="font-medium text-foreground">Warning</p>
              <p className="text-foreground mt-1">
                Deleting customers will also remove all their associated data including visits, bookings, and RSVPs.
              </p>
            </div>
          </div>

          {/* Customer Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-gray-700">
                Selected Customers ({customerCount})
              </span>
            </div>
            
            <div className="max-h-32 overflow-y-auto rounded-md border bg-muted p-3">
              <div className="space-y-2">
                {selectedCustomers.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-muted-foreground">{customer.email}</span>
                  </div>
                ))}
                {customerCount > 5 && (
                  <div className="text-sm text-muted-foreground italic">
                    ...and {customerCount - 5} more customer{customerCount - 5 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {customerCount} Customer{customerCount > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 