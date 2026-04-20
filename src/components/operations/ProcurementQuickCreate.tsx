"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const NO_SUPPLIER = "__none__"

type SupplierRow = {
  id: string
  name?: string | null
  contact_name?: string | null
}

type ProcurementQuickCreateProps = {
  onSuppliersChanged?: () => void
  onPurchaseOrdersChanged?: () => void
}

function supplierLabel(s: SupplierRow): string {
  const company = s.name?.trim() || `Supplier …${s.id.slice(-6)}`
  const person = s.contact_name?.trim()
  return person ? `${company} (${person})` : company
}

export function ProcurementQuickCreate({
  onSuppliersChanged,
  onPurchaseOrdersChanged,
}: ProcurementQuickCreateProps) {
  const [company, setCompany] = useState("")
  const [contactName, setContactName] = useState("")
  const [supplierPhone, setSupplierPhone] = useState("")
  const [supplierEmail, setSupplierEmail] = useState("")
  const [loadingSupplier, setLoadingSupplier] = useState(false)
  const [poSupplierId, setPoSupplierId] = useState("")
  const [loadingPo, setLoadingPo] = useState(false)
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])

  const loadSuppliers = useCallback(async () => {
    try {
      const res = await fetch("/api/operations/suppliers", { cache: "no-store" })
      const json = (await res.json()) as { data?: SupplierRow[] }
      if (res.ok && Array.isArray(json.data)) setSuppliers(json.data)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadSuppliers()
  }, [loadSuppliers])

  async function createSupplier() {
    if (!company.trim()) {
      toast.error("Company is required")
      return
    }
    if (!supplierPhone.trim()) {
      toast.error("Phone number is required")
      return
    }
    setLoadingSupplier(true)
    try {
      const body: {
        name: string
        contact_phone: string
        contact_email?: string
        contact_name?: string
      } = {
        name: company.trim(),
        contact_phone: supplierPhone.trim(),
      }
      if (supplierEmail.trim()) body.contact_email = supplierEmail.trim()
      if (contactName.trim()) body.contact_name = contactName.trim()
      const res = await fetch("/api/operations/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { data?: { id?: string; name?: string }; error?: string }
      if (!res.ok) throw new Error(json.error || "Create failed")
      toast.success("Supplier created")
      if (json.data?.id) setPoSupplierId(json.data.id)
      await loadSuppliers()
      onSuppliersChanged?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Supplier create failed")
    } finally {
      setLoadingSupplier(false)
    }
  }

  async function createDraftPo() {
    setLoadingPo(true)
    try {
      const body: { supplier_id?: string | null } = {}
      if (poSupplierId.trim()) body.supplier_id = poSupplierId.trim()
      else body.supplier_id = null
      const res = await fetch("/api/operations/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, status: "draft" }),
      })
      const json = (await res.json()) as { data?: { id?: string }; error?: string }
      if (!res.ok) throw new Error(json.error || "Create failed")
      toast.success("Draft purchase order created")
      onPurchaseOrdersChanged?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PO create failed")
    } finally {
      setLoadingPo(false)
    }
  }

  const selectValue = poSupplierId.trim() ? poSupplierId : NO_SUPPLIER

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick create</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">New supplier</h3>
          <div className="space-y-2">
            <Label htmlFor="qc-supplier-company" className="text-sm font-medium">
              Company
            </Label>
            <Input id="qc-supplier-company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qc-supplier-contact-name" className="text-sm font-medium">
              Name (optional)
            </Label>
            <Input
              id="qc-supplier-contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact person"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qc-supplier-phone" className="text-sm font-medium">
              Phone number
            </Label>
            <Input
              id="qc-supplier-phone"
              type="tel"
              autoComplete="tel"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qc-supplier-email" className="text-sm font-medium">
              Contact email (optional)
            </Label>
            <Input
              id="qc-supplier-email"
              type="email"
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
            />
          </div>
          <Button type="button" disabled={loadingSupplier} onClick={() => void createSupplier()}>
            {loadingSupplier ? "Creating…" : "Create supplier"}
          </Button>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Draft purchase order</h3>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Supplier (optional)</Label>
            <Select
              value={selectValue}
              onValueChange={(v) => setPoSupplierId(v === NO_SUPPLIER ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SUPPLIER}>No supplier — blank draft</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {supplierLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Create a supplier on the left first if they are not in the list yet.
            </p>
          </div>
          <Button type="button" disabled={loadingPo} variant="secondary" onClick={() => void createDraftPo()}>
            {loadingPo ? "Creating…" : "Create draft PO"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
