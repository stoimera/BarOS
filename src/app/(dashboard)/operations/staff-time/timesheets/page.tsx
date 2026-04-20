import { OperationsDataTable } from "@/components/operations/OperationsDataTable"
import { StaffTimesheetActions } from "@/components/operations/StaffTimesheetActions"

export default function StaffTimeTimesheetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Timesheets</h1>
        <p className="text-sm text-muted-foreground mt-1">Draft through locked lifecycle; admins approve and lock.</p>
      </div>
      <StaffTimesheetActions />
      <OperationsDataTable endpoint="/api/operations/timesheets" title="Timesheet records" emptyLabel="No timesheets submitted yet — they appear here once staff send them for approval." />
    </div>
  )
}
