import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/testUtils'
import { ServiceCard, StylistCard, BookingCard } from './cards'

describe('ServiceCard', () => {
  it('renders service details correctly', () => {
    render(
      <ServiceCard
        title="Haircut"
        description="Professional haircut"
        price={50}
        duration={60}
      />
    )
    expect(screen.getByText('Haircut')).toBeInTheDocument()
    expect(screen.getByText('Professional haircut')).toBeInTheDocument()
    expect(screen.getByText('$50')).toBeInTheDocument()
  })

  it('shows popular badge when popular=true', () => {
    render(
      <ServiceCard
        title="Haircut"
        price={50}
        popular={true}
      />
    )
    expect(screen.getByText(/Popular/i)).toBeInTheDocument()
  })
})

describe('StylistCard', () => {
  it('renders stylist information', () => {
    render(
      <StylistCard
        name="Jane Doe"
        title="Master Stylist"
        rating={4.8}
        reviewCount={120}
        location="New York"
      />
    )

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Master Stylist')).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('(120)')).toBeInTheDocument()
  })

  it('shows verified badge when verified=true', () => {
    const { container } = render(
      <StylistCard
        name="Jane Doe"
        verified={true}
      />
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('BookingCard', () => {
  it('renders booking details', () => {
    render(
      <BookingCard
        serviceName="Haircut"
        stylistName="Jane Doe"
        date="2025-10-25"
        time="10:00 AM"
        status="confirmed"
        price={50}
      />
    )

    expect(screen.getByText('Haircut')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(screen.getByText('$50')).toBeInTheDocument()
  })
})
