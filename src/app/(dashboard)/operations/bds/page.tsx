import { OrdersQueuePanel } from "@/components/operations/OrdersQueuePanel"

export default function OperationsBdsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bar tickets</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Drinks and bar snacks in one queue. Only what you have sent to the bar shows here.
        </p>
      </div>
      <OrdersQueuePanel
        title="Bar queue"
        description="From an open order, send drinks or bar food to the bar — they appear here for the team."
        stationFilter="bar"
      />
    </div>
  )
}
