import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

interface RSVPData {
  event_id: string;
  user_id: string;
  status?: 'going' | 'interested' | 'not_going';
  special_requests?: string;
}

interface RSVPResponse {
  success: boolean;
  rsvp_id: string;
  message: string;
  event: {
    title: string;
    date: string;
    location: string;
    current_rsvps: number;
  } | null;
}

export function useRSVP() {
  const queryClient = useQueryClient();

  // Create/Update RSVP mutation
  const createRSVP = useMutation({
    mutationFn: async (rsvpData: RSVPData): Promise<RSVPResponse> => {
      const response = await api.post<RSVPResponse>('/api/rsvps', rsvpData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate events queries to refresh RSVP counts
      queryClient.invalidateQueries({ queryKey: ['events'] });
      
      // Show success message
      toast.success(data.message, {
        description: data.event ? `${data.event.title} - ${data.event.current_rsvps} RSVPs` : undefined
      });
    },
    onError: (error: any) => {
      console.error('RSVP creation failed:', error);
      toast.error('Failed to RSVP', {
        description: error?.message || 'An error occurred while processing your RSVP'
      });
    }
  });

  // Get RSVPs for a specific event
  const useEventRSVPs = (eventId: string) => {
    return useQuery({
      queryKey: ['rsvps', 'event', eventId],
      queryFn: async () => {
        const response = await api.get<{ rsvps: any[] }>('/api/rsvps', {
          params: { event_id: eventId }
        });
        return response.data?.rsvps || [];
      },
      enabled: !!eventId,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Get RSVPs for a specific user
  const useUserRSVPs = (userId: string) => {
    return useQuery({
      queryKey: ['rsvps', 'user', userId],
      queryFn: async () => {
        const response = await api.get<{ rsvps: any[] }>('/api/rsvps');
        return response.data?.rsvps || [];
      },
      enabled: !!userId,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  return {
    createRSVP: createRSVP.mutateAsync,
    isCreatingRSVP: createRSVP.isPending,
    useEventRSVPs,
    useUserRSVPs,
    createRSVPMutation: createRSVP
  };
}
