import { OperationsDataTable } from "@/components/operations/OperationsDataTable"
import { StocktakeVarianceBlock } from "@/components/operations/StocktakeVarianceBlock"

export default function OperationsStockControlPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Stocktakes and waste/spillage tracking.</p>
      </div>
      <StocktakeVarianceBlock />
      <OperationsDataTable
        endpoint="/api/operations/stocktakes"
        title="Stocktakes"
        emptyLabel="No counts filed yet — run a stocktake when you want to reconcile the cellar or bar."
      />
      <OperationsDataTable
        endpoint="/api/operations/inventory-waste"
        title="Inventory Waste"
        emptyLabel="No waste logged yet — record spills or pour-off here when you need it for the books."
      />
    </div>
  )
}

