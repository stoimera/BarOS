"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserRole } from "@/hooks/useUserRole"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Plan = { id: string; name: string; billing_interval: string; is_active: boolean }

type StatusPayload = {
  plans: Plan[]
  subscriptions_active: number
  message?: string
}

export default function OperationsMembershipsPage() {
  const { role } = useUserRole()
  const isAdmin = role === "admin"
  const [status, setStatus] = useState<StatusPayload | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [planName, setPlanName] = useState("House membership")
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly")
  const [custId, setCustId] = useState("")
  const [planId, setPlanId] = useState("")
  const [msg, setMsg] = useState<string | null>(null)

  const load = async () => {
    const [sRes, pRes] = await Promise.all([
      fetch("/api/operations/memberships/status", { cache: "no-store" }),
      fetch("/api/operations/memberships/plans", { cache: "no-store" }),
    ])
    const sj = await sRes.json()
    const pj = await pRes.json()
    if (sRes.ok && sj.data) setStatus(sj.data as StatusPayload)
    if (pRes.ok && pj.data) setPlans(pj.data as Plan[])
  }

  useEffect(() => {
    void load()
  }, [])

  const createPlan = async () => {
    setMsg(null)
    const res = await fetch("/api/operations/memberships/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: planName.trim(), billing_interval: interval }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg((j as { error?: string }).error || "Could not create plan")
      return
    }
    setMsg("Plan created.")
    void load()
  }

  const assign = async () => {
    setMsg(null)
    if (!custId.trim() || !planId.trim()) {
      setMsg("Choose a customer ID and a plan.")
      return
    }
    const res = await fetch("/api/operations/memberships/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: custId.trim(), plan_id: planId.trim() }),
    })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg((j as { error?: string }).error || "Could not assign membership")
      return
    }
    setMsg("Membership saved for that customer.")
    void load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Memberships</h1>
        <p className="text-muted-foreground mt-1 text-sm">Plans and who is subscribed.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
          <CardDescription>Live counts and plan names for this venue.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {status ? (
            <>
              <p>Active memberships: {status.subscriptions_active}</p>
              {status.message ? <p className="text-muted-foreground text-xs">{status.message}</p> : null}
              <ul className="list-disc pl-4">
                {(status.plans || []).map((p) => (
                  <li key={p.id}>
                    {p.name} · {p.billing_interval === "monthly" ? "Monthly" : p.billing_interval === "annual" ? "Annual" : p.billing_interval}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted-foreground">Loading…</p>
          )}
        </CardContent>
      </Card>
      {isAdmin ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create plan</CardTitle>
              <CardDescription>Name it how guests will see it on the bill or app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="pn" className="text-sm font-medium">
                  Name
                </Label>
                <Input id="pn" value={planName} onChange={(e) => setPlanName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bi" className="text-sm font-medium">
                  Billing
                </Label>
                <select
                  id="bi"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value as typeof interval)}
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <Button type="button" onClick={() => void createPlan()}>
                Create plan
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Put a guest on a plan</CardTitle>
              <CardDescription>Admins only — links an existing customer record to a plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="cid" className="text-sm font-medium">
                  Customer ID
                </Label>
                <Input
                  id="cid"
                  value={custId}
                  onChange={(e) => setCustId(e.target.value)}
                  placeholder="From Customers → open their profile"
                />
                <p className="text-xs text-muted-foreground">Copy the ID from the customer profile if you are not sure.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Plan</Label>
                <Select value={planId || undefined} onValueChange={setPlanId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.billing_interval === "monthly" ? "monthly" : p.billing_interval === "annual" ? "annual" : p.billing_interval})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="secondary" onClick={() => void assign()}>
                Save assignment
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Creating plans and assigning members is limited to admins.</p>
      )}
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </div>
  )
}
