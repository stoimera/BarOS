"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Summary = {
  date: string
  bookings_today: number
  open_orders: number
  waitlist_waiting: number
  oldest_open_order_minutes?: number | null
}

export default function OperationsOccupancyPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/operations/occupancy/summary", { cache: "no-store" })
        const json = (await res.json()) as { data?: Summary; error?: string }
        if (!res.ok) throw new Error(json.error || "Failed")
        setData(json.data ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Occupancy snapshot</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Today&apos;s bookings, open tabs, and the waitlist in one glance. Oldest open tab shows how long a party has
          been waiting to turn.
        </p>
      </div>
      {error ? <p className="text-red-600 text-sm">{error}</p> : null}
      {data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Bookings today", value: data.bookings_today },
            { label: "Open / active orders", value: data.open_orders },
            { label: "Waitlist waiting", value: data.waitlist_waiting },
            {
              label: "Oldest open order (min)",
              value: data.oldest_open_order_minutes ?? "—",
            },
          ].map((c) => (
            <Card key={c.label}>
              <CardHeader>
                <CardTitle className="text-base">{c.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{c.value}</p>
                <p className="text-muted-foreground mt-1 text-xs">{data.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !error ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : null}
    </div>
  )
}
