/**
 * @jest-environment node
 */
import { assertCustomerMeetsMinAge } from '@/lib/operations/age-sale-guard'

describe('assertCustomerMeetsMinAge (Track 10.15)', () => {
  it('allows when min age is zero', () => {
    expect(assertCustomerMeetsMinAge({ customerDateOfBirth: null, minAge: 0 }).ok).toBe(true)
  })

  it('rejects missing DOB when min age required', () => {
    const r = assertCustomerMeetsMinAge({ customerDateOfBirth: null, minAge: 18 })
    expect(r.ok).toBe(false)
  })

  it('rejects underage', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 17)
    const r = assertCustomerMeetsMinAge({ customerDateOfBirth: dob, minAge: 18 })
    expect(r.ok).toBe(false)
  })

  it('allows adult', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 22)
    const r = assertCustomerMeetsMinAge({ customerDateOfBirth: dob, minAge: 18 })
    expect(r.ok).toBe(true)
  })
})
