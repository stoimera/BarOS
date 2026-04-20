import { OperationsDataTable } from "@/components/operations/OperationsDataTable"
import { FloorPlanPanel } from "@/components/operations/FloorPlanPanel"

export default function OperationsTablesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Table Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Floor plan, table sizes, and whether a table already has an open tab.
        </p>
      </div>
      <FloorPlanPanel />
      <OperationsDataTable
        endpoint="/api/operations/tables"
        searchParams="include_usage=1"
        title="Tables"
        emptyLabel="No tables yet — set up sections and table numbers so the floor plan can show who sits where."
      />
    </div>
  )
}

