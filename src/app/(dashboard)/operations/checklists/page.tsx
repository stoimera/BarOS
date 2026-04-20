"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Line = { id: string; label: string; done: boolean }

const STORAGE_KEY = "urban-ops-opening-checklist-v1"

export default function OperationsChecklistsPage() {
  const [lines, setLines] = useState<Line[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as Line[]
    } catch {
      /* ignore */
    }
    return [
      { id: "1", label: "Cash drawer counted", done: false },
      { id: "2", label: "Ice wells topped", done: false },
      { id: "3", label: "Keg lines inspected", done: false },
    ]
  })
  const [incident, setIncident] = useState("")
  const [newLabel, setNewLabel] = useState("")

  const persist = (next: Line[]) => {
    setLines(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const exportPlainText = useMemo(() => {
    const when = new Date().toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
    const checklistBlock = lines.map((l) => `${l.done ? "Done" : "To do"} — ${l.label}`).join("\n")
    const notes = incident.trim()
    const notesBlock = notes ? `\n\nShift notes / incidents:\n${notes}` : ""
    return `Opening & closing checklist\nExported: ${when}\n\n${checklistBlock}${notesBlock}\n`
  }, [lines, incident])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Opening / closing checklists</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ticks and notes are saved on this device only (they do not sync to the cloud). Use{" "}
          <span className="font-medium text-foreground">Download a copy</span> to email or file what happened on shift
          for your manager or records.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today&apos;s checklist</CardTitle>
          <CardDescription>Tick items as completed; add custom lines for your venue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l) => (
            <label key={l.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={l.done}
                onChange={(e) =>
                  persist(lines.map((x) => (x.id === l.id ? { ...x, done: e.target.checked } : x)))
                }
                className="h-4 w-4"
              />
              <span className={l.done ? "text-muted-foreground line-through" : ""}>{l.label}</span>
            </label>
          ))}
          <div className="flex flex-wrap items-end gap-2 pt-2">
            <div className="grow space-y-1">
              <Label htmlFor="nl">Add line</Label>
              <Input id="nl" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Rotate taps" />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const t = newLabel.trim()
                if (!t) return
                persist([...lines, { id: crypto.randomUUID(), label: t, done: false }])
                setNewLabel("")
              }}
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incident log</CardTitle>
          <CardDescription>
            Anything the next shift or the owner should know — spills, door issues, cash quirks, guest incidents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="incident-notes" className="sr-only">
              Shift notes
            </Label>
            <textarea
              id="incident-notes"
              className="border-input bg-background min-h-[120px] w-full rounded-md border px-3 py-2 text-sm"
              value={incident}
              onChange={(e) => setIncident(e.target.value)}
              placeholder="Glassware breakage at 22:10 — cleared and logged."
            />
          </div>
          <Button type="button" variant="outline" asChild>
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(exportPlainText)}`}
              download={`shift-checklist-${new Date().toISOString().slice(0, 10)}.txt`}
            >
              Download a copy
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Includes the checklist above and these notes — a normal text file you can read, print, or attach to an email.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
