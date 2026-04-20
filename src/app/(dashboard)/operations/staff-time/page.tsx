import { OperationsDataTable } from "@/components/operations/OperationsDataTable"
import { StaffTimePanel } from "@/components/operations/StaffTimePanel"

export default function OperationsStaffTimePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Staff Time</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clock in and out, breaks, odd-hour flags for managers, and timesheet approval.
        </p>
      </div>
      <StaffTimePanel />
      <OperationsDataTable
        endpoint="/api/operations/attendance-logs"
        title="Recent attendance"
        emptyLabel="No clock events yet — staff punches will show here after they clock in."
      />
    </div>
  )
}
