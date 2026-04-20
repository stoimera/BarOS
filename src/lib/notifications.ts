import { createClient } from '@/utils/supabase/client';

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

/** Resolve auth.users id from public.customers id (notifications.user_id FK). */
export async function resolveAuthUserIdFromCustomerId(
  customerId: string
): Promise<string | null> {
  const supabase = getSupabase();
  const { data: customer, error: cErr } = await supabase
    .from('customers')
    .select('profile_id')
    .eq('id', customerId)
    .maybeSingle();

  if (cErr || !customer?.profile_id) {
    return null;
  }

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', customer.profile_id)
    .maybeSingle();

  if (pErr || !profile?.user_id) {
    return null;
  }

  return profile.user_id;
}

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'birthday' | 'reward' | 'visit' | 'milestone' | 'task' | 'event' | 'inventory' | 'promotion';
  category: 'system' | 'customer' | 'reward' | 'visit' | 'birthday' | 'milestone' | 'alert' | 'reminder' | 'task' | 'event' | 'inventory' | 'promotion';
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
}

export interface ReminderData {
  user_id: string;
  title: string;
  message: string;
  type: Notification['type'];
  category: Notification['category'];
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  message_template: string;
  type: Notification['type'];
  category: Notification['category'];
  variables: string[];
  enabled: boolean;
  created_at: string;
}

export interface NotificationSettings {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_types: {
    birthday: boolean;
    reward: boolean;
    visit: boolean;
    milestone: boolean;
    system: boolean;
    task: boolean;
    event: boolean;
    inventory: boolean;
    promotion: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:mm format
    end_time: string; // HH:mm format
  };
  created_at: string;
  updated_at: string;
}

// =====================================================
// NOTIFICATION CRUD OPERATIONS
// =====================================================

export async function createNotification(data: {
  user_id: string;
  title: string;
  message: string;
  type: Notification['type'];
  category: Notification['category'];
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
}): Promise<Notification> {
  const supabase = getSupabase();
  const row = {
    user_id: data.user_id,
    title: data.title,
    message: data.message,
    type: data.type,
    category: data.category,
    is_read: false,
    action_url: data.action_url ?? null,
    action_text: data.action_text ?? null,
    metadata: data.metadata ?? null,
    expires_at: data.expires_at ?? null,
  };

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }

  return notification as Notification;
}

export async function getNotifications(filters?: {
  user_id?: string;
  read?: boolean;
  type?: Notification['type'];
  category?: Notification['category'];
  limit?: number;
}): Promise<Notification[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters?.read !== undefined) {
    query = query.eq('is_read', filters.read);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }

  return data || [];
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }

  return data;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
}

// =====================================================
// REMINDER INTEGRATION FUNCTIONS
// =====================================================

export async function createReminderNotification(
  reminderData: ReminderData
): Promise<Notification> {
  return createNotification({
    user_id: reminderData.user_id,
    title: reminderData.title,
    message: reminderData.message,
    type: reminderData.type,
    category: reminderData.category,
    action_url: reminderData.action_url,
    action_text: reminderData.action_text,
    metadata: reminderData.metadata,
    expires_at: reminderData.expires_at,
  });
}

export async function getReminderNotifications(userId: string): Promise<Notification[]> {
  return getNotifications({
    user_id: userId,
    category: 'reminder',
    limit: 50
  });
}

export async function getTaskReminders(userId: string): Promise<Notification[]> {
  return getNotifications({
    user_id: userId,
    category: 'task',
    limit: 20
  });
}

