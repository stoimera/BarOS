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

interface NewsletterSendDialogProps {
  newsletter: Newsletter | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSending: boolean;
}

export function NewsletterSendDialog({
  newsletter,
  open,
  onClose,
  onConfirm,
  isSending
}: NewsletterSendDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Send error:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!newsletter) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
              <span className="text-lg text-primary">➤</span>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Send Newsletter
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Are you sure you want to send this newsletter to all subscribers?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-green-100 dark:bg-green-900/20">
                <span className="text-sm text-green-600 dark:text-green-400">✉️</span>
              </div>
              <div>
                <h4 className="font-medium text-foreground">{newsletter.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Subject: {newsletter.subject}
                </p>
                <p className="text-sm text-muted-foreground">
                  Created: {format(new Date(newsletter.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            {newsletter.content && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {newsletter.content}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted border border-border p-3">
            <div className="flex items-start gap-2">
              <span className="text-sm text-primary mt-0.5 flex-shrink-0">👥</span>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Recipients
                </p>
                <p className="text-foreground mt-1">
                  This newsletter will be sent to all active subscribers in your mailing list.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded bg-muted border border-border p-3">
            <div className="flex items-start gap-2">
              <span className="text-sm text-primary mt-0.5 flex-shrink-0">⚠</span>
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  Important
                </p>
                <p className="text-foreground mt-1">
                  Once sent, this newsletter cannot be recalled. Make sure the content is final and ready for your audience.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming || isSending}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || isSending}
            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
          >
            {isConfirming || isSending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <span className="mr-2">➤</span>
                Send Newsletter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 