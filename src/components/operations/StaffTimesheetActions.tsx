"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function StaffTimesheetActions() {
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [regular, setRegular] = useState("40")
  const [ot, setOt] = useState("0")
  const [timesheetId, setTimesheetId] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const postJson = async (url: string, method: string, body?: unknown) => {
    setLoading(true)
    setMessage(null)
    try {
      const r = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: body != null ? JSON.stringify(body) : undefined,
      })
      const j = (await r.json()) as { error?: string; data?: { id?: string } }
      if (!r.ok) {
        setMessage(j.error || `HTTP ${r.status}`)
        return
      }
      if (j.data?.id) setTimesheetId(j.data.id)
      setMessage("OK")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  const createDraft = () => {
    void postJson("/api/operations/timesheets", "POST", {
      period_start: periodStart,
      period_end: periodEnd,
      regular_hours: Number(regular),
      overtime_hours: Number(ot),
    })
  }

  const transition = (action: "submit" | "approve" | "lock" | "reopen") => {
    if (!timesheetId.trim()) {
      setMessage("Set timesheet id (create a draft first).")
      return
    }
    void postJson(`/api/operations/timesheets/${timesheetId.trim()}`, "PATCH", { action })
  }

  const downloadPayroll = () => {
    if (!timesheetId.trim()) {
      setMessage("Set timesheet id.")
      return
    }
    void (async () => {
      setLoading(true)
      setMessage(null)
      try {
        const r = await fetch(`/api/operations/timesheets/${timesheetId.trim()}/export`)
        if (!r.ok) {
          const j = (await r.json()) as { error?: string }
          setMessage(j.error || `HTTP ${r.status}`)
          return
        }
        const blob = await r.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "timesheet-export.csv"
        a.click()
        URL.revokeObjectURL(url)
        setMessage("Download started.")
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Export failed")
      } finally {
        setLoading(false)
      }
    })()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timesheet draft & lifecycle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="ts-start">Period start (YYYY-MM-DD)</Label>
            <Input id="ts-start" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-end">Period end (YYYY-MM-DD)</Label>
            <Input id="ts-end" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="ts-reg">Regular hours</Label>
            <Input id="ts-reg" value={regular} onChange={(e) => setRegular(e.target.value)} inputMode="decimal" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ts-ot">Overtime hours</Label>
            <Input id="ts-ot" value={ot} onChange={(e) => setOt(e.target.value)} inputMode="decimal" />
          </div>
        </div>
        <Button type="button" size="sm" disabled={loading} onClick={createDraft}>
          Create draft
        </Button>
        <div className="space-y-1">
          <Label htmlFor="ts-id">Timesheet id (from last create)</Label>
          <Input id="ts-id" value={timesheetId} onChange={(e) => setTimesheetId(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => transition("submit")}>
            Submit
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => transition("approve")}>
            Approve (admin)
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => transition("lock")}>
            Lock (admin)
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => transition("reopen")}>
            Reopen to draft (admin)
          </Button>
          <Button type="button" size="sm" disabled={loading} onClick={downloadPayroll}>
            Payroll CSV (locked)
          </Button>
        </div>
        {message ? <p className="text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  )
}