export async function getEventReminders(userId: string): Promise<Notification[]> {
  try {
    // First, get existing event notifications from the database
    const existingNotifications = await getNotifications({
      user_id: userId,
      category: 'event',
      limit: 20
    });

    const supabase = getSupabase();
    // Check if user is a customer by looking at their profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const isCustomer = !profile || profile.role === 'customer';

    if (isCustomer) {
      // For customers, also generate dynamic event notifications based on upcoming events
      const dynamicEventNotifications = await generateCustomerEventNotifications(userId);
      
      // Combine existing notifications with dynamic ones
      const allNotifications = [...existingNotifications, ...dynamicEventNotifications];
      
      // Sort by created_at (newest first) and remove duplicates
      const uniqueNotifications = allNotifications
        .filter((notification, index, self) => 
          index === self.findIndex(n => n.id === notification.id)
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return uniqueNotifications.slice(0, 20); // Limit to 20
    }

    // For non-customers, return existing notifications only
    return existingNotifications;
  } catch (error) {
    console.error('Error getting event reminders:', error);
    return [];
  }
}

async function generateCustomerEventNotifications(userId: string): Promise<Notification[]> {
  try {
    const supabase = getSupabase();
    // Get customer ID from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) return [];

    // Try to get customer ID using RLS function first
    const { data: customerId } = await supabase
      .rpc('get_user_customer_id');

    let customerIdFinal = customerId;

    // If RLS function fails, try manual lookup
    if (!customerIdFinal) {
      const { data: customerByProfile } = await supabase
        .from('customers')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (customerByProfile) {
        customerIdFinal = customerByProfile.id;
      }
    }

    if (!customerIdFinal) return [];

    // Get upcoming events for this customer
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const { data: upcomingEvents, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        event_date,
        start_time,
        location,
        is_active
      `)
      .gte('event_date', todayStr)
      .eq('is_active', true)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(10);

    if (error || !upcomingEvents) return [];

    // Generate notifications for upcoming events
    const eventNotifications: Notification[] = upcomingEvents.map(event => {
      const eventDate = new Date(event.event_date);
      const daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let title: string;
      let message: string;
      let type: Notification['type'] = 'info';
      
      if (daysUntilEvent === 0) {
        title = `🎉 Event Today: ${event.title}`;
        message = `Don't forget! ${event.title} is happening today at ${event.start_time}${event.location ? ` at ${event.location}` : ''}.`;
        type = 'success';
      } else if (daysUntilEvent === 1) {
        title = `📅 Event Tomorrow: ${event.title}`;
        message = `Tomorrow is ${event.title}! It starts at ${event.start_time}${event.location ? ` at ${event.location}` : ''}.`;
        type = 'warning';
      } else if (daysUntilEvent <= 7) {
        title = `📅 Upcoming Event: ${event.title}`;
        message = `${event.title} is coming up in ${daysUntilEvent} days on ${eventDate.toLocaleDateString()} at ${event.start_time}.`;
        type = 'info';
      } else {
        title = `📅 Future Event: ${event.title}`;
        message = `${event.title} is scheduled for ${eventDate.toLocaleDateString()} at ${event.start_time}.`;
        type = 'info';
      }

      return {
        id: `event-${event.id}-${daysUntilEvent}`, // Unique ID for this event notification
        user_id: userId,
        title,
        message,
        type,
        category: 'event',
        is_read: false,
        action_url: `/customer/events`,
        action_text: 'View Event Details',
        metadata: {
          event_id: event.id,
          event_date: event.event_date,
          days_until_event: daysUntilEvent,
          is_dynamic: true // Mark as dynamically generated
        },
        created_at: new Date().toISOString(),
        expires_at: new Date(eventDate.getTime() + 24 * 60 * 60 * 1000).toISOString() // Expire after event
      };
    });

    return eventNotifications;
  } catch (error) {
    console.error('Error generating customer event notifications:', error);
    return [];
  }
}

export async function getInventoryReminders(userId: string): Promise<Notification[]> {
  return getNotifications({
    user_id: userId,
    category: 'inventory',
    limit: 20
  });
}

export async function getPromotionReminders(userId: string): Promise<Notification[]> {
  return getNotifications({
    user_id: userId,
    category: 'promotion',
    limit: 20
  });
}

// =====================================================
// SPECIALIZED NOTIFICATION CREATORS
// =====================================================

export async function createBirthdayNotification(customerId: string, customerName: string): Promise<void> {
  const userId = await resolveAuthUserIdFromCustomerId(customerId);
  if (!userId) {
    console.warn('createBirthdayNotification: missing auth user for customer', customerId);
    return;
  }
  await createNotification({
    user_id: userId,
    title: `🎂 Happy Birthday, ${customerName}!`,
    message: `We hope you have a wonderful birthday! Come celebrate with us and enjoy a special birthday treat on the house.`,
    type: 'birthday',
    category: 'birthday',
    action_url: '/customer/rewards',
    action_text: 'Claim Birthday Reward',
    metadata: {
      customer_name: customerName,
      reward_type: 'birthday'
    }
  });
}

export async function createRewardNotification(customerId: string, customerName: string, rewardType: string): Promise<void> {
  const userId = await resolveAuthUserIdFromCustomerId(customerId);
  if (!userId) {
    console.warn('createRewardNotification: missing auth user for customer', customerId);
    return;
  }
  await createNotification({
    user_id: userId,
    title: `🎁 New Reward Available!`,
    message: `Congratulations ${customerName}! You've earned a new ${rewardType} reward. Check your rewards to claim it.`,
    type: 'reward',
    category: 'reward',
    action_url: '/customer/rewards',
    action_text: 'View Rewards',
    metadata: {
      customer_name: customerName,
      reward_type: rewardType
    }
  });
}

