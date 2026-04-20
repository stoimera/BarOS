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
import { Newsletter } from '@/types/marketing';
import { format } from 'date-fns';

interface NewsletterDeleteDialogProps {
  newsletter: Newsletter | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function NewsletterDeleteDialog({
  newsletter,
  open,
  onClose,
  onConfirm,
  isDeleting
}: NewsletterDeleteDialogProps) {
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

  if (!newsletter) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
                Delete Newsletter
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/20">
                <span className="text-sm text-blue-600 dark:text-blue-400">✉️</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">{newsletter.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Subject: {newsletter.subject}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(newsletter.created_at), 'MMM d, yyyy')}
                </p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getStatusColor(newsletter.status)}`}>
                  {newsletter.status}
                </span>
              </div>
            </div>
            {newsletter.content && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {newsletter.content}
              </p>
            )}
          </div>

          <div className="rounded bg-muted border border-border p-3">
            <div className="flex items-start gap-2">
              <span className="text-sm text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">⚠</span>
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Warning
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Deleting this newsletter will remove it from your marketing system. This action cannot be undone.
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
                <span className="mr-2">🗑️</span>
                Delete Newsletter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 