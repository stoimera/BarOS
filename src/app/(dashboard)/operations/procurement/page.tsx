"use client"

import { useState } from "react"
import { OperationsDataTable } from "@/components/operations/OperationsDataTable"
import { ProcurementQuickCreate } from "@/components/operations/ProcurementQuickCreate"

export default function OperationsProcurementPage() {
  const [suppliersRefresh, setSuppliersRefresh] = useState(0)
  const [purchaseOrdersRefresh, setPurchaseOrdersRefresh] = useState(0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Procurement</h1>
        <p className="text-sm text-muted-foreground mt-1">Suppliers and purchase order records.</p>
      </div>
      <ProcurementQuickCreate
        onSuppliersChanged={() => setSuppliersRefresh((n) => n + 1)}
        onPurchaseOrdersChanged={() => setPurchaseOrdersRefresh((n) => n + 1)}
      />
      <OperationsDataTable
        refreshToken={suppliersRefresh}
        endpoint="/api/operations/suppliers"
        title="Suppliers"
        emptyLabel="You have not added suppliers yet — use Quick create above to add your first one."
      />
      <OperationsDataTable
        refreshToken={purchaseOrdersRefresh}
        endpoint="/api/operations/purchase-orders"
        title="Purchase Orders"
        emptyLabel="No delivery orders yet — start a draft from Quick create when you place an order with a supplier."
      />
    </div>
  )
}
