export default function StaffTimePayrollPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">Payroll export</h1>
      <p className="text-sm text-muted-foreground">
        CSV export is only available after a timesheet is locked. Use the Timesheets tab for draft, submit, approve, and
        lock, then download the CSV for that timesheet id. Re-export returns HTTP 409 once payroll_exported_at is set.
      </p>
    </div>
  )
}
