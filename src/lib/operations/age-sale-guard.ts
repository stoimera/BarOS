/**
 * Age verification helper for alcohol-linked sales (Track 10.15).
 * Callers should pass the customer's date of birth and the menu item minimum age.
 */
export function assertCustomerMeetsMinAge(params: {
  customerDateOfBirth: Date | null | undefined
  minAge: number
}): { ok: true } | { ok: false; message: string } {
  const { customerDateOfBirth, minAge } = params
  if (!minAge || minAge <= 0) return { ok: true }
  if (!customerDateOfBirth || Number.isNaN(customerDateOfBirth.getTime())) {
    return { ok: false, message: 'Customer date of birth is required for this item' }
  }
  const today = new Date()
  let age = today.getFullYear() - customerDateOfBirth.getFullYear()
  const m = today.getMonth() - customerDateOfBirth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < customerDateOfBirth.getDate())) {
    age -= 1
  }
  if (age < minAge) {
    return { ok: false, message: `Customer must be at least ${minAge} years old` }
  }
  return { ok: true }
}
