/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

function PublicShell() {
  return (
    <main>
      <h1>Urban Lounge</h1>
      <p>Public marketing shell smoke test for axe (Track 11.12).</p>
      <button type="button" aria-label="Reserve a table">
        Reserve
      </button>
    </main>
  )
}

describe('axe CI smoke (Track 11.12)', () => {
  it('has no detectable violations on a minimal public shell', async () => {
    const { container } = render(<PublicShell />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
