import { OrdersQueuePanel } from "@/components/operations/OrdersQueuePanel"

export default function OperationsKdsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kitchen tickets</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          What the kitchen is cooking next, in order. Only dishes you have sent to the kitchen appear here.
        </p>
      </div>
      <OrdersQueuePanel
        title="Kitchen queue"
        description="From an open order, send each dish to the kitchen — it will show up here for the pass."
        stationFilter="kitchen"
      />
    </div>
  )
}
