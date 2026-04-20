import { OperationsDataTable } from "@/components/operations/OperationsDataTable"

export default function OperationsLocationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Locations</h1>
        <p className="text-sm text-muted-foreground mt-1">Multi-location base entities and partitioning anchors.</p>
      </div>
      <OperationsDataTable endpoint="/api/operations/locations" title="Locations" emptyLabel="No sites added yet — add your bar or room here when you are ready to use more than one location." />
    </div>
  )
}

