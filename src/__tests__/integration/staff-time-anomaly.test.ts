/**
 * @jest-environment node
 */
import { evaluateAttendanceAnomaly } from '@/lib/operations/staff-time'

describe('staff time anomaly evaluation (Track 7.4)', () => {
  it('flags very long shifts', () => {
    const inT = '2026-01-01T08:00:00Z'
    const outT = '2026-01-02T02:00:00Z'
    const r = evaluateAttendanceAnomaly(inT, outT)
    expect(r.flag).toBe(true)
    expect(r.reason).toBe('shift_over_16h')
  })

  it('accepts normal shift length', () => {
    const r = evaluateAttendanceAnomaly('2026-01-01T09:00:00Z', '2026-01-01T17:00:00Z')
    expect(r.flag).toBe(false)
  })
})
