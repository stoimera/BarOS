"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RSVP } from "@/types/event"
import { RSVPStatus } from "@/types/common"
import { Customer } from "@/types/customer"
import { toast } from "sonner"

interface RSVPWithCustomer extends RSVP {
  customer: Customer
}

interface RSVPListProps {
  eventId: string
  rsvps: RSVPWithCustomer[]
  onCheckIn: (rsvpId: string, checkedIn: boolean) => Promise<void>
  onUpdateStatus: (rsvpId: string, status: RSVPStatus) => Promise<void>
  loading?: boolean
}



export function RSVPList({ rsvps, onCheckIn, onUpdateStatus, loading = false }: RSVPListProps) {
  const [search, setSearch] = useState("")
  const [updatingRSVP, setUpdatingRSVP] = useState<string | null>(null)

  const filteredRSVPs = rsvps.filter(rsvp => 
    rsvp.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    rsvp.customer.email?.toLowerCase().includes(search.toLowerCase()) ||
    rsvp.customer.phone?.includes(search)
  )

  const stats = {
    total: rsvps.length,
    going: rsvps.filter(r => r.status === 'going').length,
    interested: rsvps.filter(r => r.status === 'interested').length,
    cancelled: rsvps.filter(r => r.status === 'cancelled').length,
    checkedIn: rsvps.filter(r => r.checked_in).length
  }

  const handleCheckIn = async (rsvpId: string, checkedIn: boolean) => {
    setUpdatingRSVP(rsvpId)
    try {
      await onCheckIn(rsvpId, checkedIn)
      toast.success(checkedIn ? "Attendee checked in" : "Check-in removed")
    } catch {
      toast.error("Check-in failed")
    } finally {
      setUpdatingRSVP(null)
    }
  }

  const handleStatusUpdate = async (rsvpId: string, status: RSVPStatus) => {
    setUpdatingRSVP(rsvpId)
    try {
      await onUpdateStatus(rsvpId, status)
      toast.success("RSVP status updated")
    } catch {
      toast.error("Status update failed")
    } finally {
      setUpdatingRSVP(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{stats.going}</p><p className="text-sm text-muted-foreground">Going</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{stats.interested}</p><p className="text-sm text-muted-foreground">Interested</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{stats.cancelled}</p><p className="text-sm text-muted-foreground">Cancelled</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{stats.checkedIn}</p><p className="text-sm text-muted-foreground">Checked In</p></CardContent></Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input placeholder="Search attendees..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
        <span className="text-sm text-muted-foreground">{filteredRSVPs.length} of {stats.total}</span>
      </div>

      {/* RSVP Table */}
      <Card>
        <CardHeader><CardTitle>Attendees</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attendee</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRSVPs.map((rsvp) => (
                <TableRow key={rsvp.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                        {rsvp.customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{rsvp.customer.name}</p>
                        <p className="text-sm text-muted-foreground">RSVP&apos;d {new Date(rsvp.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {rsvp.customer.email && <div className="flex items-center gap-2 text-sm"><span>{rsvp.customer.email}</span></div>}
                      {rsvp.customer.phone && <div className="flex items-center gap-2 text-sm"><span>{rsvp.customer.phone}</span></div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={rsvp.status === 'going' ? 'bg-green-100 text-green-800' : rsvp.status === 'interested' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}>
                      {rsvp.status === 'going' ? 'Going' : rsvp.status === 'interested' ? 'Interested' : 'Cancelled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={rsvp.checked_in ? "default" : "outline"}
                      onClick={() => handleCheckIn(rsvp.id, !rsvp.checked_in)}
                      disabled={updatingRSVP === rsvp.id || loading}
                      className={rsvp.checked_in ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {rsvp.checked_in ? "Checked In" : "Check In"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {rsvp.status !== 'going' && <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(rsvp.id, 'going')}>Going</Button>}
                      {rsvp.status !== 'interested' && <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(rsvp.id, 'interested')}>Interested</Button>}
                      {rsvp.status !== 'cancelled' && <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(rsvp.id, 'cancelled')}>Cancel</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRSVPs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No attendees found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 