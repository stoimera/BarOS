"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FloorSection = {
  id: string
  name: string
  location_id?: string | null
}

type VenueTableRow = {
  id: string
  table_number: string
  capacity: number
  is_active?: boolean | null
  section_id?: string | null
  floor_sections?: { id: string; name: string; location_id?: string | null } | null
  open_orders_count?: number
  multi_order_warning?: boolean
}

export function FloorPlanPanel() {
  const { user, loading: authLoading } = useAuth()
  const [tables, setTables] = useState<VenueTableRow[]>([])
  const [sections, setSections] = useState<FloorSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ table_number: "", capacity: "4", section_id: "" })

  const isAdmin = user?.role === "admin"

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [tRes, sRes] = await Promise.all([
        fetch("/api/operations/tables?include_usage=1", { cache: "no-store" }),
        fetch("/api/operations/floor-sections", { cache: "no-store" }),
      ])
      const tJson = (await tRes.json()) as { data?: VenueTableRow[]; error?: string }
      const sJson = (await sRes.json()) as { data?: FloorSection[]; error?: string }
      if (!tRes.ok) throw new Error(tJson.error || "Failed to load tables")
      if (!sRes.ok) throw new Error(sJson.error || "Failed to load floor sections")
      setTables(Array.isArray(tJson.data) ? tJson.data : [])
      setSections(Array.isArray(sJson.data) ? sJson.data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const grouped = useMemo(() => {
    const map = new Map<string, VenueTableRow[]>()
    for (const row of tables) {
      const key = row.floor_sections?.name || "Unassigned"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [tables])

  const createTable = async () => {
    const cap = Number(form.capacity)
    if (!form.table_number.trim() || !Number.isFinite(cap) || cap < 1) {
      setError("Table number and positive capacity are required")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/operations/tables", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          table_number: form.table_number.trim(),
          capacity: cap,
          section_id: form.section_id || null,
          is_active: true,
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || "Create failed")
      setForm({ table_number: "", capacity: String(cap), section_id: form.section_id })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (row: VenueTableRow, next: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/operations/tables/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error || "Update failed")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return <p className="text-sm text-muted-foreground">Loading floor layout...</p>
  }
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add table</CardTitle>
            <CardDescription>Admin only. Table numbers must be unique across the venue.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="tn">Table number</Label>
              <Input
                id="tn"
                value={form.table_number}
                onChange={(e) => setForm((f) => ({ ...f, table_number: e.target.value }))}
                placeholder="T12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cap">Capacity</Label>
              <Input
                id="cap"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-2">
              <Label htmlFor="sec">Floor section</Label>
              <select
                id="sec"
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={form.section_id}
                onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={() => void createTable()} disabled={saving}>
                {saving ? "Saving…" : "Create table"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tables for this location scope.</p>
        ) : (
          grouped.map(([sectionName, rows]) => (
            <Card key={sectionName}>
              <CardHeader>
                <CardTitle className="text-base">{sectionName}</CardTitle>
                <CardDescription>{rows.length} table(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">#{row.table_number}</div>
                      <div className="text-muted-foreground">
                        Capacity {row.capacity}
                        {typeof row.open_orders_count === "number" ? (
                          <span className={row.multi_order_warning ? " text-amber-600" : ""}>
                            {" "}
                            · Open orders {row.open_orders_count}
                            {row.multi_order_warning ? " (multiple)" : ""}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">Active</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={row.is_active !== false}
                          onChange={(e) => void toggleActive(row, e.target.checked)}
                          disabled={saving}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
