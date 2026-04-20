export type TimesheetLifecycleStatus = 'draft' | 'submitted' | 'approved' | 'locked'

export function nextTimesheetStatus(
  from: TimesheetLifecycleStatus,
  action: 'submit' | 'approve' | 'lock' | 'reopen'
): TimesheetLifecycleStatus | null {
  if (action === 'submit' && from === 'draft') return 'submitted'
  if (action === 'approve' && from === 'submitted') return 'approved'
  if (action === 'lock' && from === 'approved') return 'locked'
  if (action === 'reopen' && from === 'submitted') return 'draft'
  return null
}
