"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type StaffRow = {
  id: string
  profile_id: string
  position: string
  location_id: string | null
  profile?: { email?: string; first_name?: string | null; last_name?: string | null; role?: string }
}

type LocationRow = { id: string; name: string }

export function StaffLocationAssignment() {
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [sRes, lRes] = await Promise.all([
          fetch("/api/operations/admin/staff", { credentials: "include" }),
          fetch("/api/operations/locations", { credentials: "include" }),
        ])
        const sJson = (await sRes.json()) as { data?: StaffRow[]; error?: string }
        const lJson = (await lRes.json()) as { data?: LocationRow[]; error?: string }
        if (!sRes.ok) throw new Error(sJson.error || "Failed to load staff")
        if (!lRes.ok) throw new Error(lJson.error || "Failed to load locations")
        if (!cancelled) {
          setStaff(sJson.data || [])
          setLocations(lJson.data || [])
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Load failed")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function saveLocation(staffId: string, locationId: string) {
    setSavingId(staffId)
    try {
      const res = await fetch(`/api/operations/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          location_id: locationId === "__none__" ? null : locationId,
        }),
      })
      const json = (await res.json()) as { data?: StaffRow; error?: string }
      if (!res.ok) throw new Error(json.error || "Update failed")
      toast.success("Location updated")
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, location_id: json.data?.location_id ?? null } : s))
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Staff location assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Requires admin. Sets <code className="bg-muted px-1 rounded">staff.location_id</code> used for API
          location scoping.
        </p>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && staff.length === 0 && (
          <p className="text-sm text-muted-foreground">No staff rows returned (check admin session).</p>
        )}
        {!loading &&
          staff.map((s) => {
            const name =
              `${s.profile?.first_name ?? ""} ${s.profile?.last_name ?? ""}`.trim() || s.profile?.email || s.id
            return (
              <div key={s.id} className="flex flex-wrap items-end gap-2 border-b border-border pb-3">
                <div className="min-w-[200px] flex-1 space-y-1">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">{s.position}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor={`loc-${s.id}`} className="sr-only">
                    Location for {name}
                  </Label>
                  <select
                    id={`loc-${s.id}`}
                    className="h-9 min-w-[180px] rounded-md border border-input bg-background px-2 text-sm"
                    defaultValue={s.location_id ?? "__none__"}
                    aria-label={`Location for ${name}`}
                  >
                    <option value="__none__">Unassigned</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingId === s.id}
                    onClick={() => {
                      const el = document.getElementById(`loc-${s.id}`) as HTMLSelectElement | null
                      if (el) void saveLocation(s.id, el.value)
                    }}
                  >
                    {savingId === s.id ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            )
          })}
      </CardContent>
    </Card>
  )
}
