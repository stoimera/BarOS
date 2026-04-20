"use client";

import { useState, useEffect } from "react";
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { 
  ShiftWithStaff, 
  CreateShiftData, 
  UpdateShiftData
} from "@/types/schedule";
import { StaffMember } from "@/types/schedule";

interface ShiftFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateShiftData | UpdateShiftData) => Promise<void>;
  shift?: ShiftWithStaff | null;
  staffMembers: StaffMember[];
}

export function ShiftFormModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  shift, 
  staffMembers 
}: ShiftFormModalProps) {
  const [formData, setFormData] = useState<CreateShiftData>({
    staff_id: "",
    shift_date: "",
    role: "staff",
    start_time: "",
    end_time: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shift) {
      setFormData({
        staff_id: shift.staff_id,
        shift_date: shift.shift_date,
        role: shift.role || "staff",
        start_time: shift.start_time || "",
        end_time: shift.end_time || "",
        notes: shift.notes || ""
      });
    } else {
      setFormData({
        staff_id: "",
        shift_date: "",
        role: "staff",
        start_time: "",
        end_time: "",
        notes: ""
      });
    }
  }, [shift, open]);

  const handleRoleChange = (role: string) => {
    // Map role to default times if needed
    const defaultTimes = {
      'bartender': { start: '16:00', end: '00:00' },
      'server': { start: '08:00', end: '16:00' },
      'host': { start: '08:00', end: '16:00' },
      'security': { start: '20:00', end: '04:00' },
      'cleaner': { start: '06:00', end: '14:00' },
      'manager': { start: '08:00', end: '18:00' },
      'staff': { start: '08:00', end: '16:00' }
    };
    
    const times = defaultTimes[role as keyof typeof defaultTimes] || { start: '08:00', end: '16:00' };
    
    setFormData(prev => ({
      ...prev,
      role: role,
      start_time: times.start,
      end_time: times.end
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (shift) {
        // Update existing shift
        await onSubmit(formData as UpdateShiftData);
      } else {
        // Create new shift
        await onSubmit(formData as CreateShiftData);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error in shift form submit:', error);
      throw error; 
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.staff_id && formData.shift_date && formData.role;

  // Ensure title is never empty for accessibility
  const modalTitle = shift ? "Edit Shift" : "Add New Shift";
  
  // Add runtime logging to catch accessibility issues
  if (!modalTitle?.trim()) {
    console.warn("[ShiftFormModal] Title is empty or undefined. Using fallback title for accessibility.");
  }

  const staffOptions = staffMembers.map((staff) => ({
    value: staff.id,
    label: `${staff.name} (${staff.role})`
  }));

  const roleOptions = [
    { value: 'staff', label: 'Staff' },
    { value: 'bartender', label: 'Bartender' },
    { value: 'server', label: 'Server' },
    { value: 'host', label: 'Host' },
    { value: 'security', label: 'Security' },
    { value: 'cleaner', label: 'Cleaner' },
    { value: 'manager', label: 'Manager' }
  ];

  return (
    <FormModal
      open={open}
      onClose={() => onOpenChange(false)}
      onSubmit={handleSubmit}
      title={modalTitle}
      loading={loading}
      submitText={shift ? "Update Shift" : "Create Shift"}
      disableSubmit={!isFormValid}
      size="md"
    >
      <div className="space-y-4">
        <FormField
          label="Staff Member"
          name="staff_id"
          type="select"
          value={formData.staff_id}
          onChange={(value: string) => setFormData(prev => ({ ...prev, staff_id: value }))}
          options={staffOptions}
          required
          disabled={loading}
        />

        <FormField
          label="Date"
          name="shift_date"
          type="date"
          value={formData.shift_date}
          onChange={(value: string) => setFormData(prev => ({ ...prev, shift_date: value }))}
          required
          disabled={loading}
        />

        <FormField
          label="Role"
          name="role"
          type="select"
          value={formData.role}
          onChange={(value: string) => handleRoleChange(value)}
          options={roleOptions}
          required
          disabled={loading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Start Time"
            name="start_time"
            type="time"
            value={formData.start_time}
            onChange={(value: string) => setFormData(prev => ({ ...prev, start_time: value }))}
            disabled={loading}
          />
          <FormField
            label="End Time"
            name="end_time"
            type="time"
            value={formData.end_time}
            onChange={(value: string) => setFormData(prev => ({ ...prev, end_time: value }))}
            disabled={loading}
          />
        </div>

        <FormField
          label="Notes (Optional)"
          name="notes"
          type="textarea"
          value={formData.notes}
          onChange={(value: string) => setFormData(prev => ({ ...prev, notes: value }))}
          placeholder="Any additional notes about this shift..."
          rows={3}
          disabled={loading}
        />
      </div>
    </FormModal>
  );
} 