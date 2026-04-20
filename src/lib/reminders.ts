import { createClient } from '@/utils/supabase/client';

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// =====================================================
// REMINDER SYSTEM
// =====================================================

export interface TaskReminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assigned_to: string;
  category: 'inventory' | 'cleaning' | 'maintenance' | 'customer_service' | 'marketing' | 'admin';
}

export interface EventReminder {
  id: string;
  title: string;
  description: string;
  event_date: string; // Database uses event_date
  location?: string;
  max_capacity?: number; // Database uses max_capacity
  price?: number;
  is_active?: boolean; // Database uses is_active
  status?: 'draft' | 'published' | 'cancelled'; // Frontend status mapping
  created_by?: string;
}

export interface PromotionReminder {
  id: string;
  name: string;
  description: string;
  discount_percentage: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'expired';
  target_audience: 'all' | 'vip' | 'new_customers' | 'returning_customers';
}

export interface CustomerReminder {
  id: string;
  customer_id: string;
  customer_name: string;
  type: 'birthday' | 'reward' | 'visit_milestone' | 'promotion' | 'event_invitation';
  title: string;
  message: string;
  action_url: string;
  action_text: string;
  expires_at?: string;
}

// =====================================================
// REMINDER FUNCTIONS FOR BAR USERS
// =====================================================

export async function getTodayTasks(userId: string): Promise<TaskReminder[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles!tasks_assigned_to_fkey(name, role)
      `)
      .eq('assigned_to', userId)
      .eq('due_date::date', new Date().toISOString().split('T')[0])
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching today tasks:', error);
      throw new Error('Failed to fetch today tasks');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTodayTasks:', error);
    throw error;
  }
}

export async function getOverdueTasks(userId: string): Promise<TaskReminder[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles!tasks_assigned_to_fkey(name, role)
      `)
      .eq('assigned_to', userId)
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching overdue tasks:', error);
      throw new Error('Failed to fetch overdue tasks');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getOverdueTasks:', error);
    throw error;
  }
}

export async function getUpcomingTasks(userId: string, days: number = 7): Promise<TaskReminder[]> {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles!tasks_assigned_to_fkey(name, role)
      `)
      .eq('assigned_to', userId)
      .gte('due_date', new Date().toISOString())
      .lte('due_date', endDate.toISOString())
      .neq('status', 'completed')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming tasks:', error);
      throw new Error('Failed to fetch upcoming tasks');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUpcomingTasks:', error);
    throw error;
  }
}

export async function getTodayEvents(): Promise<EventReminder[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('date::date', new Date().toISOString().split('T')[0])
      .eq('status', 'published')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching today events:', error);
      throw new Error('Failed to fetch today events');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTodayEvents:', error);
    throw error;
  }
}

export async function getUpcomingEvents(days: number = 7): Promise<EventReminder[]> {
  try {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', new Date().toISOString())
      .lte('date', endDate.toISOString())
      .eq('status', 'published')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUpcomingEvents:', error);
    throw error;
  }
}

export async function getInventoryAlerts(): Promise<any[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .lt('quantity', 'threshold')
      .order('quantity', { ascending: true });

    if (error) {
      console.error('Error fetching inventory alerts:', error);
      throw new Error('Failed to fetch inventory alerts');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getInventoryAlerts:', error);
    throw error;
  }
}

export async function getStaffReminders(userId: string): Promise<{
  todayTasks: TaskReminder[];
  overdueTasks: TaskReminder[];
  upcomingTasks: TaskReminder[];
  todayEvents: EventReminder[];
  upcomingEvents: EventReminder[];
  inventoryAlerts: any[];
}> {
  try {
    const [
      todayTasks,
      overdueTasks,
      upcomingTasks,
      todayEvents,
      upcomingEvents,
      inventoryAlerts
    ] = await Promise.all([
      getTodayTasks(userId),
      getOverdueTasks(userId),
      getUpcomingTasks(userId),
      getTodayEvents(),
      getUpcomingEvents(),
      getInventoryAlerts()
    ]);

    return {
      todayTasks,
      overdueTasks,
      upcomingTasks,
      todayEvents,
      upcomingEvents,
      inventoryAlerts
    };
  } catch (error) {
    console.error('Error in getStaffReminders:', error);
    throw error;
  }
}

// =====================================================
// REMINDER FUNCTIONS FOR CUSTOMERS
// =====================================================

export async function getCustomerBirthdayReminders(): Promise<CustomerReminder[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        date_of_birth,
        user_id
      `)
      .eq('EXTRACT(MONTH FROM date_of_birth)', new Date().getMonth() + 1)
      .eq('EXTRACT(DAY FROM date_of_birth)', new Date().getDate());

    if (error) {
      console.error('Error fetching birthday reminders:', error);
      throw new Error('Failed to fetch birthday reminders');
    }

    return (data || []).map(customer => ({
      id: `birthday-${customer.id}`,
      customer_id: customer.id,
      customer_name: customer.name,
      type: 'birthday' as const,
      title: 'Happy Birthday! 🎂',
      message: `Happy Birthday, ${customer.name}! Come celebrate with us and enjoy a special birthday treat!`,
      action_url: '/customer/rewards',
      action_text: 'Claim Birthday Reward'
    }));
  } catch (error) {
    console.error('Error in getCustomerBirthdayReminders:', error);
    throw error;
  }
}

