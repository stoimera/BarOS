import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const modules = [
  { label: "Kitchen screen", href: "/operations/kds", desc: "Tickets for the kitchen line" },
  { label: "Bar screen", href: "/operations/bds", desc: "Tickets for the bar line" },
  { label: "How busy we are", href: "/operations/occupancy", desc: "Bookings, open tabs, and waitlist at a glance" },
  { label: "Shift checklists", href: "/operations/checklists", desc: "Opening, closing, and incident notes" },
  { label: "Integrations", href: "/operations/integrations", desc: "Card, SMS, email, and review integrations" },
  { label: "Checkout", href: "/operations/checkout", desc: "Take payment and close checks" },
  { label: "Receipts", href: "/operations/receipts", desc: "Receipt layout and history" },
  { label: "Gift cards", href: "/operations/gift-cards", desc: "Sell, redeem, and void gift cards" },
  { label: "Memberships", href: "/operations/memberships", desc: "Plans and who is on which plan" },
  { label: "Reviews", href: "/feedback", desc: "Guest ratings and comments" },
  { label: "Offline sync", href: "/operations/offline-sync", desc: "When the network drops, sync sales safely" },
  { label: "Happy hour & pricing", href: "/operations/pricing", desc: "Special prices by day and time" },
  { label: "Menu & 86’d items", href: "/operations/menu-engineering", desc: "Add-ons, links, allergens, and temporarily off items" },
  { label: "Tables & floors", href: "/operations/tables", desc: "Sections, table numbers, and capacity" },
  { label: "Orders & payments", href: "/operations/orders", desc: "Open tabs, lines, tips, splits, and card flow" },
  { label: "Marketing consent", href: "/operations/consents", desc: "Who agreed to marketing and when" },
  { label: "Suppliers & orders", href: "/operations/procurement", desc: "Vendors and incoming deliveries" },
  { label: "Stock & waste", href: "/operations/stock-control", desc: "Counts, variance, and pour-off / waste" },
  { label: "Clock-in & timesheets", href: "/operations/staff-time", desc: "Clock punches and manager approval" },
  { label: "Event tickets", href: "/operations/event-commerce", desc: "Tiers, promos, sales, and door check-in" },
  { label: "Locations", href: "/operations/locations", desc: "Sites and rooms you run" },
  { label: "Who can do what (admin)", href: "/operations/admin/rbac", desc: "Roles and permissions" },
]

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administrative Operations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Day-to-day tools for the floor, bar, stock, and events. Open a card to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="h-full hover:bg-muted/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{module.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{module.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
