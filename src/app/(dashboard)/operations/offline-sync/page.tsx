"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const QUEUE_KEY = "urban-offline-replay-queue-v1"

type BatchRow = {
  id: string
  device_id: string
  received_at: string
  status: string
  error_message?: string | null
}

type Queued = { device_id: string; payload: Record<string, unknown> }

type EventPreset = "noop" | "order_line" | "payment" | "inventory_delta" | "loyalty_punch" | "custom"

type BuilderEvent = {
  id: string
  preset: EventPreset
  customType: string
  atLocal: string
}

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function localInputNow(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function localDatetimeToIso(local: string): string {
  const t = Date.parse(local)
  if (Number.isNaN(t)) return new Date().toISOString()
  return new Date(t).toISOString()
}

function resolvedType(row: BuilderEvent): string {
  if (row.preset === "custom") {
    const t = row.customType.trim()
    return t.length > 0 ? t : "noop"
  }
  return row.preset
}

function buildPayloadFromEvents(rows: BuilderEvent[]): Record<string, unknown> {
  return {
    events: rows.map((r) => ({
      type: resolvedType(r),
      at: localDatetimeToIso(r.atLocal),
    })),
  }
}

function parseEventsFromPayload(obj: Record<string, unknown>): BuilderEvent[] | null {
  const ev = obj.events
  if (!Array.isArray(ev) || ev.length === 0) return null
  const out: BuilderEvent[] = []
  for (const item of ev) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const type = typeof o.type === "string" ? o.type : "noop"
    const presets: EventPreset[] = [
      "noop",
      "order_line",
      "payment",
      "inventory_delta",
      "loyalty_punch",
      "custom",
    ]
    const preset = (presets.includes(type as EventPreset) ? type : "custom") as EventPreset
    const at =
      typeof o.at === "string" && !Number.isNaN(Date.parse(o.at))
        ? (() => {
            const d = new Date(o.at as string)
            const p = (n: number) => String(n).padStart(2, "0")
            return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
          })()
        : localInputNow()
    out.push({
      id: newEventId(),
      preset,
      customType: preset === "custom" ? type : "",
      atLocal: at,
    })
  }
  return out.length > 0 ? out : null
}

