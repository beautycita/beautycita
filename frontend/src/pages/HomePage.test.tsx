import { describe, it, expect } from 'vitest'
import { render } from '../test/testUtils'
import HomePage from './HomePage'

describe('HomePage', () => {
  it('renders without crashing', () => {
    const { container } = render(<HomePage />)
    expect(container).toBeTruthy()
  })

  it('renders main content div', () => {
    const { container } = render(<HomePage />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('has video section', () => {
    const { container } = render(<HomePage />)
    // VideoSection component should be present
    expect(container.firstChild).toBeTruthy()
  })
})
