export interface ReservationAttempt {
  quantity: number
  requestId: string
}

export interface ReservationResult {
  requestId: string
  accepted: boolean
  remaining: number
}

export function reserveInventory(currentInventory: number, quantity: number): { accepted: boolean; remaining: number } {
  if (quantity <= 0) {
    return { accepted: false, remaining: currentInventory }
  }
  if (currentInventory < quantity) {
    return { accepted: false, remaining: currentInventory }
  }
  return { accepted: true, remaining: currentInventory - quantity }
}

export function simulateConcurrentReservations(
  initialInventory: number,
  attempts: ReservationAttempt[]
): ReservationResult[] {
  let remaining = initialInventory
  return attempts.map((attempt) => {
    const outcome = reserveInventory(remaining, attempt.quantity)
    remaining = outcome.remaining
    return {
      requestId: attempt.requestId,
      accepted: outcome.accepted,
      remaining,
    }
  })
}

