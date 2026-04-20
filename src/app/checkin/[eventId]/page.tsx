"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Search, User, Calendar } from "lucide-react"
import { format } from "date-fns"
import { EventWithDetails } from "@/types/event"
import { RSVPStatus } from "@/types/common"
import { toast } from "sonner"
import { api } from '@/lib/api/client'

interface RSVPWithCustomer {
  id: string
  user_id: string
  event_id: string
  status: RSVPStatus
  checked_in: boolean
  created_at: Date
  updated_at: Date
  customer: {
    id: string
    name: string
    email?: string
    phone?: string
    tags: string[]
    notes?: string
    created_at: Date
    updated_at: Date
  }
}

export default function CheckInPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [rsvps, setRsvps] = useState<RSVPWithCustomer[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [error, setError] = useState<string>("")

  const loadEventData = useCallback(async () => {
    if (!params.eventId) return
    setLoading(true)
    try {
      const [eventRes, rsvpRes] = await Promise.all([
        api.get<{ event: EventWithDetails }>(`/api/events/${params.eventId}`),
        api.get<{ rsvps: RSVPWithCustomer[] }>(`/api/events/${params.eventId}/rsvps`)
      ])
      
      setEvent(eventRes.data.event)
      setRsvps(rsvpRes.data.rsvps)
    } catch {
      setLoading(false)
      setError('Failed to load event data')
    }
  }, [params.eventId])

  useEffect(() => {
    if (params.eventId) {
      loadEventData()
    }
  }, [params.eventId, loadEventData])

  const handleCheckIn = async (rsvpId: string) => {
    setCheckingIn(rsvpId)
    try {
      await api.put(`/api/rsvps/${rsvpId}/checkin`, { checkedIn: true })
      
      setRsvps(prev => prev.map(rsvp => 
        rsvp.id === rsvpId ? { ...rsvp, checked_in: true } : rsvp
      ))
      toast.success("Successfully checked in!")
    } catch {
      toast.error("Failed to check in")
    } finally {
      setCheckingIn(null)
    }
  }

  const filteredRSVPs = rsvps.filter(rsvp => 
    rsvp.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    rsvp.customer.email?.toLowerCase().includes(search.toLowerCase()) ||
    rsvp.customer.phone?.includes(search)
  )

  const stats = {
    total: rsvps.length,
    going: rsvps.filter(r => r.status === 'going').length,
    checkedIn: rsvps.filter(r => r.checked_in).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || "The event you're looking for doesn't exist."}</p>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{event.title}</h1>
          <p className="text-muted-foreground mb-4">{event.description}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(event.event_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total RSVPs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.going}</p>
              <p className="text-sm text-muted-foreground">Going</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.checkedIn}</p>
              <p className="text-sm text-muted-foreground">Checked In</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search attendees by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Attendees List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Attendees ({filteredRSVPs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredRSVPs.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    rsvp.checked_in ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{rsvp.customer.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {rsvp.customer.email && <span>{rsvp.customer.email}</span>}
                        {rsvp.customer.phone && <span>• {rsvp.customer.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={rsvp.status === 'going' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {rsvp.status === 'going' ? 'Going' : 'Interested'}
                    </Badge>
                    {rsvp.checked_in ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Checked In</span>
                      </div>
                    ) : rsvp.status === 'going' ? (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(rsvp.id)}
                        disabled={checkingIn === rsvp.id}
                      >
                        {checkingIn === rsvp.id ? "Checking In..." : "Check In"}
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not going</span>
                    )}
                  </div>
                </div>
              ))}
              {filteredRSVPs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {search ? "No attendees found matching your search." : "No attendees yet."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>• Search for your name above to check in</p>
          <p>• Only attendees with &quot;Going&quot; status can check in</p>
          <p>• Contact event organizers if you need assistance</p>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="text-sm text-muted-foreground">
            Scan the QR code to check in guests for &quot;{event.title}&quot;
          </p>
        </div>
      </div>
    </div>
  )
} 