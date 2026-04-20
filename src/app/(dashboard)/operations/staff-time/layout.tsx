import type { ReactNode } from "react"
import Link from "next/link"

const links = [
  { href: "/operations/staff-time", label: "Clock" },
  { href: "/operations/staff-time/anomalies", label: "Anomalies" },
  { href: "/operations/staff-time/timesheets", label: "Timesheets" },
  { href: "/operations/staff-time/payroll", label: "Payroll" },
]

export default function StaffTimeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
