"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Customer } from "@/types/customer";
import { updateCustomer } from "@/lib/customers";
import { toast } from "sonner";

interface CustomerEditModalProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CustomerEditModal({ customer, open, onOpenChange, onSuccess }: CustomerEditModalProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        tags: customer.tags,
        birthday: customer.birthday
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      setLoading(true);
      await updateCustomer(customer.id, formData);
      toast.success("Customer updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update customer", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Customer, value: string | string[] | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Customer name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              type="date"
              value={formData.birthday ? new Date(formData.birthday).toISOString().split('T')[0] : ""}
              onChange={(e) => handleChange("birthday", e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={Array.isArray(formData.tags) ? formData.tags.join(", ") : ""}
              onChange={(e) => handleChange("tags", e.target.value.split(",").map(tag => tag.trim()).filter(Boolean))}
              placeholder="VIP, Regular, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes about the customer"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 