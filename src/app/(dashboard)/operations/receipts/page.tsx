"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Receipt = {
  id: string
  order_id: string
  fiscal_reference: string | null
  totals: Record<string, unknown>
  issued_at: string
}

function formatTotalsForPrint(totals: Record<string, unknown>): string {
  const lines: string[] = []
  const sub = totals.subtotal
  const tax = totals.tax
  const total = totals.total
  if (typeof sub === "number") lines.push(`Subtotal: ${sub.toFixed(2)}`)
  if (typeof tax === "number") lines.push(`Tax: ${tax.toFixed(2)}`)
  if (typeof total === "number") lines.push(`Total: ${total.toFixed(2)}`)
  if (lines.length > 0) return lines.join("\n")
  return "Totals on file (see back office for detail)."
}

export default function OperationsReceiptsPage() {
  const [rows, setRows] = useState<Receipt[]>([])
  const [orderId, setOrderId] = useState("")
  const [fiscal, setFiscal] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [printRow, setPrintRow] = useState<Receipt | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const load = () => {
    void fetch("/api/operations/receipts", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setRows(j.data as Receipt[])
      })
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    setMsg(null)
    if (!orderId) {
      setMsg("Enter the order this receipt belongs to.")
      return
    }
    const res = await fetch("/api/operations/receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        fiscal_reference: fiscal || null,
        totals: { subtotal: 0, tax: 0, total: 0 },
      }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg((j as { error?: string }).error || "Could not save")
      return
    }
    setMsg("Receipt saved.")
    setOrderId("")
    setFiscal("")
    load()
  }

  const doPrint = () => {
    const w = window.open("", "_blank", "width=400,height=600")
    if (!w || !printRef.current) return
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title></head><body>${printRef.current.innerHTML}</body></html>`)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Receipts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Store a till receipt against an order, add an authority or register reference if your country needs one, then
          print a simple slip for the guest or files.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New receipt</CardTitle>
          <CardDescription>Link to the order you are closing out.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="rx-order" className="text-sm font-medium">
              Order ID
            </Label>
            <Input id="rx-order" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="From Orders & payments" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rx-fiscal" className="text-sm font-medium">
              Register / tax reference (optional)
            </Label>
            <Input id="rx-fiscal" value={fiscal} onChange={(e) => setFiscal(e.target.value)} placeholder="If required in your region" />
          </div>
          <Button type="button" onClick={() => void create()}>
            Save receipt
          </Button>
          {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent receipts</CardTitle>
          <CardDescription>Pick one to preview and print.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="text-sm space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                <span className="text-muted-foreground">
                  {new Date(r.issued_at).toLocaleString()} · order …{r.order_id.slice(-6)}
                  {r.fiscal_reference ? ` · ref ${r.fiscal_reference}` : ""}
                </span>
                <Button type="button" size="sm" variant="outline" onClick={() => setPrintRow(r)}>
                  Print
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {printRow ? (
        <div className="space-y-2">
          <Button type="button" onClick={() => void doPrint()}>
            Open print dialog
          </Button>
          <div
            ref={printRef}
            className="receipt-print border border-border bg-white p-6 text-black max-w-sm print:border-0"
          >
            <h2 className="text-lg font-semibold">Receipt</h2>
            <p className="text-xs mt-2">Receipt # …{printRow.id.slice(-8)}</p>
            <p className="text-xs">Order # …{printRow.order_id.slice(-8)}</p>
            <p className="text-xs">Issued: {new Date(printRow.issued_at).toLocaleString()}</p>
            {printRow.fiscal_reference ? <p className="text-xs">Reference: {printRow.fiscal_reference}</p> : null}
            <p className="text-sm mt-4 whitespace-pre-line">{formatTotalsForPrint(printRow.totals)}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPrintRow(null)}>
            Close preview
          </Button>
        </div>
      ) : null}
    </div>
  )
}
