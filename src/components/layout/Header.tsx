"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { getTwoFactorStatus } from "@/lib/auth"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { useAuth } from "@/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"

// Initialize Supabase client for user profile operations
const supabase = createClient()

// Header component with user profile, 2FA status, and navigation controls
export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile data from database
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, role')
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Load 2FA status when user is available
  useEffect(() => {
    if (!loading && user) {
      loadTwoFactorStatus();
    }
     
  }, [user, loading]);

  // Fetch profile when user changes
  useEffect(() => {
    fetchProfile();
  }, [user, fetchProfile]);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    // Listen for custom events when profile is updated
    window.addEventListener('profile-updated', handleProfileUpdate);
    
    // Also listen for storage changes (in case profile is updated via localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'profile-updated') {
        fetchProfile();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, fetchProfile]);

  // Load two-factor authentication status
  const loadTwoFactorStatus = async () => {
    try {
      const status = await getTwoFactorStatus()
      setTwoFactorEnabled(status.enabled)
    } catch (error) {
      console.error('Failed to load 2FA status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle user logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      toast.success('Logged out successfully')
    } catch {
      toast.error('Failed to logout')
    }
  }

  // Generate time-based greeting message
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-background border-b border-border flex items-center px-4 sm:px-6">
      {/* Mobile hamburger menu button */}
      {onMenuClick ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden flex-shrink-0"
          aria-label="Open menu"
        >
          Menu
        </Button>
      ) : (
        <div className="w-9 lg:hidden flex-shrink-0" />
      )}

      {/* Dynamic greeting with user name */}
      <div className="flex-1 min-w-0 px-2 sm:px-0">
        <div className="font-semibold text-base sm:text-lg text-foreground truncate">
          {profileLoading ? (
            <span>Urban Lounge CRM</span>
          ) : (
            <span>
              {getGreeting()}
              {profile?.first_name ? `, ${profile.first_name}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Right side controls and user menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Two-factor authentication status indicator */}
        {!loading && (
          <div className="hidden sm:flex items-center">
            {twoFactorEnabled ? (
              <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs border-0">
                2FA
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                No 2FA
              </Badge>
            )}
          </div>
        )}

        {/* Notification bell with reminders */}
        <NotificationBell />

        {/* Theme toggle for dark/light mode */}
        <ThemeToggle />

        {/* User dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              aria-label="User menu"
              className="flex-shrink-0"
            >
              User
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => router.push('/profile')}
              className="cursor-pointer"
            >
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
} 