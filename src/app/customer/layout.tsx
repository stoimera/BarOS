"use client";

import { ReactNode, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "@/components/feedback/LoadingStates";

const navItems = [
  { label: "Dashboard", href: "/customer/dashboard", icon: "Home" },
  { label: "Loyalty", href: "/customer/loyalty", icon: "Star" },
  { label: "Rewards", href: "/customer/rewards", icon: "Gift" },
  { label: "Bookings", href: "/customer/bookings", icon: "Calendar" },
  { label: "Events", href: "/customer/events", icon: "Users" },
  { label: "Menu", href: "/customer/menu", icon: "Utensils" },
  { label: "Socials", href: "/customer/socials", icon: "Users" },
  { label: "Profile", href: "/customer/profile", icon: "User" },
];

import { Home, Star, Gift, Calendar, Users, User, Utensils } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const iconMap = { Home, Star, Gift, Calendar, Users, User, Utensils };

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('customer-sidebar-collapsed');
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Handle authentication
  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to login if not authenticated
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Security check for customer access
  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      if (role && role !== 'customer') {
        console.log('Admin/Staff attempted to access customer dashboard, redirecting to admin dashboard');
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, roleLoading, role, router]);

  // Save collapsed state to localStorage when it changes
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('customer-sidebar-collapsed', JSON.stringify(newState));
    window.dispatchEvent(new Event('customer-sidebar-toggle'));
  };

  // Show loading state while checking authentication
  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show loading state while redirecting
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-screen bg-sidebar border-r z-50 flex flex-col transition-transform duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        "border-t border-border",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header Row */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {!collapsed && <span className="font-bold text-lg text-foreground">Navigation</span>}
          <div className="flex items-center gap-2">
            {/* Desktop toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex h-8 w-8"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapsed}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-foreground dark:text-blue-200" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-foreground dark:text-blue-200" />
              )}
            </Button>
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
        <nav className="flex-1 py-6 px-2 space-y-2" role="navigation" aria-label="Main navigation">
          {navItems.map(({ label, href, icon }) => {
            const Icon = iconMap[icon as keyof typeof iconMap];
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-md font-medium text-foreground transition-colors border-l-4 border-transparent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group relative hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground",
                  (pathname === href || pathname.startsWith(href + "/"))
                    ? "bg-muted border-border text-foreground font-semibold"
                    : "",
                  collapsed ? "justify-center px-2" : ""
                )}
                tabIndex={0}
                aria-current={(pathname === href || pathname.startsWith(href + "/")) ? "page" : undefined}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? label : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSidebarOpen(false);
                  }
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span className={cn(
                  "transition-opacity duration-200",
                  collapsed ? "opacity-0 absolute left-full ml-2 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap group-hover:opacity-100 z-50" : "opacity-100"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div className={cn("flex-1 flex flex-col bg-background", collapsed ? "lg:ml-16" : "lg:ml-64")}>
        {/* Header with Menu Button */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 bg-background">{children}</main>
        <div className="w-full border-t border-border" />
        <Footer />
      </div>
    </div>
  );
} 