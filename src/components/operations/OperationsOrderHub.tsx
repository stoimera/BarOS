"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OperationsCheckoutTools } from "@/components/operations/OperationsCheckoutTools"
import { OperationsOrderSettlementPanel } from "@/components/operations/OperationsOrderSettlementPanel"
import { toast } from "sonner"

type OrderItem = {
  id: string
  item_name: string
  quantity: number
  unit_price: number
  line_total: number
  station?: string | null
  menu_item_id?: string | null
}

type OrderDetail = {
  id: string
  status: string
  customer_id?: string | null
  subtotal?: number
  total?: number
  order_items?: OrderItem[] | null
}

type OrderListRow = OrderDetail

type PaymentRow = { id: string; order_id?: string; amount?: number; lifecycle_status?: string }

type TabRow = {
  id: string
  order_id: string | null
  preauth_hold_cents?: number
  preauth_status?: string
  status?: string
}

const stations = ["kitchen", "bar", "service"] as const

function shortId(id: string) {
  return id.slice(0, 8)
}

export function OperationsOrderHub() {
  const [orders, setOrders] = useState<OrderListRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [selectedPaymentId, setSelectedPaymentId] = useState("")
  const [tabs, setTabs] = useState<TabRow[]>([])
  const [selectedTabId, setSelectedTabId] = useState("")
  const [preauthCents, setPreauthCents] = useState("0")
  const [preauthStatus, setPreauthStatus] = useState<string>("none")
  const [loadingList, setLoadingList] = useState(true)
  const [lineAddName, setLineAddName] = useState("")
  const [lineAddQty, setLineAddQty] = useState("1")
  const [lineAddPrice, setLineAddPrice] = useState("0")
  const [lineAddMenuId, setLineAddMenuId] = useState("")
  const [lineAddBusy, setLineAddBusy] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch("/api/operations/orders/list", { cache: "no-store" })
      const j = (await res.json()) as { data?: OrderListRow[]; error?: string }
      if (!res.ok) throw new Error(j.error || "Failed to load orders")
      setOrders(Array.isArray(j.data) ? j.data : [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Orders list failed")
    } finally {
      setLoadingList(false)
    }
  }, [])

  const loadDetail = useCallback(async (orderId: string) => {
    try {
      const [oRes, pRes, tRes] = await Promise.all([
        fetch(`/api/operations/orders/${orderId}`, { cache: "no-store" }),
        fetch(`/api/operations/payments?order_id=${encodeURIComponent(orderId)}`, { cache: "no-store" }),
        fetch(`/api/operations/tabs?order_id=${encodeURIComponent(orderId)}`, { cache: "no-store" }),
      ])
      const oj = (await oRes.json()) as { data?: OrderDetail; error?: string }
      if (!oRes.ok) throw new Error(oj.error || "Order load failed")
      setDetail(oj.data ?? null)
      const pj = (await pRes.json()) as { data?: PaymentRow[]; error?: string }
      setPayments(Array.isArray(pj.data) ? pj.data : [])
      const tj = (await tRes.json()) as { data?: TabRow[]; error?: string }
      const tabRows = Array.isArray(tj.data) ? tj.data : []
      setTabs(tabRows)
      if (tabRows[0]?.id) {
        setSelectedTabId(tabRows[0].id)
        setPreauthCents(String(tabRows[0].preauth_hold_cents ?? 0))
        setPreauthStatus(tabRows[0].preauth_status ?? "none")
      } else {
        setSelectedTabId("")
        setPreauthCents("0")
        setPreauthStatus("none")
      }
      setSelectedPaymentId("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Load failed")
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId)
    else {
      setDetail(null)
      setPayments([])
      setTabs([])
      setSelectedTabId("")
    }
  }, [selectedId, loadDetail])

  const lines = useMemo(() => detail?.order_items ?? [], [detail])

  const saveStation = async (itemId: string, station: string | null) => {
    if (!selectedId) return
    try {
      const res = await fetch(`/api/operations/orders/${selectedId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ station }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error || "Update failed")
      toast.success("Station updated")
      void loadDetail(selectedId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Station failed")
    }
  }

  const createTabForOrder = async () => {
    if (!selectedId) return
    try {
      const res = await fetch("/api/operations/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: selectedId }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error || "Create tab failed")
      toast.success("Tab created for this order")
      void loadDetail(selectedId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create tab failed")
    }
  }

  const savePreauth = async () => {
    if (!selectedTabId) {
      toast.error("No tab for this order")
      return
    }
    try {
      const res = await fetch(`/api/operations/tabs/${selectedTabId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preauth_hold_cents: Number.parseInt(preauthCents, 10) || 0,
          preauth_status: preauthStatus,
        }),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error || "Pre-auth update failed")
      toast.success("Tab pre-authorization saved")
      if (selectedId) void loadDetail(selectedId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pre-auth failed")
    }
  }

  const appendLine = async () => {
    if (!selectedId) return
    const qty = Number.parseInt(lineAddQty, 10)
    const price = Number.parseFloat(lineAddPrice)
    if (!lineAddName.trim() || !Number.isFinite(qty) || qty < 1 || !Number.isFinite(price) || price < 0) {
      toast.error("Name, quantity, and unit price are required")
      return
    }
    setLineAddBusy(true)
    try {
      const body: Record<string, unknown> = {
        item_name: lineAddName.trim(),
        quantity: qty,
        unit_price: price,
      }
      const mid = lineAddMenuId.trim()
      if (mid.length >= 32) body.menu_item_id = mid
      const res = await fetch(`/api/operations/orders/${selectedId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const j = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(j.error || "Add line failed")
      toast.success("Line added")
      setLineAddName("")
      setLineAddMenuId("")
      void loadDetail(selectedId)
      void loadOrders()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Add line failed")
    } finally {
      setLineAddBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order hub</CardTitle>
          <CardDescription>Select an order for tips, splits, stations, settlement, and tab pre-auth.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Recent orders</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadOrders()}>
                Refresh
              </Button>
            </div>
            {loadingList ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders.</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded border border-border p-2 text-sm">
                {orders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      className={`w-full rounded px-2 py-1.5 text-left ${selectedId === o.id ? "bg-muted font-medium" : "hover:bg-muted/60"}`}
                      onClick={() => setSelectedId(o.id)}
                    >
                      <span className="font-mono text-xs">{shortId(o.id)}</span>
                      <span className="text-muted-foreground"> · </span>
                      {o.status}
                      {typeof o.total === "number" ? (
                        <>
                          <span className="text-muted-foreground"> · </span>
                          {Number(o.total).toFixed(2)}
                        </>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-4">
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">Pick an order from the list.</p>
            ) : !detail ? (
              <p className="text-sm text-muted-foreground">Loading order…</p>
            ) : (
              <>
                <p className="text-sm">
                  Order <span className="font-mono text-xs">{detail.id}</span> · {detail.status}
                </p>
                <div className="space-y-2">
                  <Label>Line stations (KDS / BDS)</Label>
                  <ul className="space-y-2">
                    {lines.map((it) => (
                      <li key={it.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="min-w-0 flex-1">
                          {it.item_name} ×{it.quantity}
                        </span>
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                          value={it.station ?? ""}
                          onChange={(e) => {
                            const v = e.target.value
                            void saveStation(it.id, v === "" ? null : v)
                          }}
                        >
                          <option value="">(unset)</option>
                          {stations.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-border p-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Payment for splits</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={selectedPaymentId}
                    onChange={(e) => setSelectedPaymentId(e.target.value)}
                  >
                    <option value="">Select payment…</option>
                    {payments.map((p) => (
                      <option key={p.id} value={p.id}>
                        {shortId(p.id)} · {p.lifecycle_status ?? "?"} · {typeof p.amount === "number" ? Number(p.amount).toFixed(2) : "?"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-md border border-border p-3 space-y-3">
                  <p className="text-sm font-medium">Tab pre-authorization</p>
                  {tabs.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">No tab linked to this order yet.</p>
                      <Button type="button" size="sm" variant="secondary" onClick={() => void createTabForOrder()}>
                        Create tab for this order
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="tab-pick">Tab</Label>
                        <select
                          id="tab-pick"
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          value={selectedTabId}
                          onChange={(e) => {
                            const id = e.target.value
                            setSelectedTabId(id)
                            const t = tabs.find((x) => x.id === id)
                            if (t) {
                              setPreauthCents(String(t.preauth_hold_cents ?? 0))
                              setPreauthStatus(t.preauth_status ?? "none")
                            }
                          }}
                        >
                          {tabs.map((t) => (
                            <option key={t.id} value={t.id}>
                              {shortId(t.id)} · {t.status ?? "?"}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="pre-c">Hold (cents)</Label>
                          <Input id="pre-c" value={preauthCents} onChange={(e) => setPreauthCents(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="pre-s">Status</Label>
                          <select
                            id="pre-s"
                            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                            value={preauthStatus}
                            onChange={(e) => setPreauthStatus(e.target.value)}
                          >
                            {["none", "pending", "captured", "released", "failed"].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <Button type="button" size="sm" variant="secondary" onClick={() => void savePreauth()}>
                        Save pre-auth
                      </Button>
                    </>
                  )}
                </div>
                <div className="rounded-md border border-border p-3 space-y-2">
                  <p className="text-sm font-medium">Add line / close order</p>
                  <p className="text-xs text-muted-foreground">
                    Age-restricted menu lines require <span className="font-mono">customer_id</span> on the order and
                    <span className="font-mono"> menu_item_id</span> on the line when adding items; closing the order enforces the same rules across all linked menu items.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="ln">Item name</Label>
                      <Input id="ln" value={lineAddName} onChange={(e) => setLineAddName(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="lm">Menu item id (optional)</Label>
                      <Input id="lm" value={lineAddMenuId} onChange={(e) => setLineAddMenuId(e.target.value)} placeholder="UUID for age guard" />
                    </div>
                    <div>
                      <Label htmlFor="lq">Qty</Label>
                      <Input id="lq" value={lineAddQty} onChange={(e) => setLineAddQty(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="lp">Unit price</Label>
                      <Input id="lp" value={lineAddPrice} onChange={(e) => setLineAddPrice(e.target.value)} />
                    </div>
                  </div>
                  <Button type="button" size="sm" disabled={lineAddBusy} onClick={() => void appendLine()}>
                    {lineAddBusy ? "Adding…" : "Add line"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedId ? (
        <>
          <OperationsCheckoutTools
            boundOrderId={selectedId}
            boundPaymentId={selectedPaymentId}
            orderLines={lines.map((l) => ({ id: l.id, line_total: Number(l.line_total), item_name: l.item_name }))}
          />
          <OperationsOrderSettlementPanel boundOrderId={selectedId} boundPaymentId={selectedPaymentId} />
        </>
      ) : null}
    </div>
  )
}
