"use client";

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
import { VisitWithDetails } from '@/types/visit';
import { format } from 'date-fns';

interface VisitDeleteDialogProps {
  visit: VisitWithDetails | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function VisitDeleteDialog({ 
  visit, 
  open, 
  onClose, 
  onConfirm, 
  isDeleting 
}: VisitDeleteDialogProps) {
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

  if (!visit) return null;

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
                Delete Visit
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/20">
                <span className="text-blue-600 dark:text-blue-400 text-sm">📅</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">{visit.customer?.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(visit.visit_date), 'MMM d, yyyy')} • {visit.visit_type}
                </p>
                {visit.check_in_time && (
                  <p className="text-sm text-muted-foreground">
                    Checked in at {format(new Date(visit.check_in_time), 'HH:mm')}
                  </p>
                )}
              </div>
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
                  Deleting this visit will remove it from your visit tracking system. This action cannot be undone.
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
                Delete Visit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 