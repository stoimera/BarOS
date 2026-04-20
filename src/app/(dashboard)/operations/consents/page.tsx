import { OperationsDataTable } from "@/components/operations/OperationsDataTable"

export default function OperationsConsentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Consent Ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">Channel-level compliance events and history.</p>
      </div>
      <OperationsDataTable endpoint="/api/operations/consents/list" title="Consents" emptyLabel="Nothing logged yet — when guests opt in or out of marketing, it will show here." />
    </div>
  )
}

