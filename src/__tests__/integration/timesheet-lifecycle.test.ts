import { nextTimesheetStatus } from '@/lib/operations/timesheet-lifecycle'

describe('timesheet lifecycle (Track 7.5)', () => {
  it('advances draft → submitted → approved → locked', () => {
    expect(nextTimesheetStatus('draft', 'submit')).toBe('submitted')
    expect(nextTimesheetStatus('submitted', 'approve')).toBe('approved')
    expect(nextTimesheetStatus('approved', 'lock')).toBe('locked')
  })

  it('allows admin reopen from submitted to draft', () => {
    expect(nextTimesheetStatus('submitted', 'reopen')).toBe('draft')
  })

  it('rejects invalid transitions', () => {
    expect(nextTimesheetStatus('draft', 'approve')).toBeNull()
    expect(nextTimesheetStatus('locked', 'submit')).toBeNull()
  })
})