export default function OperationsOfflineSyncPage() {
  const [deviceId, setDeviceId] = useState("pos-handheld-1")
  const [useAdvancedJson, setUseAdvancedJson] = useState(false)
  const [rawPayload, setRawPayload] = useState("")
  const [events, setEvents] = useState<BuilderEvent[]>([
    { id: newEventId(), preset: "noop", customType: "", atLocal: localInputNow() },
  ])
  const [msg, setMsg] = useState<string | null>(null)
  const [serverRows, setServerRows] = useState<BatchRow[]>([])
  const [queue, setQueue] = useState<Queued[]>([])

  const builtPayload = useMemo(() => buildPayloadFromEvents(events), [events])

  const loadServer = useCallback(async () => {
    const res = await fetch("/api/operations/offline-sync/batches", { cache: "no-store" })
    const j = (await res.json()) as { data?: BatchRow[]; error?: string }
    if (res.ok) setServerRows(Array.isArray(j.data) ? j.data : [])
    else setMsg(j.error || "Failed to list batches")
  }, [])

  const loadQueue = useCallback(() => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY)
      setQueue(raw ? (JSON.parse(raw) as Queued[]) : [])
    } catch {
      setQueue([])
    }
  }, [])

  useEffect(() => {
    void loadServer()
    loadQueue()
  }, [loadServer, loadQueue])

  const persistQueue = (next: Queued[]) => {
    setQueue(next)
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const getPayloadForAction = (): Record<string, unknown> | null => {
    if (useAdvancedJson) {
      try {
        return JSON.parse(rawPayload) as Record<string, unknown>
      } catch {
        setMsg("That pasted batch is not valid JSON.")
        return null
      }
    }
    return builtPayload
  }

  const submit = async () => {
    setMsg(null)
    const parsed = getPayloadForAction()
    if (!parsed) return
    const res = await fetch("/api/operations/offline-sync/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, payload: parsed }),
    })
    const j = await res.json().catch(() => ({}))
    setMsg(res.ok ? `Queued batch ${(j as { data?: { id?: string } }).data?.id || ""}` : (j as { error?: string }).error || "Failed")
    void loadServer()
  }

  const enqueueCurrent = () => {
    const parsed = getPayloadForAction()
    if (!parsed) return
    persistQueue([...queue, { device_id: deviceId, payload: parsed }])
    setMsg("Added to local replay queue.")
  }

  const replayQueue = async () => {
    setMsg(null)
    const hadItems = queue.length > 0
    let q = [...queue]
    while (q.length > 0) {
      const item = q[0]
      const res = await fetch("/api/operations/offline-sync/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: item.device_id, payload: item.payload }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setMsg(j.error || "Replay stopped on first failure")
        break
      }
      q = q.slice(1)
    }
    persistQueue(q)
    void loadServer()
    if (hadItems && q.length === 0) setMsg("Replay complete.")
  }

  const openAdvanced = () => {
    setRawPayload(JSON.stringify(builtPayload, null, 2))
    setUseAdvancedJson(true)
  }

  const closeAdvanced = () => {
    setMsg(null)
    try {
      const parsed = JSON.parse(rawPayload) as Record<string, unknown>
      const next = parseEventsFromPayload(parsed)
      if (next) setEvents(next)
    } catch {
      setMsg("Fix the JSON before leaving advanced mode.")
      return
    }
    setUseAdvancedJson(false)
  }

  const addEventRow = () => {
    setEvents((prev) => [
      ...prev,
      { id: newEventId(), preset: "noop", customType: "", atLocal: localInputNow() },
    ])
  }

  const removeEventRow = (id: string) => {
    setEvents((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)))
  }

  const updateEvent = (id: string, patch: Partial<BuilderEvent>) => {
    setEvents((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Offline sync</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          When a handheld or till was offline, batches land here. Your IT person supplies the upload box; staff can see
          what arrived and replay anything still waiting on this device.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload batch</CardTitle>
          <CardDescription>From your POS vendor or IT — not needed for normal service.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div>
            <Label htmlFor="dev">Device id</Label>
            <Input id="dev" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
          </div>

          {!useAdvancedJson ? (
            <div className="space-y-3">
              <div>
                <Label>Batch events</Label>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Each line becomes one event with a type and time. The server stores the batch as-is.
                </p>
              </div>
              <ul className="space-y-3">
                {events.map((row, idx) => (
                  <li key={row.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Event {idx + 1}</span>
                      {events.length > 1 ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeEventRow(row.id)}>
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                      <div className="space-y-1 min-w-[200px]">
                        <Label className="text-xs">Kind</Label>
                        <Select
                          value={row.preset}
                          onValueChange={(v) => updateEvent(row.id, { preset: v as EventPreset })}
                        >
                          <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="noop">Connectivity test (no-op)</SelectItem>
                            <SelectItem value="order_line">Order line</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="inventory_delta">Stock movement</SelectItem>
                            <SelectItem value="loyalty_punch">Loyalty punch</SelectItem>
                            <SelectItem value="custom">Custom type…</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {row.preset === "custom" ? (
                        <div className="space-y-1 flex-1 min-w-[140px]">
                          <Label className="text-xs">Custom type name</Label>
                          <Input
                            value={row.customType}
                            onChange={(e) => updateEvent(row.id, { customType: e.target.value })}
                            placeholder="e.g. tab_transfer"
                          />
                        </div>
                      ) : null}
                      <div className="space-y-1 flex-1 min-w-[180px]">
                        <Label className="text-xs">When (this device)</Label>
                        <Input
                          type="datetime-local"
                          value={row.atLocal}
                          onChange={(e) => updateEvent(row.id, { atLocal: e.target.value })}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="outline" size="sm" onClick={addEventRow}>
                Add event
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pl">Vendor JSON</Label>
              <textarea
                id="pl"
                className="w-full min-h-[160px] border rounded-md p-2 text-sm font-mono bg-background"
                value={rawPayload}
                onChange={(e) => setRawPayload(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <Button type="button" onClick={() => void submit()}>
              Submit batch
            </Button>
            <Button type="button" variant="secondary" onClick={() => enqueueCurrent()}>
              Queue locally
            </Button>
            {!useAdvancedJson ? (
              <Button type="button" variant="outline" onClick={openAdvanced}>
                Paste vendor JSON…
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={closeAdvanced}>
                Back to simple form
              </Button>
            )}
          </div>
          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Server batches</CardTitle>
          <CardDescription>Batches the server has already received from tills or handhelds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void loadServer()}>
            Refresh list
          </Button>
          <ul className="text-xs font-mono space-y-1 max-h-48 overflow-y-auto">
            {serverRows.map((r) => (
              <li key={r.id}>
                {r.id.slice(0, 8)} · {r.status} · {r.device_id}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Local replay queue</CardTitle>
          <CardDescription>Stored in this browser; POSTs each entry to the batch API in order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{queue.length} item(s)</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void replayQueue()}>
              Replay queue
            </Button>
            <Button type="button" variant="outline" onClick={() => persistQueue([])}>
              Clear queue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
