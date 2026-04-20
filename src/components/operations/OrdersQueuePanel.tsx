"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type OrderItem = { id?: string; item_name?: string; quantity?: number; station?: string | null }

type OrderRow = { id: string; status?: string; order_items?: OrderItem[] | null }

export type StationFilter = "kitchen" | "bar" | null

const emptyCopy: Record<string, string> = {
  kitchen: "No kitchen tickets right now. Send items to the kitchen from the order screen to see them here.",
  bar: "No bar tickets right now. Send items to the bar from the order screen to see them here.",
}

export function OrdersQueuePanel({
  title,
  description,
  stationFilter,
}: {
  title: string
  description: string
  /** When set, only items routed to kitchen or bar. */
  stationFilter?: StationFilter
}) {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/operations/orders/list", { cache: "no-store" })
        const json = (await res.json()) as { data?: OrderRow[]; error?: string }
        if (!res.ok) throw new Error(json.error || "Failed to load orders")
        const rows = Array.isArray(json.data) ? json.data : []
        setOrders(rows.filter((o) => o.status === "open"))
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  if (loading) return <p className="text-muted-foreground text-sm">Loading queue…</p>
  if (error) return <p className="text-red-600 text-sm">{error}</p>

  const tickets = orders.flatMap((o) =>
    (o.order_items || [])
      .filter((it) => {
        if (!stationFilter) return true
        const s = it.station
        return s === stationFilter
      })
      .map((it) => ({
        orderId: o.id,
        name: it.item_name || "Item",
        qty: it.quantity ?? 1,
      }))
  )

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {stationFilter ? emptyCopy[stationFilter] ?? "Nothing in this queue yet." : "Nothing in this queue yet."}
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {tickets.map((l, i) => (
              <li key={`${l.orderId}-${i}`} className="flex justify-between gap-2 border-b border-border pb-2">
                <span>{l.name}</span>
                <span className="text-muted-foreground">×{l.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