export async function getCustomerRewardReminders(customerId: string): Promise<CustomerReminder[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('enhanced_rewards')
      .select(`
        id,
        type,
        value,
        description,
        expires_at
      `)
      .eq('customer_id', customerId)
      .eq('claimed', false)
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (error) {
      console.error('Error fetching reward reminders:', error);
      throw new Error('Failed to fetch reward reminders');
    }

    return (data || []).map(reward => ({
      id: `reward-${reward.id}`,
      customer_id: customerId,
      customer_name: '', // Will be filled by caller
      type: 'reward' as const,
      title: 'Reward Available! 🎁',
      message: `You have a ${reward.type} reward worth €${reward.value} waiting for you!`,
      action_url: '/customer/rewards',
      action_text: 'Claim Reward',
      expires_at: reward.expires_at
    }));
  } catch (error) {
    console.error('Error in getCustomerRewardReminders:', error);
    throw error;
  }
}

export async function getCustomerPromotionReminders(): Promise<CustomerReminder[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .lte('end_date', new Date().toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching promotion reminders:', error);
      throw new Error('Failed to fetch promotion reminders');
    }

    return (data || []).map(promotion => ({
      id: `promotion-${promotion.id}`,
      customer_id: '', // Will be filled by caller
      customer_name: '', // Will be filled by caller
      type: 'promotion' as const,
      title: `Special Offer: ${promotion.name}`,
      message: `Limited time offer: ${promotion.description} - ${promotion.discount_percentage}% off!`,
      action_url: '/customer/promotions',
      action_text: 'View Offer',
      expires_at: promotion.end_date
    }));
  } catch (error) {
    console.error('Error in getCustomerPromotionReminders:', error);
    throw error;
  }
}

export async function getCustomerEventReminders(): Promise<CustomerReminder[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('date', new Date().toISOString())
      .lte('date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching event reminders:', error);
      throw new Error('Failed to fetch event reminders');
    }

    return (data || []).map(event => ({
      id: `event-${event.id}`,
      customer_id: '', // Will be filled by caller
      customer_name: '', // Will be filled by caller
      type: 'event_invitation' as const,
      title: `Event: ${event.title}`,
      message: `Join us for ${event.title} on ${new Date(event.event_date).toLocaleDateString()}!`,
      action_url: `/customer/events/${event.id}`,
      action_text: 'View Event',
      expires_at: event.event_date
    }));
  } catch (error) {
    console.error('Error in getCustomerEventReminders:', error);
    throw error;
  }
}

export async function getCustomerReminders(customerId: string): Promise<{
  birthdayReminders: CustomerReminder[];
  rewardReminders: CustomerReminder[];
  promotionReminders: CustomerReminder[];
  eventReminders: CustomerReminder[];
}> {
  try {
    const [
      birthdayReminders,
      rewardReminders,
      promotionReminders,
      eventReminders
    ] = await Promise.all([
      getCustomerBirthdayReminders(),
      getCustomerRewardReminders(customerId),
      getCustomerPromotionReminders(),
      getCustomerEventReminders()
    ]);

    return {
      birthdayReminders,
      rewardReminders,
      promotionReminders,
      eventReminders
    };
  } catch (error) {
    console.error('Error in getCustomerReminders:', error);
    throw error;
  }
}

// =====================================================
// NOTIFICATION INTEGRATION
// =====================================================

export async function createTaskNotification(task: TaskReminder, userId: string): Promise<void> {
  try {
    const { createNotification } = await import('@/lib/notifications');
    
    const priorityColors = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴'
    };

    await createNotification({
      user_id: userId,
      title: `${priorityColors[task.priority]} Task Due: ${task.title}`,
      message: task.description,
      type: task.priority === 'urgent' ? 'error' : 'warning',
      category: 'alert',
      action_url: `/tasks/${task.id}`,
      action_text: 'View Task',
      metadata: {
        task_id: task.id,
        priority: task.priority,
        due_date: task.due_date
      }
    });
  } catch (error) {
    console.error('Error creating task notification:', error);
  }
}

