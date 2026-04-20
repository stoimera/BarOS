"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Ticket, CheckCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useEvents } from "@/hooks/useEvents";
import { useRSVP } from "@/hooks/useRSVP";
import { useAuth } from "@/hooks/useAuth";
import { 
  PageHeaderSkeleton,
  EventCardSkeleton
} from "@/components/ui/loading-states";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // Date should always be available from event_date
  time: string | null;
  location: string;
  max_capacity: number;
  current_rsvps: number;
  price: number;
  status: string;
}

export default function CustomerEventsPage() {
  const { events, isLoading } = useEvents();
  const { user } = useAuth();
  const { createRSVP, isCreatingRSVP, useUserRSVPs } = useRSVP();
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({
    name: "",
    email: "",
    phone: "",
    partySize: 1,
    specialRequests: "",
  });
  
  // Get user's RSVPs to show which events they've already RSVP'd to
  const { data: userRSVPs = [] } = useUserRSVPs(user?.id || '');
  const rsvpedEvents = new Set(userRSVPs.map(rsvp => rsvp.event_id));

  const formatTime = (time: string) => {
    if (!time) return null;
    const timeStr = time.toString();
    if (timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`;
    }
    return timeStr;
  };

  // Transform events from useEvents hook to match expected format
  const transformedEvents: Event[] = events.map(event => ({
    id: event.id,
    title: event.title,
    description: event.description || '',
    date: event.event_date, // Use event_date which should always be available from database
    time: event.start_time ? formatTime(event.start_time) : null,
    location: event.location || 'Urban Lounge',
    max_capacity: event.max_capacity || 50,
    current_rsvps: event.current_rsvps || 0,
    price: event.price || 0,
    status: event.is_active ? 'active' : 'inactive'
  }));

  const handleRsvp = async (event: Event) => {
    setSelectedEvent(event);
    setRsvpModalOpen(true);
  };

  const handleDetails = (event: Event) => {
    setSelectedEvent(event);
    setDetailsModalOpen(true);
  };

  const submitRsvp = async () => {
    if (!selectedEvent || !user?.id) return;
    
    try {
      // Create RSVP using the real API
      await createRSVP({
        event_id: selectedEvent.id,
        user_id: user.id,
        status: 'going',
        special_requests: rsvpForm.specialRequests || undefined
      });
      
      toast.success(`Successfully RSVP'd for ${selectedEvent.title}!`, {
        description: "You'll receive a confirmation email shortly.",
      });
      
      setRsvpModalOpen(false);
      setRsvpForm({
        name: "",
        email: "",
        phone: "",
        partySize: 1,
        specialRequests: "",
      });
    } catch {
      toast.error("Failed to RSVP", {
        description: "Please try again later.",
      });
    }
  };

  const isRsvped = (eventId: string) => rsvpedEvents.has(eventId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeaderSkeleton showActions={false} />
          <EventCardSkeleton count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Events</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Discover and join exciting events at Urban Lounge</p>
        </div>
        
        {transformedEvents.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {transformedEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl mb-2">{event.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{event.time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{event.current_rsvps}/{event.max_capacity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleDetails(event)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Info className="h-4 w-4" />
                        Details
                      </Button>
                      <Button
                        onClick={() => handleRsvp(event)}
                        disabled={isRsvped(event.id) || isCreatingRSVP}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {isRsvped(event.id) ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            RSVP&apos;d
                          </>
                        ) : (
                          <>
                            <Ticket className="h-4 w-4" />
                            {isCreatingRSVP ? 'Processing...' : 'RSVP'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                  {event.price > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ${event.price}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No events available</h3>
            <p className="text-sm text-muted-foreground">
              Check back later for upcoming events!
            </p>
          </div>
        )}
      </div>

      {/* RSVP Modal */}
      <Dialog open={rsvpModalOpen} onOpenChange={setRsvpModalOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">RSVP for {selectedEvent?.title}</DialogTitle>
            <DialogDescription className="text-sm">
              Please provide your details to confirm your RSVP for this event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="name" className="text-xs sm:text-sm sm:text-right">
                Name
              </Label>
              <Input
                id="name"
                value={rsvpForm.name}
                onChange={(e) => setRsvpForm(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-1 sm:col-span-3 text-sm"
                placeholder="Your full name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="email" className="text-xs sm:text-sm sm:text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={rsvpForm.email}
                onChange={(e) => setRsvpForm(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-1 sm:col-span-3 text-sm"
                placeholder="your@email.com"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="phone" className="text-xs sm:text-sm sm:text-right">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={rsvpForm.phone}
                onChange={(e) => setRsvpForm(prev => ({ ...prev, phone: e.target.value }))}
                className="col-span-1 sm:col-span-3 text-sm"
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="partySize" className="text-xs sm:text-sm sm:text-right">
                Party Size
              </Label>
              <Input
                id="partySize"
                type="number"
                min="1"
                max="10"
                value={rsvpForm.partySize}
                onChange={(e) => setRsvpForm(prev => ({ ...prev, partySize: parseInt(e.target.value) || 1 }))}
                className="col-span-1 sm:col-span-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="specialRequests" className="text-xs sm:text-sm sm:text-right">
                Special Requests
              </Label>
              <Textarea
                id="specialRequests"
                value={rsvpForm.specialRequests}
                onChange={(e) => setRsvpForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                className="col-span-1 sm:col-span-3 text-sm"
                placeholder="Any dietary restrictions or special requests..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setRsvpModalOpen(false)} className="w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button onClick={submitRsvp} disabled={isCreatingRSVP || !rsvpForm.name || !rsvpForm.email} className="w-full sm:w-auto text-sm">
              {isCreatingRSVP ? "Submitting..." : "Confirm RSVP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{selectedEvent.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{selectedEvent.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{selectedEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{selectedEvent.location}</span>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      {selectedEvent.current_rsvps} of {selectedEvent.max_capacity} spots filled
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">${selectedEvent.price}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedEvent.status === 'active' ? "default" : "secondary"} className="text-xs">
                      {selectedEvent.status === 'active' ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium mb-2 text-sm sm:text-base">What to Expect</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Join us for an unforgettable experience! This event features {selectedEvent.title.toLowerCase()} 
                  with premium service and a welcoming atmosphere. Please arrive 15 minutes before the start time.
                </p>
              </div>
              
              {isRsvped(selectedEvent.id) && (
                <div className="border border-border rounded p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200 text-sm sm:text-base">You&apos;re RSVP&apos;d!</span>
                  </div>
                  <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1">
                    We&apos;ll send you a reminder email 24 hours before the event.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDetailsModalOpen(false)} className="w-full sm:w-auto text-sm">
              Close
            </Button>
            {selectedEvent && !isRsvped(selectedEvent.id) && selectedEvent.status === 'active' && (
              <Button onClick={() => {
                setDetailsModalOpen(false);
                handleRsvp(selectedEvent);
              }} className="w-full sm:w-auto text-sm">
                RSVP Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 