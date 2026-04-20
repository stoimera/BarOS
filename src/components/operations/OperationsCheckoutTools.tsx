"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CheckoutOrderLine = { id: string; line_total: number; item_name: string }

type OperationsCheckoutToolsProps = {
  boundOrderId?: string
  boundPaymentId?: string
  orderLines?: CheckoutOrderLine[]
}

type OrderPick = { id: string; status?: string }
type PaymentPick = { id: string; order_id?: string | null; amount?: number | null }

export function OperationsCheckoutTools({ boundOrderId, boundPaymentId, orderLines }: OperationsCheckoutToolsProps) {
  const [orderId, setOrderId] = useState("")
  const [tipAmount, setTipAmount] = useState("2")
  const [pool, setPool] = useState<"staff" | "kitchen" | "house">("staff")
  const [splitPaymentId, setSplitPaymentId] = useState("")
  const [allocations, setAllocations] = useState<{ order_item_id: string; allocated_amount: number }[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [splitPayAmount, setSplitPayAmount] = useState("")
  const [selectedLineIds, setSelectedLineIds] = useState<Record<string, boolean>>({})
  const [ordersPick, setOrdersPick] = useState<OrderPick[]>([])
  const [paymentsPick, setPaymentsPick] = useState<PaymentPick[]>([])

  useEffect(() => {
    if (boundOrderId) setOrderId(boundOrderId)
  }, [boundOrderId])

  useEffect(() => {
    if (boundPaymentId) setSplitPaymentId(boundPaymentId)
  }, [boundPaymentId])

  useEffect(() => {
    if (orderLines?.length) {
      const init: Record<string, boolean> = {}
      for (const l of orderLines) init[l.id] = true
      setSelectedLineIds(init)
    }
  }, [orderLines])

  useEffect(() => {
    if (boundOrderId && boundPaymentId) return
    void (async () => {
      try {
        const [oRes, pRes] = await Promise.all([
          fetch("/api/operations/orders/list", { cache: "no-store" }),
          fetch("/api/operations/payments", { cache: "no-store" }),
        ])
        const oj = await oRes.json().catch(() => ({}))
        const pj = await pRes.json().catch(() => ({}))
        if (oRes.ok && Array.isArray(oj.data)) setOrdersPick(oj.data as OrderPick[])
        if (pRes.ok && Array.isArray(pj.data)) setPaymentsPick(pj.data as PaymentPick[])
      } catch {
        /* ignore */
      }
    })()
  }, [boundOrderId, boundPaymentId])

  const effectiveOrderId = boundOrderId ?? orderId

  const toggleLine = (id: string) => {
    setSelectedLineIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const proportionalSplit = () => {
    if (!orderLines?.length) {
      setMsg("Open this tab from Orders & payments so items load for splitting.")
      return
    }
    const pay = Number.parseFloat(splitPayAmount)
    if (!Number.isFinite(pay) || pay <= 0) {
      setMsg("Enter the card or cash amount to split across the selected items.")
      return
    }
    const picked = orderLines.filter((l) => selectedLineIds[l.id])
    if (picked.length === 0) {
      setMsg("Tick at least one item to include.")
      return
    }
    const sumCents = picked.reduce((s, l) => s + Math.round(l.line_total * 100), 0)
    if (sumCents <= 0) {
      setMsg("Selected items have no amount to split.")
      return
    }
    const payCents = Math.round(pay * 100)
    let allocatedCents = 0
    const next = picked.map((l, i) => {
      const lineCents = Math.round(l.line_total * 100)
      const share =
        i === picked.length - 1 ? payCents - allocatedCents : Math.floor((payCents * lineCents) / sumCents)
      allocatedCents += share
      return { order_item_id: l.id, allocated_amount: share / 100 }
    })
    setAllocations(next)
    setMsg("Split filled by each item’s share of the bill.")
  }

  const equalPerSelectedLine = () => {
    if (!orderLines?.length) {
      setMsg("Open this tab from Orders & payments so items load for splitting.")
      return
    }
    const pay = Number.parseFloat(splitPayAmount)
    if (!Number.isFinite(pay) || pay <= 0) {
      setMsg("Enter the total payment amount to divide evenly.")
      return
    }
    const picked = orderLines.filter((l) => selectedLineIds[l.id])
    if (picked.length === 0) {
      setMsg("Tick at least one item to include.")
      return
    }
    const n = picked.length
    const centsTotal = Math.round(pay * 100)
    const baseCents = Math.floor(centsTotal / n)
    const next = picked.map((l, i) => {
      const c = i === n - 1 ? centsTotal - baseCents * (n - 1) : baseCents
      return { order_item_id: l.id, allocated_amount: c / 100 }
    })
    setAllocations(next)
    setMsg("Split filled evenly across the selected items (rounding on the last line).")
  }

  const postTip = async () => {
    setMsg(null)
    if (!effectiveOrderId) {
      setMsg("Choose an order first.")
      return
    }
    const res = await fetch(`/api/operations/orders/${effectiveOrderId}/tips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(tipAmount), pool_type: pool }),
    })
    const j = await res.json().catch(() => ({}))
    setMsg(res.ok ? "Tip saved." : (j as { error?: string }).error || "Could not save tip")
  }

  const postSplit = async () => {
    setMsg(null)
    const payId = boundPaymentId || splitPaymentId
    if (!effectiveOrderId || !payId) {
      setMsg("Choose an order and a payment first.")
      return
    }
    if (allocations.length === 0) {
      setMsg("Build a split with the buttons above, or open from Orders & payments with items selected.")
      return
    }
    const res = await fetch(`/api/operations/orders/${effectiveOrderId}/split`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: payId, allocations }),
    })
    const j = await res.json().catch(() => ({}))
    setMsg(res.ok ? "Split saved." : (j as { error?: string }).error || "Could not save split")
  }

  const lineName = (itemId: string) => orderLines?.find((l) => l.id === itemId)?.item_name || "Item"

  const linePickers = useMemo(() => {
    if (!orderLines?.length) return null
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Items to include</Label>
        <ul className="max-h-36 space-y-1.5 overflow-y-auto text-sm">
          {orderLines.map((l) => (
            <li key={l.id}>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!selectedLineIds[l.id]}
                  onChange={() => toggleLine(l.id)}
                  className="h-4 w-4"
                />
                <span className="truncate">
                  {l.item_name} · {l.line_total.toFixed(2)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    )
  }, [orderLines, selectedLineIds])

  const paymentsForOrder = useMemo(() => {
    if (!effectiveOrderId) return paymentsPick
    return paymentsPick.filter((p) => p.order_id === effectiveOrderId)
  }, [paymentsPick, effectiveOrderId])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tips & tronc</CardTitle>
            <CardDescription>Record a tip on an open order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!boundOrderId ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Order</Label>
                <Select value={orderId || undefined} onValueChange={setOrderId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {ordersPick.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.status === "open" ? "Open" : o.status || "Order"} · …{o.id.slice(-6)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Order from hub · …{effectiveOrderId.slice(-8)}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="tip-amt" className="text-sm font-medium">
                Amount
              </Label>
              <Input id="tip-amt" type="number" step="0.01" value={tipAmount} onChange={(e) => setTipAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tip-pool" className="text-sm font-medium">
                Who it goes to
              </Label>
              <select
                id="tip-pool"
                className="w-full border rounded-md h-9 px-2 text-sm bg-background"
                value={pool}
                onChange={(e) => setPool(e.target.value as typeof pool)}
              >
                <option value="staff">Staff</option>
                <option value="kitchen">Kitchen</option>
                <option value="house">House</option>
              </select>
            </div>
            <Button type="button" onClick={() => void postTip()}>
              Record tip
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Split a payment</CardTitle>
            <CardDescription>Divide one card or cash payment across items on the ticket.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!boundPaymentId ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment</Label>
                <Select value={splitPaymentId || undefined} onValueChange={setSplitPaymentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a payment" />
                  </SelectTrigger>
                  <SelectContent>
                    {(effectiveOrderId ? paymentsForOrder : paymentsPick).map((p) => {
                      const amt = typeof p.amount === "number" ? p.amount : Number(p.amount)
                      const amtLabel = Number.isFinite(amt) ? amt.toFixed(2) : "—"
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {amtLabel} · …{p.id.slice(-6)}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {effectiveOrderId && paymentsForOrder.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No payments found for this order yet.</p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Payment from hub · …{splitPaymentId.slice(-8)}</p>
            )}
            {linePickers}
            <div className="space-y-2">
              <Label htmlFor="sp-amt" className="text-sm font-medium">
                Payment total to split
              </Label>
              <Input id="sp-amt" value={splitPayAmount} onChange={(e) => setSplitPayAmount(e.target.value)} placeholder="e.g. 40" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => proportionalSplit()}>
                Match each item’s share
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => equalPerSelectedLine()}>
                Split evenly
              </Button>
            </div>
            {allocations.length > 0 ? (
              <div className="space-y-2 rounded-md border border-border p-3">
                <p className="text-sm font-medium">Amount per item</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {allocations.map((a) => (
                    <li key={a.order_item_id} className="flex justify-between gap-2">
                      <span>{lineName(a.order_item_id)}</span>
                      <span>{a.allocated_amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                After you enter the payment total, use a button above to fill amounts, then save.
              </p>
            )}
            <Button type="button" variant="secondary" onClick={() => void postSplit()}>
              Save split
            </Button>
          </CardContent>
        </Card>
      </div>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  )
}
