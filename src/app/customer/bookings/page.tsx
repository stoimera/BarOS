"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookingFormModal } from "@/components/bookings/BookingFormModal";
import { 
  PageHeaderSkeleton,
  BookingCardSkeleton,
  StatCardSkeleton
} from "@/components/ui/loading-states";
import { Booking, CreateBookingData, UpdateBookingData } from "@/types/booking";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, XCircle, Database, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Check if Supabase environment variables are available
const checkSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables');
    return false;
  }
  
  return true;
};

const supabase = createClient();

function formatDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy");
}

export default function CustomerBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [showPastBookings, setShowPastBookings] = useState(false);

  // Check configuration on mount
  useEffect(() => {
    if (!checkSupabaseConfig()) {
      setConfigError(true);
      setLoading(false);
      setError("Application configuration error. Please contact support.");
    }
  }, []);

  // Load bookings when user is available
  const loadBookings = useCallback(async () => {
    if (!user || configError) return;
    
    try {
      setLoading(true);
      setError("");
      
      console.log('Loading bookings for user:', user.id);
      
      const customerId = await getCustomerIdFromUserId(user.id);
      console.log('Customer ID:', customerId);
      
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', customerId)
        .order('booking_date', { ascending: false });

      console.log('Bookings query result:', { data: bookingsData, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setBookings(bookingsData || []);
      console.log('Set bookings:', bookingsData?.length || 0);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, configError]);

  useEffect(() => {
    if (user && !configError && !authLoading) {
      loadBookings();
      
      // Debug: Log user and profile information
      console.log('Current user:', user);
      console.log('User metadata:', user.user_metadata);
      
      // Check if profile exists
      const checkProfile = async () => {
        try {
          if (user && !configError && !authLoading) {
            console.log('Current user:', user);
            console.log('User metadata:', user.user_metadata);
            
            // Get user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            if (profileError) {
              console.error('Profile error:', profileError);
            } else {
              console.log('User profile:', profile);
              
              // Check if customer exists - use RLS function instead of direct query
              const { data: customerId, error: customerError } = await supabase
                .rpc('get_user_customer_id');
              
              if (customerError) {
                console.error('Customer check error:', customerError);
              } else if (customerId) {
                console.log('User customer ID found:', customerId);
              } else {
                console.log('No customer record found for user');
              }
            }
          }
        } catch (err) {
          console.error('Profile/customer check failed:', err);
        }
      };
      
      checkProfile();
    }
  }, [user, configError, authLoading, loadBookings]);

  // Helper function to get customer ID from user ID with better error handling
  const getCustomerIdFromUserId = async (userId: string): Promise<string> => {
    try {
      console.log('Getting customer ID for user:', userId);
      
      // First, check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', user.email);

      // First, check what the RLS function returns (this is what the policy expects)
      const { data: rlsCustomerId, error: rlsError } = await supabase
        .rpc('get_user_customer_id');
      
      if (!rlsError && rlsCustomerId) {
        console.log('RLS function found existing customer ID:', rlsCustomerId);
        return rlsCustomerId;
      }

      console.log('RLS function returned null, checking manually...');

      // First, get the profile_id from the profiles table using user_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, phone')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error finding profile:', profileError);
        throw new Error('Profile not found - please contact support');
      }

      console.log('Profile found:', profile);
      const profileId = profile.id;

      // Try to find customer by profile_id (this is what RLS expects)
      const { data: customerByProfile, error: customerError } = await supabase
        .from('customers')
        .select('id, name, email, phone, profile_id')
        .eq('profile_id', profileId)
        .single();

      if (!customerError && customerByProfile) {
        console.log('Customer found by profile_id:', customerByProfile);
        return customerByProfile.id;
      }

      console.log('Customer not found by profile_id, checking by email...');

      // If not found by profile_id, try to find by email and update it
      if (user.email) {
        const { data: customerByEmail, error: emailError } = await supabase
          .from('customers')
          .select('id, name, email, profile_id')
          .eq('email', user.email)
          .single();
        
        if (!emailError && customerByEmail) {
          console.log('Customer found by email:', customerByEmail);
          
          // Update the customer to link it to the current profile
          if (customerByEmail.profile_id !== profileId) {
            console.log('Updating customer profile_id to match current user');
            const { error: updateError } = await supabase
              .from('customers')
              .update({ profile_id: profileId })
              .eq('id', customerByEmail.id);
            
            if (updateError) {
              console.error('Error updating customer profile_id:', updateError);
            } else {
              console.log('Customer profile_id updated successfully');
            }
          }
          
          return customerByEmail.id;
        }
      }

      console.log('Customer not found by email, checking by phone...');

      // If not found by email, try to find by phone number
      if (user.phone || profile.phone) {
        const phoneToCheck = user.phone || profile.phone;
        const { data: customerByPhone, error: phoneError } = await supabase
          .from('customers')
          .select('id, name, email, phone, profile_id')
          .eq('phone', phoneToCheck)
          .single();
        
        if (!phoneError && customerByPhone) {
          console.log('Customer found by phone:', customerByPhone);
          
          // Update the customer to link it to the current profile
          if (customerByPhone.profile_id !== profileId) {
            console.log('Updating customer profile_id to match current user');
            const { error: updateError } = await supabase
              .from('customers')
              .update({ profile_id: profileId })
              .eq('id', customerByPhone.id);
            
            if (updateError) {
              console.error('Error updating customer profile_id:', updateError);
            } else {
              console.log('Customer profile_id updated successfully');
            }
          }
          
          return customerByPhone.id;
        }
      }

      console.log('Customer not found, creating new customer with correct profile_id...');

      // If customer doesn't exist, create one with the correct profile_id
      const customerName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'Customer';
      
      const newCustomerData = {
        profile_id: profileId, // This is crucial for RLS to work
        name: customerName,
        email: user.email || '',
        phone: user.phone || '', // Include phone if available
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Creating customer with data:', newCustomerData);
      
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([newCustomerData])
        .select('id, name, email, phone, profile_id')
        .single();

      if (createError) {
        console.error('Error creating customer:', createError);
        console.error('Create error details:', {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint
        });
        
        // Provide specific error messages based on the error
        if (createError.code === '42501') {
          throw new Error('Permission denied: Unable to create customer record. Please contact support.');
        } else if (createError.code === '23505') {
          throw new Error('Customer already exists with this profile.');
        } else {
          throw new Error(`Failed to create customer record: ${createError.message}`);
        }
      }

      if (!newCustomer) {
        throw new Error('Failed to create customer record: No data returned');
      }

      console.log('New customer created:', newCustomer);
      return newCustomer.id;
    } catch (error) {
      console.error('Error in getCustomerIdFromUserId:', error);
      
      // Re-throw with more user-friendly message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to get customer information');
      }
    }
  };


  const handleCreateBooking = async (form: CreateBookingData | UpdateBookingData) => {
    if (!user || configError) return;
    
    try {
      setActionError("");
      setActionSuccess("");
      
      console.log('Creating booking with form data:', form);
      
      const customerId = await getCustomerIdFromUserId(user.id);
      console.log('Customer ID for booking:', customerId);
      
      if (!form.date || !form.time) {
        throw new Error('Date and time are required');
      }

      const bookingData = {
        customer_id: customerId,
        booking_date: form.date.toISOString().split('T')[0],
        start_time: form.time,
        party_size: form.party_size,
        notes: form.notes,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Create the booking with customer_id (not customer fields)
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select(`
          *,
          customer:customers(id, name, email, phone)
        `)
        .single();

      if (error) {
        console.error('Supabase booking creation error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      // Add the new booking to the list
      setBookings(prev => [booking, ...prev]);
      setModalOpen(false);
      setActionSuccess('Booking created successfully!');
      
      // Log for debugging
      console.log('Booking created successfully:', booking);
    } catch (err) {
      console.error('Error creating booking:', err);
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('RLS')) {
          errorMessage = 'Permission denied. Please contact support.';
        } else if (err.message.includes('customer')) {
          errorMessage = 'Customer profile issue. Please contact support.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setActionError(errorMessage);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    
    try {
      setCancelling(true);
      setActionError("");
      
      console.log('Cancelling booking:', bookingToCancel.id);
      console.log('Booking customer_id:', bookingToCancel.customer_id);
      
      // Check what the RLS function returns
      const { data: rlsCustomerId, error: rlsError } = await supabase
        .rpc('get_user_customer_id');
      
      if (rlsError) {
        console.error('RLS Function Error:', rlsError);
      } else {
        console.log('RLS Function returns customer ID:', rlsCustomerId);
        console.log('Customer IDs match for cancellation:', rlsCustomerId === bookingToCancel.customer_id);
      }
      
      // Use API route as primary method since RLS is blocking direct updates
      console.log('Using API route for cancellation...');
      const response = await fetch(`/api/bookings/${bookingToCancel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      });
      
      if (response.ok) {
        const updatedBooking = await response.json();
        console.log('API cancellation successful:', updatedBooking);
        
        // Update the local state immediately
        setBookings(prev => prev.map(booking => 
          booking.id === bookingToCancel.id 
            ? { ...booking, status: 'cancelled' }
            : booking
        ));
        
        setCancelDialogOpen(false);
        setBookingToCancel(null);
        setActionSuccess('Booking cancelled successfully!');
        
        // Force reload bookings to ensure sync
        setTimeout(() => {
          loadBookings();
        }, 1000);
      } else {
        const errorData = await response.json();
        console.error('API cancellation failed:', errorData);
        throw new Error(errorData.error || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setActionError('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-muted text-foreground text-xs">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 text-xs">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeaderSkeleton showActions={false} />
          <StatCardSkeleton count={4} />
          <BookingCardSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-4 sm:py-8">
        <Card className="w-full max-w-md bg-card mx-4">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <Database className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold mb-2 dark:text-white">Configuration Error</h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                The application is not properly configured. Please contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-4 sm:py-8">
        <Card className="w-full max-w-md bg-card mx-4">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center">
              <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold mb-2 dark:text-white">Access Denied</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Please log in to view your bookings.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">My Bookings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your table reservations</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary/90 text-sm sm:text-base w-full sm:w-auto">
              Book Now
            </Button>
          </div>
        </div>

        <BookingFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateBooking}
          isCustomer={true}
        />

        {actionError && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertTitle className="text-sm sm:text-base">Error</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">{actionError}</AlertDescription>
          </Alert>
        )}

        {actionSuccess && (
          <Alert className="mb-4 sm:mb-6">
            <AlertTitle className="text-sm sm:text-base">Success</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">{actionSuccess}</AlertDescription>
          </Alert>
        )}

        {/* Booking Status Information */}
        {bookings.length > 0 && (
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span>Booking Status Guide</span>
              <div className="relative group">
                <Info className="h-4 w-4 text-blue-600 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  <div className="space-y-1">
                    <div><span className="font-medium">Pending:</span> Awaiting confirmation</div>
                    <div><span className="font-medium">Confirmed:</span> Ready for visit</div>
                    <div><span className="font-medium">Completed:</span> Visit finished</div>
                    <div><span className="font-medium">Cancelled:</span> Booking cancelled</div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-900"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={showPastBookings}
                  onChange={(e) => setShowPastBookings(e.target.checked)}
                  className="rounded"
                />
                Show past bookings
              </label>
            </div>
          </div>
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle className="text-sm sm:text-base">Error</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        ) : bookings.length === 0 ? (
          <Card className="bg-card">
            <CardContent className="p-6 sm:p-8 text-center">
              <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2 dark:text-white">No Bookings Yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">Make your first reservation to get started!</p>
              <Button 
                onClick={() => setModalOpen(true)} 
                className="bg-primary hover:bg-primary/90 text-sm sm:text-base"
              >
                Create Your First Booking
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {bookings
              .filter(booking => {
                if (showPastBookings) return true;
                const bookingDate = new Date(booking.booking_date || booking.date || new Date());
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return bookingDate >= today || booking.status === 'pending' || booking.status === 'confirmed';
              })
              .sort((a, b) => {
                const dateA = new Date(a.booking_date || a.date || new Date());
                const dateB = new Date(b.booking_date || b.date || new Date());
                return dateB.getTime() - dateA.getTime(); // Most recent first
              })
              .map((booking) => (
              <Card key={booking.id} className="bg-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {getStatusIcon(booking.status)}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold dark:text-white text-sm sm:text-base truncate">
                          {formatDate(booking.booking_date || booking.date || new Date())} at {booking.start_time || booking.time || ''}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Party of {booking.party_size}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(booking.status)}
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBookingToCancel(booking);
                            setCancelDialogOpen(true);
                          }}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {booking.notes && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                      {booking.notes}
                    </p>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{formatDate(booking.booking_date || booking.date || new Date())}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{booking.start_time || booking.time || ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{booking.party_size} people</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {bookings.length > 0 && bookings.filter(booking => {
              if (showPastBookings) return true;
              const bookingDate = new Date(booking.booking_date || booking.date || new Date());
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return bookingDate >= today || booking.status === 'pending' || booking.status === 'confirmed';
            }).length === 0 && (
              <Card className="bg-card">
                <CardContent className="p-6 sm:p-8 text-center">
                  <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2 dark:text-white">
                    {showPastBookings ? 'No Past Bookings' : 'No Upcoming Bookings'}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {showPastBookings 
                      ? 'You haven\'t completed any visits yet.'
                      : 'You don\'t have any upcoming bookings.'
                    }
                  </p>
                  {!showPastBookings && (
                    <Button 
                      onClick={() => setModalOpen(true)} 
                      className="bg-primary hover:bg-primary/90 text-sm sm:text-base"
                    >
                      Create New Booking
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Cancel Booking Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="bg-card max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="dark:text-white text-base sm:text-lg">
                Cancel {bookingToCancel?.status === 'pending' ? 'Pending' : ''} Booking
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400 text-sm">
                {bookingToCancel?.status === 'pending' 
                  ? "Are you sure you want to cancel this pending booking? This will remove your reservation request."
                  : "Are you sure you want to cancel this confirmed booking? This action cannot be undone."
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(false)}
                disabled={cancelling}
                className="w-full sm:w-auto text-sm"
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="w-full sm:w-auto text-sm"
              >
                {cancelling ? "Cancelling..." : `Cancel ${bookingToCancel?.status === 'pending' ? 'Pending' : ''} Booking`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 