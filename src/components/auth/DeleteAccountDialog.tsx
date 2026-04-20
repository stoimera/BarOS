"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
}

export function DeleteAccountDialog({ open, onOpenChange, onDelete }: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return
    }
    
    setLoading(true)
    try {
      await onDelete()
      toast.success("Account deleted successfully")
      onOpenChange(false)
    } catch (deleteError) {
      console.error('Failed to delete account:', deleteError)
      toast.error("Failed to delete account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
        </DialogHeader>
        <p className="mb-2">If you delete your account, all your data will be permanently deleted. This action cannot be undone. <br/> If you wish to proceed, please type <b>confirm</b> to delete your account.</p>
        <Input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="Type 'confirm' to delete your account"
          aria-label="Type 'confirm' to delete your account"
          disabled={loading}
        />
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmText !== "confirm"}
            aria-disabled={loading || confirmText !== "confirm"}
            aria-busy={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 