import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookingWithCustomer } from '@/types/booking'

interface DeleteBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  booking: BookingWithCustomer | null
  isDeleting: boolean
}

export function DeleteBookingModal({
  isOpen,
  onClose,
  onConfirm,
  booking,
  isDeleting
}: DeleteBookingModalProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  if (!booking) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center">
              <span className="text-destructive text-lg">⚠</span>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Delete Booking
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted rounded p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-primary text-sm">⚠</span>
              <span className="text-sm font-medium text-foreground">
                Are you sure you want to delete this booking?
              </span>
            </div>
            
            <div className="border-l-2 border-border pl-3 space-y-2">
              <div className="text-sm">
                <span className="font-medium text-foreground">Customer:</span>
                <span className="ml-2 text-muted-foreground">{booking.customer.name}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-foreground">Date:</span>
                <span className="ml-2 text-muted-foreground">
                  {new Date(booking.booking_date).toLocaleDateString('en-GB')} at {booking.start_time}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-foreground">Party Size:</span>
                <span className="ml-2 text-muted-foreground">{booking.party_size} people</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-foreground">Status:</span>
                <span className="ml-2 text-muted-foreground capitalize">{booking.status}</span>
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
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                Delete Booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
