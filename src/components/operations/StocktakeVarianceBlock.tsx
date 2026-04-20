"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type VarianceSummaryRow = {
  id: string
  inventory_id: string
  variance: number
  counted_quantity: number
  expected_quantity: number | null
  counted_at: string
  severity: "high" | "low"
}

export function StocktakeVarianceBlock() {
  const [rows, setRows] = useState<VarianceSummaryRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/operations/stocktakes?variance_only=1", { credentials: "include" })
        const json = (await res.json()) as { summary?: VarianceSummaryRow[]; error?: string }
        if (!res.ok) throw new Error(json.error || "Failed to load variance")
        if (!cancelled) setRows(json.summary || [])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Stocktake variance (non-zero)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="text-muted-foreground">No variance rows in recent stocktakes.</p>
        )}
        {!loading && !error && rows.length > 0 && (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {rows.map((r) => (
              <li key={r.id} className="rounded border border-border px-2 py-1.5">
                <span className="font-medium tabular-nums">{r.variance > 0 ? "+" : ""}{r.variance}</span>
                <span className="text-muted-foreground"> · inv {r.inventory_id.slice(0, 8)}…</span>
                <span className="ml-2 text-xs uppercase text-muted-foreground">{r.severity}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
