"use client"

import { useState, useEffect } from "react"
import { FormModal } from "@/components/forms/FormModal"
import { FormField } from "@/components/forms/FormField"
import { BookingWithCustomer, CreateBookingData, UpdateBookingData, WaitlistEntry, RecurringBooking } from "@/types/booking"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

interface BookingFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateBookingData | UpdateBookingData) => Promise<void>
  onWaitlist?: (data: Omit<WaitlistEntry, 'id' | 'status' | 'created_at'>) => Promise<void>
  onRecurring?: (data: Omit<RecurringBooking, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  booking?: BookingWithCustomer | null
  loading?: boolean
  isFullyBooked?: boolean
  isCustomer?: boolean
  title?: string
}

export function BookingFormModal({ 
  open, 
  onClose, 
  onSubmit, 
  onWaitlist,
  booking, 
  loading = false,
  isFullyBooked = false,
  isCustomer = false,
  title
}: BookingFormModalProps) {
  const [form, setForm] = useState<CreateBookingData>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    date: new Date(),
    time: "19:00",
    party_size: 2,
    notes: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  useAuth()

  useEffect(() => {
    if (booking) {
      setForm({
        customer_name: booking.customer?.name || "",
        customer_email: booking.customer?.email || "",
        customer_phone: booking.customer?.phone || "",
        date: new Date(booking.booking_date),
        time: booking.start_time,
        party_size: booking.party_size,
        notes: booking.notes || ""
      })
    } else {
      setForm({
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        date: new Date(),
        time: "19:00",
        party_size: 2,
        notes: ""
      })
    }
    setErrors({})
  }, [booking, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.customer_name.trim()) newErrors.customer_name = "Customer name is required"
    if (!form.customer_email && !form.customer_phone) {
      newErrors.customer_email = "Either email or phone is required"
      newErrors.customer_phone = "Either email or phone is required"
    }
    if (form.customer_email && !isValidEmail(form.customer_email)) newErrors.customer_email = "Please enter a valid email address"
    if (!form.date) newErrors.date = "Date is required"
    else if (form.date < new Date()) newErrors.date = "Booking date cannot be in the past"
    if (!form.time) newErrors.time = "Time is required"
    if (!form.party_size || form.party_size < 1) newErrors.party_size = "Party size must be at least 1"
    else if (form.party_size > 50) newErrors.party_size = "Party size cannot exceed 50"
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors in the form")
      return false
    }
    return true
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleChange = (key: keyof CreateBookingData, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsSubmitting(true)
    try {
      if (isFullyBooked && onWaitlist) {
        await onWaitlist({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone,
          date: form.date,
          time: form.time,
          party_size: form.party_size,
          notes: form.notes,
          priority: "medium"
        })
        toast.success("Added to waitlist successfully!")
      } else {
        await onSubmit(form)
      }
      onClose()
    } catch {
      toast.error("Failed to save booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={async () => handleSubmit()}
      title={title || (booking ? "Edit Booking" : "Add Booking")}
      loading={loading || isSubmitting}
      submitText={isFullyBooked ? "Join Waitlist" : booking ? "Save Changes" : "Create Booking"}
      disableSubmit={loading || isSubmitting}
    >
      <FormField
        label={isCustomer ? "Your Name" : "Customer Name"}
        name="customer_name"
        value={form.customer_name}
        onChange={v => handleChange("customer_name", v)}
        required
        error={errors.customer_name}
        placeholder={isCustomer ? "Enter your name" : "Enter customer name"}
      />
      <FormField
        label={isCustomer ? "Your Email" : "Customer Email"}
        name="customer_email"
        type="email"
        value={form.customer_email}
        onChange={v => handleChange("customer_email", v)}
        error={errors.customer_email}
        placeholder={isCustomer ? "Enter your email (optional)" : "Enter email (optional)"}
      />
      <FormField
        label={isCustomer ? "Your Phone" : "Customer Phone"}
        name="customer_phone"
        value={form.customer_phone}
        onChange={v => handleChange("customer_phone", v)}
        error={errors.customer_phone}
        placeholder={isCustomer ? "Enter your phone (optional)" : "Enter phone (optional)"}
      />
      <FormField
        label="Date"
        name="date"
        type="date"
        value={form.date instanceof Date ? form.date.toISOString().split("T")[0] : form.date}
        onChange={v => handleChange("date", new Date(v))}
        required
        error={errors.date}
      />
      <FormField
        label="Time"
        name="time"
        type="time"
        value={form.time}
        onChange={v => handleChange("time", v)}
        required
        error={errors.time}
      />
      <FormField
        label="Party Size"
        name="party_size"
        type="number"
        min={1}
        max={50}
        value={form.party_size}
        onChange={v => handleChange("party_size", Number(v))}
        required
        error={errors.party_size}
      />
      <FormField
        label="Notes"
        name="notes"
        type="textarea"
        value={form.notes}
        onChange={v => handleChange("notes", v)}
        error={errors.notes}
        placeholder="Add any notes (optional)"
        rows={3}
      />
    </FormModal>
  )
} 