export async function createVisitMilestoneNotification(customerId: string, customerName: string, milestone: string): Promise<void> {
  const userId = await resolveAuthUserIdFromCustomerId(customerId);
  if (!userId) {
    console.warn('createVisitMilestoneNotification: missing auth user for customer', customerId);
    return;
  }
  await createNotification({
    user_id: userId,
    title: `🏆 Milestone Achievement!`,
    message: `Congratulations ${customerName}! You've reached the ${milestone} milestone. Keep up the great visits!`,
    type: 'milestone',
    category: 'milestone',
    action_url: '/customer/loyalty',
    action_text: 'View Loyalty',
    metadata: {
      customer_name: customerName,
      milestone: milestone
    }
  });
}

export async function createLowInventoryNotification(itemName: string, currentStock: number, threshold: number): Promise<void> {
  const supabase = getSupabase();
  // Get all admin users
  const { data: admins } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('role', 'admin');

  if (!admins) return;

  // Create notifications for all admins
  for (const admin of admins) {
    await createNotification({
      user_id: admin.user_id,
      title: '⚠️ Low Inventory Alert',
      message: `${itemName} is running low (${currentStock}/${threshold}). Please restock soon.`,
      type: 'warning',
      category: 'inventory',
      action_url: '/inventory',
      action_text: 'View Inventory',
      metadata: { 
        item_name: itemName, 
        quantity: currentStock, 
        threshold 
      }
    });
  }
}

export async function createEventNotificationForCustomers(eventData: {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  location?: string;
}): Promise<void> {
  try {
    const supabase = getSupabase();
    const { data: customers } = await supabase
      .from('customers')
      .select('profile_id')
      .not('profile_id', 'is', null);

    if (!customers?.length) return;

    const profileIds = [
      ...new Set(
        customers.map((c) => c.profile_id).filter((id): id is string => Boolean(id))
      ),
    ];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id')
      .in('id', profileIds)
      .not('user_id', 'is', null);

    const authUserIds = [
      ...new Set(
        (profiles ?? [])
          .map((p) => p.user_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    if (authUserIds.length === 0) return;

    const notifications = authUserIds.map((userId) => ({
      user_id: userId,
      title: `🎉 New Event: ${eventData.title}`,
      message: `A new event "${eventData.title}" has been added! It's happening on ${new Date(eventData.event_date).toLocaleDateString()} at ${eventData.start_time}${eventData.location ? ` at ${eventData.location}` : ''}.`,
      type: 'info' as const,
      category: 'event' as const,
      is_read: false,
      action_url: '/customer/events',
      action_text: 'View Event Details',
      metadata: {
        event_id: eventData.id,
        event_date: eventData.event_date,
        is_new_event: true,
      },
    }));

    const { error } = await supabase.from('notifications').insert(notifications);

    if (error) {
      console.error('Error creating event notifications for customers:', error);
    } else {
      console.log(`Created ${notifications.length} event notifications for customers`);
    }
  } catch (error) {
    console.error('Error creating event notifications for customers:', error);
  }
}

// =====================================================
// TEMPLATE AND SETTINGS FUNCTIONS
// =====================================================

export async function getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notification templates:', error);
    throw new Error('Failed to fetch notification templates');
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    title_template: row.title_template as string,
    message_template: row.message_template as string,
    type: row.type as NotificationTemplate['type'],
    category: row.category as NotificationTemplate['category'],
    variables: (row.variables as string[]) ?? [],
    enabled: row.is_active === true,
    created_at: row.created_at as string,
  }));
}

export async function createNotificationFromTemplate(
  templateId: string,
  userId: string,
  variables: Record<string, string>
): Promise<Notification> {
  const supabase = getSupabase();
  const { data: template, error: templateError } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    throw new Error('Template not found');
  }

  let title = template.title_template;
  let message = template.message_template;

  // Replace variables in templates
  Object.entries(variables).forEach(([key, value]) => {
    title = title.replace(`{{${key}}}`, value);
    message = message.replace(`{{${key}}}`, value);
  });

  return createNotification({
    user_id: userId,
    title,
    message,
    type: template.type,
    category: template.category,
    metadata: { template_id: templateId, variables }
  });
}