export async function createEventNotification(event: EventReminder, userId: string): Promise<void> {
  try {
    const { createNotification } = await import('@/lib/notifications');
    
    await createNotification({
      user_id: userId,
      title: `📅 Event Today: ${event.title}`,
      message: `Event "${event.title}" is happening today at ${new Date(event.event_date).toLocaleTimeString()}`,
      type: 'info',
      category: 'system',
      action_url: `/events/${event.id}`,
      action_text: 'View Event',
      metadata: {
        event_id: event.id,
        date: event.event_date,
        max_capacity: event.max_capacity
      }
    });
  } catch (error) {
    console.error('Error creating event notification:', error);
  }
}

export async function createCustomerNotification(reminder: CustomerReminder): Promise<void> {
  try {
    const { createNotification } = await import('@/lib/notifications');
    
    await createNotification({
      user_id: reminder.customer_id,
      title: reminder.title,
      message: reminder.message,
      type: reminder.type === 'birthday' ? 'birthday' : 'info',
      category: reminder.type === 'birthday' ? 'birthday' : 'customer',
      action_url: reminder.action_url,
      action_text: reminder.action_text,
      expires_at: reminder.expires_at,
      metadata: {
        reminder_type: reminder.type,
        customer_id: reminder.customer_id
      }
    });
  } catch (error) {
    console.error('Error creating customer notification:', error);
  }
}

// =====================================================
// AUTOMATED REMINDER SYSTEM
// =====================================================

export async function processDailyReminders(): Promise<void> {
  try {
    const supabase = getSupabase();
    // Get all staff members
    const { data: staffMembers, error: staffError } = await supabase
      .from('profiles')
      .select('user_id, role')
      .in('role', ['admin', 'staff']);

    if (staffError) {
      console.error('Error fetching staff members:', staffError);
      return;
    }

    // Process reminders for each staff member
    for (const staff of staffMembers || []) {
      try {
        const reminders = await getStaffReminders(staff.user_id);
        
        // Create notifications for today's tasks
        for (const task of reminders.todayTasks) {
          await createTaskNotification(task, staff.user_id);
        }

        // Create notifications for overdue tasks
        for (const task of reminders.overdueTasks) {
          await createTaskNotification(task, staff.user_id);
        }

        // Create notifications for today's events
        for (const event of reminders.todayEvents) {
          await createEventNotification(event, staff.user_id);
        }

        // Create inventory alerts for admins
        if (staff.role === 'admin' && reminders.inventoryAlerts.length > 0) {
          for (const item of reminders.inventoryAlerts) {
            const { createNotification } = await import('@/lib/notifications');
            await createNotification({
              user_id: staff.user_id,
              title: '⚠️ Low Inventory Alert',
              message: `${item.item_name} is running low (${item.quantity}/${item.threshold})`,
              type: 'warning',
              category: 'alert',
              action_url: `/inventory/${item.id}`,
              action_text: 'View Item'
            });
          }
        }
      } catch (error) {
        console.error(`Error processing reminders for staff ${staff.user_id}:`, error);
      }
    }

    // Process customer reminders
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, user_id, name');

    if (customerError) {
      console.error('Error fetching customers:', customerError);
      return;
    }

    for (const customer of customers || []) {
      try {
        const customerReminders = await getCustomerReminders(customer.id);
        
        // Create birthday notifications
        for (const reminder of customerReminders.birthdayReminders) {
          if (reminder.customer_id === customer.id) {
            reminder.customer_name = customer.name;
            await createCustomerNotification(reminder);
          }
        }

        // Create reward notifications
        for (const reminder of customerReminders.rewardReminders) {
          reminder.customer_name = customer.name;
          await createCustomerNotification(reminder);
        }

        // Create promotion notifications
        for (const reminder of customerReminders.promotionReminders) {
          reminder.customer_id = customer.id;
          reminder.customer_name = customer.name;
          await createCustomerNotification(reminder);
        }

        // Create event notifications
        for (const reminder of customerReminders.eventReminders) {
          reminder.customer_id = customer.id;
          reminder.customer_name = customer.name;
          await createCustomerNotification(reminder);
        }
      } catch (error) {
        console.error(`Error processing reminders for customer ${customer.id}:`, error);
      }
    }

  
  } catch (error) {
    console.error('Error processing daily reminders:', error);
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'low': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'high': return 'text-orange-600 bg-orange-100';
    case 'urgent': return 'text-red-600 bg-red-100';
    default: return 'text-muted-foreground bg-muted';
  }
}

export function getPriorityIcon(priority: string): string {
  switch (priority) {
    case 'low': return '🟢';
    case 'medium': return '🟡';
    case 'high': return '🟠';
    case 'urgent': return '🔴';
    default: return '⚪';
  }
}

export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else {
    return `Due in ${diffDays} days`;
  }
} 