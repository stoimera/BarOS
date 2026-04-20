import { OperationsDataTable } from "@/components/operations/OperationsDataTable"
import { OperationsOrderHub } from "@/components/operations/OperationsOrderHub"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OperationsOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Orders & payments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run tabs from open to paid: add items, move tickets between kitchen and bar screens, split checks, add tips,
          and settle cards — all from the hub below. Lists show recent orders and payments for the venue.
        </p>
      </div>
      <OperationsOrderHub />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tips for a smooth shift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-2">
            <li>Always pick a reason when you void, refund, or change order state — the log stays with the ticket.</li>
            <li>
              If a card reader or network hiccups and you tap Pay twice, use the same idempotency key on the retry so
              you do not double-charge (your POS integration handles the key).
            </li>
            <li>Order history and line changes are kept automatically for managers to review later.</li>
          </ul>
          <Button variant="outline" size="sm" asChild>
            <Link href="/operations">Back to Administrative Operations</Link>
          </Button>
        </CardContent>
      </Card>
      <OperationsDataTable
        endpoint="/api/operations/orders/list"
        title="Orders"
        emptyLabel="Nothing to show yet — open tabs will appear here as staff ring sales through."
      />
      <OperationsDataTable
        endpoint="/api/operations/payments"
        title="Payments"
        emptyLabel="No payments in this list yet — they appear when you take card or cash on an order."
      />
    </div>
  )
}
