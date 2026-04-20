"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AttendanceRow = { id: string; clock_in: string; clock_out: string | null }

export function StaffTimePanel() {
  const [message, setMessage] = useState<string | null>(null)
  const [openLog, setOpenLog] = useState<AttendanceRow | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const r = await fetch("/api/operations/attendance-logs", { cache: "no-store" })
    const j = (await r.json()) as { data?: AttendanceRow[]; error?: string }
    if (!r.ok) {
      setMessage(j.error || "Failed to load attendance")
      return
    }
    const rows = j.data || []
    const open = rows.find((row) => !row.clock_out) ?? null
    setOpenLog(open)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const postJson = async (url: string, method: string, body?: unknown) => {
    setLoading(true)
    setMessage(null)
    try {
      const r = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: body != null ? JSON.stringify(body) : undefined,
      })
      const j = (await r.json()) as { error?: string; data?: unknown }
      if (!r.ok) {
        setMessage(j.error || `HTTP ${r.status}`)
        return
      }
      setMessage("Saved.")
      await refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed")
    } finally {
      setLoading(false)
    }
  }

  const clockIn = () => void postJson("/api/operations/attendance-logs", "POST", {})

  const clockOut = () => {
    if (!openLog) return
    void postJson(`/api/operations/attendance-logs/${openLog.id}`, "PATCH", { action: "clock_out" })
  }

  const startBreak = (breakType: "rest" | "meal") => {
    if (!openLog) return
    void postJson(`/api/operations/attendance-logs/${openLog.id}`, "PATCH", {
      action: "start_break",
      break_type: breakType,
    })
  }

  const endBreak = () => {
    if (!openLog) return
    void postJson(`/api/operations/attendance-logs/${openLog.id}`, "PATCH", { action: "end_break" })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Clock & breaks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {openLog
            ? `On shift since ${new Date(openLog.clock_in).toLocaleString()}`
            : "You are not clocked in."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={loading || Boolean(openLog)} onClick={clockIn}>
            Clock in
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={loading || !openLog} onClick={clockOut}>
            Clock out
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={loading || !openLog} onClick={() => startBreak("rest")}>
            Start rest break
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={loading || !openLog} onClick={() => startBreak("meal")}>
            Start meal break
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={loading || !openLog} onClick={endBreak}>
            End break
          </Button>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  )
}
