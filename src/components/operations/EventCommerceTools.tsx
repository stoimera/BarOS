"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function EventCommerceTools() {
  const [tierId, setTierId] = useState("")
  const [qty, setQty] = useState("1")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [checkinSaleId, setCheckinSaleId] = useState("")
  const [checkinToken, setCheckinToken] = useState("")
  const [idem, setIdem] = useState("")

  const postJson = async (url: string, body: unknown, headers?: Record<string, string>) => {
    setLoading(true)
    setMessage(null)
    try {
      const h: Record<string, string> = { "content-type": "application/json", ...headers }
      const res = await fetch(url, {
        method: "POST",
        headers: h,
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { error?: string; data?: unknown }
      if (!res.ok) {
        setMessage(json.error || `HTTP ${res.status}`)
        return
      }
      setMessage(typeof json.data === "object" ? JSON.stringify(json.data, null, 2) : "OK")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  const reserve = () =>
    postJson("/api/operations/event-ticket-tiers", {
      action: "reserve",
      ticket_tier_id: tierId.trim(),
      quantity: Number(qty),
    })

  const release = () =>
    postJson("/api/operations/event-ticket-tiers", {
      action: "release",
      ticket_tier_id: tierId.trim(),
      quantity: Number(qty),
    })

  const checkin = () => {
    const tok = checkinToken.trim()
    const sid = checkinSaleId.trim()
    if (tok && sid) {
      setMessage("Use either a sale from the list or the guest code — not both.")
      return
    }
    if (!tok && !sid) {
      setMessage("Pick one row from Ticket Sales below, or enter the guest’s check-in code.")
      return
    }
    const body = tok ? { checkin_token: tok } : { ticket_sale_id: sid }
    const headers: Record<string, string> = {}
    if (idem.trim().length >= 8) headers["idempotency-key"] = idem.trim()
    return postJson("/api/operations/event-commerce/checkin", body, headers)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hold or return stock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Temporarily remove tickets from what you can sell, or put them back. Match the ticket type to the Ticket
            Tiers list on this page.
          </p>
          <div className="space-y-1">
            <Label htmlFor="ect-tier">Ticket type</Label>
            <Input
              id="ect-tier"
              value={tierId}
              onChange={(e) => setTierId(e.target.value)}
              placeholder="Copy from the Ticket Tiers table below"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ect-qty">How many</Label>
            <Input id="ect-qty" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={loading} onClick={() => void reserve()}>
              Hold from sale
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void release()}>
              Put back on sale
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Fill in either one row from Ticket Sales below, or the code the guest shows — not both. If the
            same ticket might be scanned twice by mistake, add a short note (8+ characters) so the second scan is
            ignored.
          </p>
          <div className="space-y-1">
            <Label htmlFor="ect-sale">Ticket sale (from table below)</Label>
            <Input
              id="ect-sale"
              value={checkinSaleId}
              onChange={(e) => setCheckinSaleId(e.target.value)}
              placeholder="Copy from the Ticket Sales table below"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ect-token">Guest check-in code</Label>
            <Input id="ect-token" value={checkinToken} onChange={(e) => setCheckinToken(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ect-idem">Double-scan guard (optional)</Label>
            <Input
              id="ect-idem"
              value={idem}
              onChange={(e) => setIdem(e.target.value)}
              placeholder="Any phrase, 8+ characters"
            />
          </div>
          <Button type="button" size="sm" disabled={loading} onClick={() => void checkin()}>
            Check in
          </Button>
        </CardContent>
      </Card>

      {message ? (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap break-all max-h-48 overflow-auto">{message}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
