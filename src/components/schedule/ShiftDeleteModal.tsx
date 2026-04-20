import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShiftWithStaff } from '@/types/schedule';
import { format } from 'date-fns';

interface ShiftDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: ShiftWithStaff | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function ShiftDeleteModal({ 
  open, 
  onOpenChange, 
  shift, 
  onConfirm, 
  isDeleting 
}: ShiftDeleteModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shift');
    }
  };

  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-red-100">
              <span className="text-xl text-red-600">🗑️</span>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Delete Shift
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shift Details */}
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium text-foreground mb-3">Shift Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">👤</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {shift.staff?.name || `${shift.staff?.first_name || ''} ${shift.staff?.last_name || ''}`.trim() || 'Unknown Staff'}
                  </p>
                  <p className="text-xs text-muted-foreground">Staff Member</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">🗓️</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(shift.shift_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">Date</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">⏰</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {shift.start_time} - {shift.end_time}
                  </p>
                  <p className="text-xs text-muted-foreground">Time</p>
                </div>
              </div>
              
              {shift.role && (
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {shift.role}
                    </p>
                    <p className="text-xs text-muted-foreground">Role</p>
                  </div>
                </div>
              )}
              
              {shift.notes && (
                <div className="flex items-start gap-3">
                  <div className="h-4 w-4 rounded bg-blue-100 flex items-center justify-center mt-0.5">
                    <div className="h-2 w-2 rounded bg-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {shift.notes}
                    </p>
                    <p className="text-xs text-muted-foreground">Notes</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
            <span className="text-lg text-red-600 mt-0.5 flex-shrink-0">⚠</span>
            <div>
              <p className="text-sm font-medium text-red-800">
                Are you sure you want to delete this shift?
              </p>
              <p className="text-sm text-red-700 mt-1">
                This will permanently remove the shift from the schedule and cannot be undone.
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <span className="mr-2">🗑️</span>
                Delete Shift
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
