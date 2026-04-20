"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingWithCustomer, CreateBookingData, UpdateBookingData, WaitlistEntry } from "@/types/booking"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

interface EnhancedBookingFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateBookingData | UpdateBookingData) => Promise<void>
  onWaitlist?: (data: Omit<WaitlistEntry, 'id' | 'status' | 'created_at'>) => Promise<void>
  booking?: BookingWithCustomer | null
  loading?: boolean
  isFullyBooked?: boolean
}

export function EnhancedBookingFormModal({ 
  open, 
  onClose, 
  onSubmit, 
  onWaitlist,
  booking, 
  loading = false,
  isFullyBooked = false
}: EnhancedBookingFormModalProps) {
  const hasWaitlistHandler = Boolean(onWaitlist)
  const [activeTab, setActiveTab] = useState("single")
  const [form, setForm] = useState<CreateBookingData>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    date: new Date(),
    time: "19:00",
    party_size: 2,
    notes: ""
  })
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'cancelled' | 'completed'>('pending')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (booking) {
      setForm({
        customer_name: booking.customer?.name || "",
        customer_email: booking.customer?.email || "",
        customer_phone: booking.customer?.phone || "",
        date: new Date(booking.date || new Date()),
        time: booking.time || "19:00",
        party_size: booking.party_size || 2,
        notes: booking.notes || ""
      })
      setStatus(booking.status)
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
      setStatus('pending')
    }
    setErrors({})
  }, [booking, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!form.customer_name.trim()) {
      newErrors.customer_name = "Customer name is required"
    }

    if (!form.customer_email && !form.customer_phone) {
      newErrors.customer_email = "Either email or phone is required"
      newErrors.customer_phone = "Either email or phone is required"
    }

    if (form.customer_email && !isValidEmail(form.customer_email)) {
      newErrors.customer_email = "Please enter a valid email address"
    }

    if (!form.date) {
      newErrors.date = "Date is required"
    }

    if (!form.time) {
      newErrors.time = "Time is required"
    }

    if (!form.party_size || form.party_size < 1) {
      newErrors.party_size = "Party size must be at least 1"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      if (activeTab === "single") {
        if (booking) {
          console.log('Updating booking with data:', { ...form, status })
          await onSubmit({
            ...form,
            status
          })
          toast.success("Booking updated successfully!")
        } else {
          console.log('Creating new booking with data:', form)
          await onSubmit(form)
          toast.success("Booking created successfully!")
        }
        // Only close the modal after successful submission
        onClose()
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      if (booking) {
        toast.error("Failed to update booking", {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      } else {
        toast.error("Failed to create booking", {
          description: error instanceof Error ? error.message : 'Unknown error occurred'
        })
      }
      // Don't close the modal on error
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {booking ? "Edit Booking" : "Create New Booking"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Booking</TabsTrigger>
            <TabsTrigger value="waitlist" disabled={!hasWaitlistHandler}>Waitlist</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Customer Information */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">👤</span>
                    <h3 className="font-medium">Customer Information</h3>
                  </div>
                  
                  <div>
                    <Label htmlFor="customer_name" className="mb-1.5">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      value={form.customer_name}
                      onChange={e => setForm(prev => ({ ...prev, customer_name: e.target.value }))}
                      placeholder="Enter customer name"
                      className={errors.customer_name ? "border-red-500" : ""}
                    />
                    {errors.customer_name && <p className="text-sm text-red-500 mt-1">{errors.customer_name}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_email" className="mb-1.5">Email</Label>
                      <Input
                        id="customer_email"
                        type="email"
                        value={form.customer_email}
                        onChange={e => setForm(prev => ({ ...prev, customer_email: e.target.value }))}
                        placeholder="customer@example.com"
                        className={errors.customer_email ? "border-red-500" : ""}
                      />
                      {errors.customer_email && <p className="text-sm text-red-500 mt-1">{errors.customer_email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="customer_phone" className="mb-1.5">Phone</Label>
                      <Input
                        id="customer_phone"
                        type="tel"
                        value={form.customer_phone}
                        onChange={e => setForm(prev => ({ ...prev, customer_phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                        className={errors.customer_phone ? "border-red-500" : ""}
                      />
                      {errors.customer_phone && <p className="text-sm text-red-500 mt-1">{errors.customer_phone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-muted-foreground">🗓️</span>
                    <h3 className="font-medium">Booking Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date" className="mb-1.5">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formatDateForInput(form.date)}
                        onChange={e => setForm(prev => ({ ...prev, date: new Date(e.target.value) }))}
                        className={errors.date ? "border-red-500" : ""}
                      />
                      {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
                    </div>
                    <div>
                      <Label htmlFor="time" className="mb-1.5">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={form.time}
                        onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}
                        className={errors.time ? "border-red-500" : ""}
                      />
                      {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="party_size" className="mb-1.5">Party Size *</Label>
                    <Input
                      id="party_size"
                      type="number"
                      min={1}
                      max={50}
                      value={form.party_size}
                      onChange={e => setForm(prev => ({ ...prev, party_size: parseInt(e.target.value) || 1 }))}
                      className={errors.party_size ? "border-red-500" : ""}
                    />
                    {errors.party_size && <p className="text-sm text-red-500 mt-1">{errors.party_size}</p>}
                  </div>

                  {booking && (
                    <div>
                      <Label htmlFor="status" className="mb-1.5">Status</Label>
                      <Select value={status} onValueChange={(value) => setStatus(value as 'pending' | 'confirmed' | 'cancelled' | 'completed')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes" className="mb-1.5">Notes</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special requests or notes..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {isFullyBooked && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm font-medium">Fully Booked</p>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This time slot is fully booked. You can add this customer to the waitlist instead.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || loading} className="w-full sm:w-auto">
                  {isFullyBooked ? "Add to Waitlist" : "Create Booking"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="waitlist" className="space-y-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Waitlist Management</h3>
              <p className="text-muted-foreground mb-4">
                Manage waitlist entries and notify customers when tables become available.
              </p>
              <p className="text-sm text-muted-foreground">
                Use the &quot;Single Booking&quot; tab and select &quot;Add to Waitlist&quot; when a time slot is fully booked.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 