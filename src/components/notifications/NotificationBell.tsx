"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  getTaskReminders,
  getEventReminders,
  getInventoryReminders,
  getPromotionReminders,
  Notification 
} from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [taskReminders, setTaskReminders] = useState<Notification[]>([]);
  const [eventReminders, setEventReminders] = useState<Notification[]>([]);
  const [inventoryReminders, setInventoryReminders] = useState<Notification[]>([]);
  const [promotionReminders, setPromotionReminders] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Check if user is a customer by checking their role in user_metadata
  const [isCustomer, setIsCustomer] = useState(false);
  
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsCustomer(false);
        return;
      }
      
      try {
        // First try to get role from user_metadata (faster)
        const userRole = user.user_metadata?.role;
        
        if (userRole) {
          // User is a customer if they have 'customer' role
          setIsCustomer(userRole === 'customer');
          return;
        }
        
        // Fallback: try to fetch from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        // User is a customer if they have 'customer' role or no profile (default to customer)
        setIsCustomer(!profile || profile.role === 'customer');
      } catch (error) {
        console.error('Error checking user role:', error);
        // Default to customer if there's an error
        setIsCustomer(true);
      }
    };
    
    checkUserRole();
  }, [user, supabase]);

  const loadAllNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load all types of notifications in parallel
      const [generalNotifications, tasks, events, inventory, promotions] = await Promise.all([
        getNotifications({ user_id: user.id, limit: 20 }),
        getTaskReminders(user.id),
        getEventReminders(user.id),
        getInventoryReminders(user.id),
        getPromotionReminders(user.id)
      ]);

      console.log('Loaded notifications:', {
        general: generalNotifications.length,
        tasks: tasks.length,
        events: events.length,
        inventory: inventory.length,
        promotions: promotions.length
      });

      // Log event notifications for debugging
      if (events.length > 0) {
        console.log('Event notifications:', events);
      }

      setNotifications(generalNotifications);
      setTaskReminders(tasks);
      setEventReminders(events);
      setInventoryReminders(inventory);
      setPromotionReminders(promotions);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setTaskReminders([]);
      setEventReminders([]);
      setInventoryReminders([]);
      setPromotionReminders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const count = await getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadAllNotifications();
      void loadUnreadCount();
    }
  }, [user, loadAllNotifications, loadUnreadCount]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Check if this is a dynamic event notification
      const notification = [...notifications, ...taskReminders, ...eventReminders, ...inventoryReminders, ...promotionReminders]
        .find(n => n.id === notificationId);
      
      if (notification?.metadata?.is_dynamic) {
        // For dynamic notifications, just mark as read locally (they'll be regenerated on next load)
        const updateNotification = (notif: Notification) => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif;
        
        setNotifications(notifications.map(updateNotification));
        setTaskReminders(taskReminders.map(updateNotification));
        setEventReminders(eventReminders.map(updateNotification));
        setInventoryReminders(inventoryReminders.map(updateNotification));
        setPromotionReminders(promotionReminders.map(updateNotification));
        
        setUnreadCount(Math.max(0, unreadCount - 1));
        toast.success('Notification marked as read');
      } else {
        // For stored notifications, update in database
        await markNotificationAsRead(notificationId);
        
        // Update all notification lists
        const updateNotification = (notif: Notification) => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif;
        
        setNotifications(notifications.map(updateNotification));
        setTaskReminders(taskReminders.map(updateNotification));
        setEventReminders(eventReminders.map(updateNotification));
        setInventoryReminders(inventoryReminders.map(updateNotification));
        setPromotionReminders(promotionReminders.map(updateNotification));
        
        setUnreadCount(Math.max(0, unreadCount - 1));
        toast.success('Notification marked as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      // Mark all stored notifications as read in database
      await markAllNotificationsAsRead(user.id);
      
      // Mark all notifications (including dynamic ones) as read locally
      const markAllAsRead = (notifs: Notification[]) => 
        notifs.map(n => ({ ...n, is_read: true }));
      
      setNotifications(markAllAsRead(notifications));
      setTaskReminders(markAllAsRead(taskReminders));
      setEventReminders(markAllAsRead(eventReminders));
      setInventoryReminders(markAllAsRead(inventoryReminders));
      setPromotionReminders(markAllAsRead(promotionReminders));
      
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      // Check if this is a dynamic event notification
      const notification = [...notifications, ...taskReminders, ...eventReminders, ...inventoryReminders, ...promotionReminders]
        .find(n => n.id === notificationId);
      
      if (notification?.metadata?.is_dynamic) {
        // For dynamic notifications, just remove locally (they'll be regenerated on next load)
        const removeNotification = (notifs: Notification[]) => 
          notifs.filter(n => n.id !== notificationId);
        
        setNotifications(removeNotification(notifications));
        setTaskReminders(removeNotification(taskReminders));
        setEventReminders(removeNotification(eventReminders));
        setInventoryReminders(removeNotification(inventoryReminders));
        setPromotionReminders(removeNotification(promotionReminders));
        
        // Update unread count if notification was unread
        if (notification && !notification.is_read) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
        
        toast.success('Notification dismissed');
      } else {
        // For stored notifications, delete from database
        await deleteNotification(notificationId);
        
        const removeNotification = (notifs: Notification[]) => 
          notifs.filter(n => n.id !== notificationId);
        
        setNotifications(removeNotification(notifications));
        setTaskReminders(removeNotification(taskReminders));
        setEventReminders(removeNotification(eventReminders));
        setInventoryReminders(removeNotification(inventoryReminders));
        setPromotionReminders(removeNotification(promotionReminders));
        
        // Update unread count if notification was unread
        if (notification && !notification.is_read) {
          setUnreadCount(Math.max(0, unreadCount - 1));
        }
        
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: Notification['type'], category: Notification['category']) => {
    switch (category) {
      case 'task': return '📋';
      case 'event': return '📅';
      case 'inventory': return '📦';
      case 'promotion': return '🎁';
      case 'reward': return '🎁';
      case 'birthday': return '🎂';
      case 'milestone': return '🏆';
      case 'visit': return '👥';
      default:
        switch (type) {
          case 'warning': return '⚠️';
          case 'error': return '❌';
          case 'success': return '✅';
          default: return 'ℹ️';
        }
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    
    setOpen(false);
  };

  const getActiveNotifications = () => {
    switch (activeTab) {
      case 'tasks': return taskReminders;
      case 'events': return eventReminders;
      case 'inventory': return inventoryReminders;
      case 'promotions': return promotionReminders;
      default: return notifications;
    }
  };

  const getTabCount = (tab: string) => {
    const countWithReadFallback = (items: Notification[]) => {
      const unread = items.filter((n) => !n.is_read).length;
      return unread > 0 ? unread : items.length;
    };

    switch (tab) {
      case 'all': return countWithReadFallback(notifications);
      case 'tasks': return countWithReadFallback(taskReminders);
      case 'events': return countWithReadFallback(eventReminders);
      case 'inventory': return countWithReadFallback(inventoryReminders);
      case 'promotions': return countWithReadFallback(promotionReminders);
      default: return 0;
    }
  };

  if (!user) return null;

  const activeNotifications = getActiveNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative text-foreground hover:bg-muted hover:text-foreground">
          Notifications
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600 text-white hover:bg-blue-700"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-card border-border" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications & Reminders</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${isCustomer ? 'grid-cols-3' : 'grid-cols-5'}`}>
            <TabsTrigger value="all" className="text-xs">
              All
              {getTabCount('all') > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                  {getTabCount('all')}
                </Badge>
              )}
            </TabsTrigger>
            {!isCustomer && (
              <TabsTrigger value="tasks" className="text-xs">
                Tasks
                {getTabCount('tasks') > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                    {getTabCount('tasks')}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="events" className="text-xs">
              Events
              {getTabCount('events') > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                  {getTabCount('events')}
                </Badge>
              )}
            </TabsTrigger>
            {!isCustomer && (
              <TabsTrigger value="inventory" className="text-xs">
                Inventory
                {getTabCount('inventory') > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                    {getTabCount('inventory')}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="promotions" className="text-xs">
              Promotions
              {getTabCount('promotions') > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                  {getTabCount('promotions')}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-80">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
                </div>
              ) : activeNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No {activeTab === 'all' ? 'notifications' : activeTab} at the moment
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {activeNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 cursor-pointer transition-colors border-border",
                        notification.is_read
                          ? "bg-card hover:bg-muted/50"
                          : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/45"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type, notification.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-foreground'}`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                              </span>
                              {notification.action_text && (
                                <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                                  {notification.action_text}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="h-6 w-6 p-0 text-foreground/80 hover:text-foreground hover:bg-muted"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
} 