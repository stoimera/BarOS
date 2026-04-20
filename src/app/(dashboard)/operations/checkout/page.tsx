import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OperationsCheckoutTools } from "@/components/operations/OperationsCheckoutTools"

export default function OperationsCheckoutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Checkout & splits</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add tips and split one payment across items. For a guided flow with the ticket on screen, use{" "}
          <Link href="/operations/orders" className="text-primary underline">
            Orders & payments
          </Link>
          . This page works on its own using the lists below.
        </p>
      </div>
      <OperationsCheckoutTools />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders & payments</CardTitle>
            <CardDescription>Open the hub to pick a tab, then use tips and split tools there.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Link href="/operations/orders" className="text-primary underline">
              Open orders list
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
