"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserRole } from "@/hooks/useUserRole"

type WindowRow = {
  id: string
  label: string
  starts_at: string
  ends_at: string
  discount_percent: number
  location_id?: string | null
  applies_to_category?: string | null
  is_active?: boolean
}

export default function OperationsPricingPage() {
  const { role } = useUserRole()
  const isAdmin = role === "admin"
  const [windows, setWindows] = useState<WindowRow[]>([])
  const [label, setLabel] = useState("Happy hour")
  const [starts, setStarts] = useState("16:00")
  const [ends, setEnds] = useState("18:00")
  const [discount, setDiscount] = useState("10")
  const [category, setCategory] = useState("")
  const [locationId, setLocationId] = useState("")
  const [msg, setMsg] = useState<string | null>(null)

  const load = () => {
    void fetch("/api/operations/pricing-windows", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { data?: WindowRow[] }) => {
        setWindows(Array.isArray(json.data) ? json.data : [])
      })
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    setMsg(null)
    if (!isAdmin) {
      setMsg("Admin only")
      return
    }
    const res = await fetch("/api/operations/pricing-windows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim(),
        starts_at: starts,
        ends_at: ends,
        discount_percent: Number(discount),
        applies_to_category: category.trim() || null,
        location_id: locationId.trim() || null,
      }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg((j as { error?: string }).error || "Failed")
      return
    }
    setMsg("Window created.")
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dynamic pricing</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Happy hour and other automatic discounts by time of day. Everyone can see what is active; admins can add
          windows below.
        </p>
      </div>
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create pricing window</CardTitle>
            <CardDescription>Admins only — creates a new time-based discount window.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 max-w-lg md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lbl">Label</Label>
              <Input id="lbl" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Happy hour" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="st">Starts (HH:MM)</Label>
              <Input id="st" value={starts} onChange={(e) => setStarts(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="en">Ends (HH:MM)</Label>
              <Input id="en" value={ends} onChange={(e) => setEnds(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disc">Discount %</Label>
              <Input id="disc" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc">Location (optional)</Label>
              <Input id="loc" value={locationId} onChange={(e) => setLocationId(e.target.value)} className="font-mono text-xs" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cat">Category filter (optional)</Label>
              <Input id="cat" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button type="button" onClick={() => void submit()}>
                Create window
              </Button>
            </div>
            {msg ? <p className="text-sm text-muted-foreground md:col-span-2">{msg}</p> : null}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Pricing window creation is limited to admins.</p>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active windows</CardTitle>
          <CardDescription>Windows that apply right now or later today.</CardDescription>
        </CardHeader>
        <CardContent>
          {windows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pricing windows configured.</p>
          ) : (
            <ul className="text-sm space-y-2">
              {windows.map((w) => (
                <li key={w.id} className="border-b border-border pb-2">
                  <span className="font-medium">{w.label}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {String(w.starts_at).slice(0, 5)}–{String(w.ends_at).slice(0, 5)} · {Number(w.discount_percent)}%
                  </span>
                  {w.applies_to_category ? (
                    <span className="text-xs text-muted-foreground"> · category: {w.applies_to_category}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
