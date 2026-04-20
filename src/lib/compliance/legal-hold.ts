import { createServiceRoleClient } from '@/utils/supabase/service-role'

export class LegalHoldError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LegalHoldError'
  }
}

/** Throws if the customer is on legal hold or missing. */
export async function assertNotLegalHold(customerId: string): Promise<void> {
  const supabase = await createServiceRoleClient()
  const { data, error } = await supabase
    .from('customers')
    .select('legal_hold, legal_hold_reason')
    .eq('id', customerId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Customer not found')
  if (data.legal_hold === true) {
    const reason =
      typeof data.legal_hold_reason === 'string' && data.legal_hold_reason.length > 0
        ? data.legal_hold_reason
        : null
    throw new LegalHoldError(reason ? `Customer is under legal hold: ${reason}` : 'Customer is under legal hold')
  }
}
