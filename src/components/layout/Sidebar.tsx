"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useUserRole } from "@/hooks/useUserRole"

interface NavItem {
  label: string
  href: string
  role?: 'admin' | 'staff'
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Customers", href: "/customers", role: "staff" },
  { label: "Visit Tracking", href: "/visits" },
  { label: "Events", href: "/events" },
  { label: "Event Templates", href: "/event-templates" },
  { label: "Bookings", href: "/bookings" },
  { label: "Inventory", href: "/inventory" },
  { label: "Menu Management", href: "/menu-management" },
  { label: "Rewards", href: "/rewards" },
  { label: "Calendar", href: "/calendar" },
  { label: "Tasks", href: "/tasks" },
  { label: "Marketing", href: "/marketing" },
  { label: "Socials", href: "/socials" },
  { label: "Analytics", href: "/analytics" },
  { label: "Schedule", href: "/schedule" },
  { label: "Staff Management", href: "/staff", role: "admin" },
  {
    label: "Administrative Operations",
    href: "/operations",
    role: "staff",
    children: [
      { label: "Overview", href: "/operations", role: "staff" },
      { label: "Kitchen screen", href: "/operations/kds", role: "staff" },
      { label: "Bar screen", href: "/operations/bds", role: "staff" },
      { label: "How busy we are", href: "/operations/occupancy", role: "staff" },
      { label: "Shift checklists", href: "/operations/checklists", role: "staff" },
      { label: "Integrations", href: "/operations/integrations", role: "staff" },
      { label: "Checkout", href: "/operations/checkout", role: "staff" },
      { label: "Receipts", href: "/operations/receipts", role: "staff" },
      { label: "Gift cards", href: "/operations/gift-cards", role: "staff" },
      { label: "Memberships", href: "/operations/memberships", role: "staff" },
      { label: "Reviews", href: "/feedback", role: "staff" },
      { label: "Offline sync", href: "/operations/offline-sync", role: "staff" },
      { label: "Happy hour & pricing", href: "/operations/pricing", role: "staff" },
      { label: "Menu & 86’d items", href: "/operations/menu-engineering", role: "staff" },
      { label: "Tables & floors", href: "/operations/tables", role: "staff" },
      { label: "Orders & payments", href: "/operations/orders", role: "staff" },
      { label: "Marketing consent", href: "/operations/consents", role: "staff" },
      { label: "Suppliers & orders", href: "/operations/procurement", role: "staff" },
      { label: "Stock & waste", href: "/operations/stock-control", role: "staff" },
      { label: "Clock-in & timesheets", href: "/operations/staff-time", role: "staff" },
      { label: "Event tickets", href: "/operations/event-commerce", role: "staff" },
      { label: "Locations", href: "/operations/locations", role: "staff" },
    ],
  },
  { label: "Profile", href: "/profile" },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { role } = useUserRole()

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState))
    }
  }, [])

  const canAccessByRole = (item: NavItem) => {
    // If the item has no role requirement, show it to everyone
    if (!item.role) return true
    
    // If the item requires admin role, only show to admins
    if (item.role === 'admin') {
      return role === 'admin'
    }
    
    // If the item requires staff role, show to staff and admins
    if (item.role === 'staff') {
      return role === 'staff' || role === 'admin'
    }
    
    return true
  }

  // Filter navigation items based on user role
  const filteredNavItems = navItems
    .filter((item) => canAccessByRole(item))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => canAccessByRole(child)),
    }))

  // Save collapsed state to localStorage when it changes
  const toggleCollapsed = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('sidebar-toggle'))
  }

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          aria-label="Open sidebar"
          onClick={() => setOpen(true)}
        >
          Menu
        </Button>
      </div>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Sidebar overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-200",
          collapsed ? "w-16" : "w-64",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Toggle button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          {!collapsed && (
            <span className="font-semibold text-base text-sidebar-foreground">Menu</span>
          )}
          <div className="flex items-center gap-2">
            {/* Desktop toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleCollapsed}
            >
              {collapsed ? "→" : "←"}
            </Button>
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label="Close sidebar"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" role="navigation" aria-label="Main navigation">
          {filteredNavItems.map(({ label, href, children }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/")
            
            return (
              <div key={href} className="space-y-1">
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-sidebar-foreground transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-sidebar-ring focus:ring-offset-2",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                      : ""
                  )}
                  tabIndex={0}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    setOpen(false)
                  }}
                  title={collapsed ? label : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setOpen(false)
                      router.push(href)
                    }
                  }}
                >
                  <span className={cn(
                    "transition-opacity duration-200",
                    collapsed ? "opacity-0 absolute left-full ml-2 bg-popover text-popover-foreground px-2 py-1 rounded text-sm whitespace-nowrap shadow-sm border border-border group-hover:opacity-100 z-50" : "opacity-100"
                  )}>
                    {label}
                  </span>
                </Link>

                {!collapsed &&
                  children &&
                  children.length > 0 &&
                  (pathname === href || pathname.startsWith(`${href}/`)) && (
                  <div className="ml-3 space-y-1 border-l border-sidebar-border pl-3">
                    {children.map((child) => {
                      const isChildActive = pathname === child.href || pathname.startsWith(child.href + "/")
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-3 py-1.5 rounded text-xs font-medium text-sidebar-foreground transition-colors",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isChildActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : ""
                          )}
                          aria-current={isChildActive ? "page" : undefined}
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
} 