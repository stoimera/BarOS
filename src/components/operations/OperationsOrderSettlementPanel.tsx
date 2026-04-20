"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ORDER_VOID_REASON_CODES } from "@/lib/operations/voids"
import { toast } from "sonner"

const orderStatuses = ["open", "active", "closed", "voided"] as const
const paymentStatuses = ["authorized", "captured", "refunded", "chargeback"] as const

type OperationsOrderSettlementPanelProps = {
  boundOrderId?: string
  boundPaymentId?: string
}

export function OperationsOrderSettlementPanel({ boundOrderId, boundPaymentId }: OperationsOrderSettlementPanelProps) {
  const [orderId, setOrderId] = useState("")
  const [fromOrder, setFromOrder] = useState<string>("active")
  const [toOrder, setToOrder] = useState<string>("closed")
  const [orderReason, setOrderReason] = useState("customer_cancelled")
  const [idemOrder, setIdemOrder] = useState("")
  const [paymentId, setPaymentId] = useState("")
  const [fromPay, setFromPay] = useState<string>("authorized")
  const [toPay, setToPay] = useState<string>("captured")
  const [payReason, setPayReason] = useState("card present")
  const [idemPay, setIdemPay] = useState("")
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [loadingPay, setLoadingPay] = useState(false)

  useEffect(() => {
    if (boundOrderId) setOrderId(boundOrderId)
  }, [boundOrderId])

  useEffect(() => {
    if (boundPaymentId) setPaymentId(boundPaymentId)
  }, [boundPaymentId])

  const effectiveOrderId = boundOrderId ?? orderId
  const effectivePaymentId = boundPaymentId ?? paymentId

  async function submitOrderTransition() {
    if (!effectiveOrderId) {
      toast.error("Order id is required")
      return
    }
    setLoadingOrder(true)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (idemOrder.trim().length >= 8) headers["Idempotency-Key"] = idemOrder.trim()
      const res = await fetch(`/api/operations/orders/${effectiveOrderId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          from_status: fromOrder,
          to_status: toOrder,
          reason: orderReason,
        }),
      })
      const json = (await res.json()) as { data?: unknown; error?: string }
      if (!res.ok) throw new Error(json.error || "Request failed")
      toast.success("Order transition applied")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Order transition failed")
    } finally {
      setLoadingOrder(false)
    }
  }

  async function submitPaymentTransition() {
    if (!effectivePaymentId) {
      toast.error("Payment id is required")
      return
    }
    setLoadingPay(true)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (idemPay.trim().length >= 8) headers["Idempotency-Key"] = idemPay.trim()
      const res = await fetch(`/api/operations/payments/${effectivePaymentId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          from_status: fromPay,
          to_status: toPay,
          reason: payReason,
        }),
      })
      const json = (await res.json()) as { data?: unknown; error?: string }
      if (!res.ok) throw new Error(json.error || "Request failed")
      toast.success("Payment transition applied")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment transition failed")
    } finally {
      setLoadingPay(false)
    }
  }

  return (
    <div className="grid gap-6 rounded-lg border border-border p-4 md:grid-cols-2">
      <div className="space-y-3">
        <h2 className="text-base font-medium">Order settlement</h2>
        <p className="text-xs text-muted-foreground">
          Uses canonical void reason vocabulary where applicable (see list).
        </p>
        {!boundOrderId ? (
          <div className="space-y-2">
            <Label htmlFor="order-id">Order id</Label>
            <Input id="order-id" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="UUID" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Order <span className="font-mono">{effectiveOrderId.slice(0, 8)}…</span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="from-order">From</Label>
            <select
              id="from-order"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={fromOrder}
              onChange={(e) => setFromOrder(e.target.value)}
            >
              {orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="to-order">To</Label>
            <select
              id="to-order"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={toOrder}
              onChange={(e) => setToOrder(e.target.value)}
            >
              {orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="order-reason">Reason (min 3 chars; pick a void code or free text)</Label>
          <datalist id="void-reasons">
            {ORDER_VOID_REASON_CODES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Input id="order-reason" list="void-reasons" value={orderReason} onChange={(e) => setOrderReason(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idem-order">Idempotency-Key (optional, min 8 chars)</Label>
          <Input id="idem-order" value={idemOrder} onChange={(e) => setIdemOrder(e.target.value)} />
        </div>
        <Button type="button" disabled={loadingOrder} onClick={() => void submitOrderTransition()} aria-label="Apply order transition">
          {loadingOrder ? "Applying…" : "Apply order transition"}
        </Button>
      </div>
      <div className="space-y-3">
        <h2 className="text-base font-medium">Payment lifecycle</h2>
        {!boundPaymentId ? (
          <div className="space-y-2">
            <Label htmlFor="pay-id">Payment id</Label>
            <Input id="pay-id" value={paymentId} onChange={(e) => setPaymentId(e.target.value)} placeholder="UUID" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Payment <span className="font-mono">{effectivePaymentId.slice(0, 8)}…</span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="from-pay">From</Label>
            <select
              id="from-pay"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={fromPay}
              onChange={(e) => setFromPay(e.target.value)}
            >
              {paymentStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="to-pay">To</Label>
            <select
              id="to-pay"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={toPay}
              onChange={(e) => setToPay(e.target.value)}
            >
              {paymentStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pay-reason">Reason</Label>
          <Input id="pay-reason" value={payReason} onChange={(e) => setPayReason(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idem-pay">Idempotency-Key (optional)</Label>
          <Input id="idem-pay" value={idemPay} onChange={(e) => setIdemPay(e.target.value)} />
        </div>
        <Button type="button" disabled={loadingPay} onClick={() => void submitPaymentTransition()} aria-label="Apply payment transition">
          {loadingPay ? "Applying…" : "Apply payment transition"}
        </Button>
      </div>
    </div>
  )
}
