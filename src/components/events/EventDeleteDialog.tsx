import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EventWithDetails } from '@/types/event';

interface EventDeleteDialogProps {
  event: EventWithDetails | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function EventDeleteDialog({ 
  event, 
  open, 
  onClose, 
  onConfirm, 
  isDeleting 
}: EventDeleteDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!event) return null;

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
                Delete Event
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded border bg-muted/50 p-4">
            <h4 className="font-medium text-foreground">{event.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {event.description}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>• {event.event_date}</span>
              {event.location && <span>• {event.location}</span>}
              {event.max_capacity && <span>• {event.max_capacity} capacity</span>}
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
                  Deleting this event will also remove all associated RSVPs and cannot be undone.
                </p>
              </div>
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
                Delete Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}