function buildDefaultNotificationSettings(userId: string): NotificationSettings {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    notification_types: {
      birthday: true,
      reward: true,
      visit: true,
      milestone: true,
      system: true,
      task: true,
      event: true,
      inventory: true,
      promotion: true,
    },
    quiet_hours: {
      enabled: false,
      start_time: '22:00',
      end_time: '08:00',
    },
    created_at: now,
    updated_at: now,
  };
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
    const supabase = getSupabase();
    const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return buildDefaultNotificationSettings(userId);
  }

  const defaults = buildDefaultNotificationSettings(userId);
  const appPrefs = (data.app_preferences || {}) as Partial<{
    notification_types: NotificationSettings['notification_types'];
    quiet_hours: NotificationSettings['quiet_hours'];
  }>;

  return {
    user_id: data.user_id,
    email_notifications: data.email_notifications ?? defaults.email_notifications,
    push_notifications: data.push_notifications ?? defaults.push_notifications,
    sms_notifications: data.sms_notifications ?? defaults.sms_notifications,
    notification_types: {
      ...defaults.notification_types,
      ...(appPrefs.notification_types || {}),
    },
    quiet_hours: {
      ...defaults.quiet_hours,
      ...(appPrefs.quiet_hours || {}),
    },
    created_at: data.created_at ?? defaults.created_at,
    updated_at: data.updated_at ?? defaults.updated_at,
  };
}

export async function updateNotificationSettings(
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const prevPrefs =
      (existing?.app_preferences || {}) as Record<string, unknown>;
    const nextAppPrefs = { ...prevPrefs };

    if (settings.notification_types) {
      nextAppPrefs.notification_types = settings.notification_types;
    }
    if (settings.quiet_hours) {
      nextAppPrefs.quiet_hours = settings.quiet_hours;
    }

    const payload: Record<string, unknown> = {
      user_id: userId,
      app_preferences: nextAppPrefs,
      updated_at: new Date().toISOString(),
    };

    if (settings.email_notifications !== undefined) {
      payload.email_notifications = settings.email_notifications;
    }
    if (settings.push_notifications !== undefined) {
      payload.push_notifications = settings.push_notifications;
    }
    if (settings.sms_notifications !== undefined) {
      payload.sms_notifications = settings.sms_notifications;
    }

    const { data, error } = await supabase
    .from('notification_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error updating notification settings:', error);
    throw new Error('Failed to update notification settings');
  }

  return getNotificationSettings(data.user_id);
}

// =====================================================
// ANALYTICS AND UTILITY FUNCTIONS
// =====================================================

export async function getNotificationAnalytics(userId?: string): Promise<{
  total_notifications: number;
  unread_notifications: number;
  notifications_by_type: Array<{ type: string; count: number }>;
  notifications_by_category: Array<{ category: string; count: number }>;
  read_rate: number;
}> {
  const supabase = getSupabase();
  let query = supabase
    .from('notifications')
    .select('*');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notification analytics:', error);
    throw new Error('Failed to fetch notification analytics');
  }

  const notifications = data || [];
  const total = notifications.length;
  const unread = notifications.filter(n => !n.is_read).length;
  const read_rate = total > 0 ? ((total - unread) / total) * 100 : 0;

  // Group by type
  const byType = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by category
  const byCategory = notifications.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total_notifications: total,
    unread_notifications: unread,
    notifications_by_type: Object.entries(byType).map(([type, count]) => ({ type, count: count as number })),
    notifications_by_category: Object.entries(byCategory).map(([category, count]) => ({ category, count: count as number })),
    read_rate
  };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread notification count:', error);
    throw new Error('Failed to fetch unread notification count');
  }

  return count || 0;
}

export async function cleanupExpiredNotifications(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('notifications')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error cleaning up expired notifications:', error);
    throw new Error('Failed to cleanup expired notifications');
  }
}

export function shouldSendNotification(userId: string, settings: NotificationSettings): boolean {
  void userId;
  // Check if quiet hours are enabled
  if (settings.quiet_hours.enabled) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = parseInt(settings.quiet_hours.start_time.split(':')[0]) * 60 + 
                     parseInt(settings.quiet_hours.start_time.split(':')[1]);
    const endTime = parseInt(settings.quiet_hours.end_time.split(':')[0]) * 60 + 
                   parseInt(settings.quiet_hours.end_time.split(':')[1]);

    if (startTime <= endTime) {
      // Same day (e.g., 22:00 to 08:00)
      if (currentTime >= startTime || currentTime <= endTime) {
        return false;
      }
    } else {
      // Overnight (e.g., 22:00 to 08:00)
      if (currentTime >= startTime || currentTime <= endTime) {
        return false;
      }
    }
  }

  return true;
} 