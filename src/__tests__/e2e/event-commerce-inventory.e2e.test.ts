import { simulateConcurrentReservations } from '@/lib/operations/ticket-inventory'

describe('event commerce concurrent inventory behavior', () => {
  it('never oversells when concurrent reservations exceed inventory', () => {
    const attempts = [
      { requestId: 'a', quantity: 4 },
      { requestId: 'b', quantity: 4 },
      { requestId: 'c', quantity: 4 },
      { requestId: 'd', quantity: 1 },
    ]
    const results = simulateConcurrentReservations(10, attempts)

    const accepted = results.filter((r) => r.accepted)
    const sold = accepted.reduce((sum, result) => {
      const attempt = attempts.find((a) => a.requestId === result.requestId)
      return sum + (attempt?.quantity ?? 0)
    }, 0)

    expect(sold).toBeLessThanOrEqual(10)
    expect(results[results.length - 1].remaining).toBeGreaterThanOrEqual(0)
  })

  it('rejects requests once inventory is exhausted', () => {
    const results = simulateConcurrentReservations(2, [
      { requestId: 'x', quantity: 1 },
      { requestId: 'y', quantity: 1 },
      { requestId: 'z', quantity: 1 },
    ])

    expect(results[0].accepted).toBe(true)
    expect(results[1].accepted).toBe(true)
    expect(results[2].accepted).toBe(false)
    expect(results[2].remaining).toBe(0)
  })
})

