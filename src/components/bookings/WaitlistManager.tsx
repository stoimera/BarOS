"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WaitlistEntry, CreateBookingData } from "@/types/booking"
import { format } from "date-fns"
import { toast } from "sonner"
import { FormField } from "@/components/shared/FormField"
import { api } from "@/lib/api/client"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Trash2, Calendar, Users, Mail, Phone, CheckCircle, Bell, MoreHorizontal } from "lucide-react"

interface WaitlistManagerProps {
  date?: Date
  onConvertToBooking?: (waitlistId: string, bookingData: CreateBookingData) => Promise<void>
  onNotify?: (waitlistId: string) => Promise<void>
  onRemove?: (waitlistId: string) => Promise<void>
}

export function WaitlistManager({ 
  date, 
  onConvertToBooking, 
  onNotify, 
  onRemove 
}: WaitlistManagerProps) {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [convertForm, setConvertForm] = useState<CreateBookingData>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    date: new Date(),
    time: "19:00",
    party_size: 2,
    notes: ""
  })

  const loadWaitlistEntries = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (date) {
        params.append('date', date.toISOString().split('T')[0])
      }
      params.append('status', 'waiting')
      
      const response = await api.get<{ waitlist: WaitlistEntry[] }>('/api/waitlist', {
        params: Object.fromEntries(params)
      })
      setWaitlistEntries(response.data.waitlist || [])
    } catch (error) {
      toast.error("Failed to load waitlist entries")
      console.error('Load waitlist error:', error)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    void loadWaitlistEntries()
  }, [loadWaitlistEntries])

  const handleNotify = async (entry: WaitlistEntry) => {
    try {
      if (onNotify) {
        await onNotify(entry.id)
        await loadWaitlistEntries()
      }
    } catch {
      toast.error("Failed to notify customer")
    }
  }

  const handleConvertToBooking = async (entry: WaitlistEntry) => {
    setSelectedEntry(entry)
    setConvertForm({
      customer_name: entry.customer_name,
      customer_email: entry.customer_email || "",
      customer_phone: entry.customer_phone || "",
      date: entry.date,
      time: entry.time,
      party_size: entry.party_size,
      notes: entry.notes || ""
    })
    setShowConvertDialog(true)
  }

  const handleConvertFormChange = useCallback((key: keyof CreateBookingData, value: string | number | Date) => {
    setConvertForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleConvertSubmit = async () => {
    if (!selectedEntry || !onConvertToBooking) return
    
    try {
      await onConvertToBooking(selectedEntry.id, convertForm)
      setShowConvertDialog(false)
      setSelectedEntry(null)
      await loadWaitlistEntries()
    } catch {
      toast.error("Failed to convert to booking")
    }
  }

  const handleRemove = async (entry: WaitlistEntry) => {
    if (!onRemove) return
    
    const confirmed = window.confirm(
      `Are you sure you want to remove ${entry.customer_name} from the waitlist?`
    )
    if (!confirmed) return
    
    try {
      await onRemove(entry.id)
      await loadWaitlistEntries()
    } catch {
      toast.error("Failed to remove from waitlist")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'vip':
        return 'bg-purple-100 text-purple-800'
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'vip':
        return <span className="text-xs mr-1">👤</span>
      case 'high':
        return <span className="text-xs mr-1">⚠</span>
      case 'medium':
        return <span className="text-xs mr-1">⏰</span>
      case 'low':
        return <span className="text-xs mr-1">✓</span>
      default:
        return <span className="text-xs mr-1">👤</span>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waitlist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-base">📋</span>
            Waitlist ({waitlistEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waitlistEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <span className="text-4xl mx-auto mb-4 text-gray-300 block">👥</span>
              <p>No waitlist entries</p>
              <p className="text-sm">When tables are fully booked, customers can join the waitlist</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Party Size</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitlistEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{entry.customer_name}</div>
                            {entry.notes && (
                              <div className="text-sm text-muted-foreground mt-1">{entry.notes}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">🗓️</span>
                            <div>
                              <div className="font-medium">
                                {format(new Date(entry.date), 'MMM d, yyyy')}
                              </div>
                              <div className="text-sm text-muted-foreground">{entry.time}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">👥</span>
                            {entry.party_size}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(entry.priority)}>
                            {getPriorityIcon(entry.priority)}
                            {entry.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {entry.customer_email && (
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-xs text-muted-foreground">✉️</span>
                                {entry.customer_email}
                              </div>
                            )}
                            {entry.customer_phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-xs text-muted-foreground">📞</span>
                                {entry.customer_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConvertToBooking(entry)}
                            >
                              <span className="text-sm mr-1">✓</span>
                              Convert
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNotify(entry)}
                            >
                              <span className="text-sm mr-1">🔔</span>
                              Notify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemove(entry)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {waitlistEntries.map((entry) => (
                  <Card key={entry.id} className="p-4">
                    <div className="space-y-3">
                      {/* Customer Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{entry.customer_name}</h3>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                          )}
                        </div>
                        <Badge className={getPriorityColor(entry.priority)}>
                          {getPriorityIcon(entry.priority)}
                          <span className="hidden sm:inline">{entry.priority}</span>
                        </Badge>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(entry.date), 'MMM d, yyyy')}
                          </div>
                          <div className="text-muted-foreground">{entry.time}</div>
                        </div>
                      </div>

                      {/* Party Size */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Party of {entry.party_size}</span>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1 text-sm">
                        {entry.customer_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{entry.customer_email}</span>
                          </div>
                        )}
                        {entry.customer_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{entry.customer_phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertToBooking(entry)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Convert
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNotify(entry)}
                          className="flex-1"
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Notify
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRemove(entry)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Convert to Booking Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField
              label="Customer Name"
              value={convertForm.customer_name}
              onChange={(value) => handleConvertFormChange("customer_name", value)}
              required
            />
            <FormField
              label="Customer Email"
              type="email"
              value={convertForm.customer_email}
              onChange={(value) => handleConvertFormChange("customer_email", value)}
            />
            <FormField
              label="Customer Phone"
              value={convertForm.customer_phone}
              onChange={(value) => handleConvertFormChange("customer_phone", value)}
            />
            <FormField
              label="Date"
              type="date"
              value={convertForm.date instanceof Date ? convertForm.date.toISOString().split("T")[0] : convertForm.date}
              onChange={(value) => handleConvertFormChange("date", new Date(value))}
              required
            />
            <FormField
              label="Time"
              type="time"
              value={convertForm.time}
              onChange={(value) => handleConvertFormChange("time", value)}
              required
            />
            <FormField
              label="Party Size"
              type="number"
              min={1}
              max={50}
              value={convertForm.party_size?.toString()}
              onChange={(value) => handleConvertFormChange("party_size", Number(value))}
              required
            />
            <FormField
              label="Notes"
              type="textarea"
              value={convertForm.notes}
              onChange={(value) => handleConvertFormChange("notes", value)}
              rows={3}
            />
            <div className="flex gap-2 pt-4">
              <Button onClick={handleConvertSubmit} className="flex-1">
                Convert to Booking
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConvertDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 