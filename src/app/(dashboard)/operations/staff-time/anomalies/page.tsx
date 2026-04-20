import { OperationsDataTable } from "@/components/operations/OperationsDataTable"

export default function StaffTimeAnomaliesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance anomalies</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rows flagged for review (long shifts, invalid ranges). Staff see their own; admins may filter by staff in the API.
        </p>
      </div>
      <OperationsDataTable
        endpoint="/api/operations/attendance-logs"
        searchParams="anomalies_only=1"
        title="Anomaly queue"
        emptyLabel="No odd shifts flagged — very long or unusual punches will list here for managers."
      />
    </div>
  )
}
