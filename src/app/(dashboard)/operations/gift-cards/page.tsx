"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserRole } from "@/hooks/useUserRole"

type Row = {
  id: string
  balance_cents: number
  currency: string
  status: string
  issued_at: string
  expires_at: string | null
  customer_id: string | null
}

export default function OperationsGiftCardsPage() {
  const { role } = useUserRole()
  const isAdmin = role === "admin"
  const [rows, setRows] = useState<Row[]>([])
  const [cents, setCents] = useState("5000")
  const [code, setCode] = useState("")
  const [redeemCode, setRedeemCode] = useState("")
  const [redeemAmt, setRedeemAmt] = useState("500")
  const [msg, setMsg] = useState<string | null>(null)

  const load = () => {
    void fetch("/api/operations/gift-cards", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setRows(j.data as Row[])
      })
      .catch(() => setMsg("Failed to load"))
  }

  useEffect(() => {
    load()
  }, [])

  const issue = async () => {
    setMsg(null)
    if (!code || code.length < 6) {
      setMsg("Plain code must be at least 6 characters (stored as SHA-256 only).")
      return
    }
    const res = await fetch("/api/operations/gift-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initial_cents: Number(cents), plain_code: code }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg((j as { error?: string }).error || "Issue failed")
      return
    }
    setMsg("Issued. Plain code is not stored; hand it to the purchaser securely.")
    setCode("")
    load()
  }

  const redeem = async () => {
    setMsg(null)
    if (!redeemCode || redeemCode.length < 6) {
      setMsg("Redeem: code min 6 chars")
      return
    }
    const res = await fetch("/api/operations/gift-cards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plain_code: redeemCode, amount_cents: Number(redeemAmt) || 0 }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg((j as { error?: string }).error || "Redeem failed")
      return
    }
    setMsg("Redemption applied.")
    setRedeemCode("")
    load()
  }

  const voidCard = async (id: string) => {
    if (!isAdmin) return
    setMsg(null)
    const res = await fetch(`/api/operations/gift-cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "void" }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg((j as { error?: string }).error || "Void failed")
      return
    }
    setMsg("Card voided.")
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gift cards</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Issue and void are for managers; staff can redeem a guest&apos;s code at the till. Codes are stored securely
          — write the code on the physical card or receipt for the guest.
        </p>
      </div>
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issue card</CardTitle>
            <CardDescription>Initial balance in cents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="gc-cents">Opening balance (cents)</Label>
              <Input id="gc-cents" value={cents} onChange={(e) => setCents(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gc-code">Code on card (at least 6 characters)</Label>
              <Input id="gc-code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
            </div>
            <Button type="button" onClick={() => void issue()}>
              Issue
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Redeem</CardTitle>
          <CardDescription>Enter the guest&apos;s code and how much to take off their balance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="rc">Plain code</Label>
            <Input id="rc" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra">Amount (cents)</Label>
            <Input id="ra" value={redeemAmt} onChange={(e) => setRedeemAmt(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" onClick={() => void redeem()}>
            Redeem
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent cards</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                <span className="font-mono text-xs">{r.id.slice(0, 8)}…</span>
                <span>
                  {(r.balance_cents / 100).toFixed(2)} {r.currency} · {r.status}
                </span>
                {isAdmin && r.status === "active" ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => void voidCard(r.id)}>
                    Void
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  )
}
