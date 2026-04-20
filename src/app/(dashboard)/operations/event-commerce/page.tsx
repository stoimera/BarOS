import { OperationsDataTable } from "@/components/operations/OperationsDataTable"
import { EventCommerceTools } from "@/components/operations/EventCommerceTools"

export default function OperationsEventCommercePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Event Commerce</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ticket types, discounts, who bought tickets, and marking guests as arrived.
        </p>
      </div>
      <EventCommerceTools />
      <OperationsDataTable
        endpoint="/api/operations/event-ticket-tiers"
        title="Ticket Tiers"
        emptyLabel="No ticket types yet — add GA, VIP, or early bird when you set up an event."
      />
      <OperationsDataTable
        endpoint="/api/operations/event-commerce/promo-codes"
        title="Promo Codes"
        emptyLabel="No discount codes yet — create one when you want a password or limited offer at the door."
      />
      <OperationsDataTable
        endpoint="/api/operations/event-commerce/ticket-sales"
        title="Ticket Sales"
        emptyLabel="No ticket sales yet — sales appear here once guests buy in."
      />
    </div>
  )
}

