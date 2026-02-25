/**
 * Tests for PropertyCard (components/PropertyCard.tsx)
 * Test plan: M3-27 through M3-32
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PropertyCard } from '../../src/components/PropertyCard';
import { Property } from '../../src/types';

const fakeProperty: Property = {
  id: 'p1',
  ownerId: 'u1',
  agencyId: null,
  title: '3BR in Tel Aviv',
  description: 'Nice apartment',
  propertyType: 'apartment',
  status: 'active',
  price: 2500000,
  currency: 'ILS',
  address: '123 Dizengoff',
  city: 'Tel Aviv',
  neighborhood: 'Center',
  areaSqm: 85,
  rooms: 4,
  bedrooms: 3,
  bathrooms: 1,
  floor: 5,
  totalFloors: 8,
  yearBuilt: 2010,
  parking: 1,
  elevator: true,
  balcony: true,
  garden: false,
  aircon: true,
  furnished: false,
  metadata: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('PropertyCard', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  // M3-27
  it('M3-27: renders property title', () => {
    render(<PropertyCard property={fakeProperty} onPress={mockOnPress} />);
    expect(screen.getByText('3BR in Tel Aviv')).toBeTruthy();
  });

  // M3-28
  it('M3-28: renders property address/city', () => {
    render(<PropertyCard property={fakeProperty} onPress={mockOnPress} />);
    expect(screen.getByText(/123 Dizengoff.*Tel Aviv/)).toBeTruthy();
  });

  // M3-29
  it('M3-29: renders price formatted', () => {
    render(<PropertyCard property={fakeProperty} onPress={mockOnPress} />);
    // ILS 2,500,000 — the exact format depends on Intl, but should contain 2,500,000
    expect(screen.getByText(/2,500,000/)).toBeTruthy();
  });

  // M3-30
  it('M3-30: renders status badge', () => {
    render(<PropertyCard property={fakeProperty} onPress={mockOnPress} />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  // M3-31
  it('M3-31: renders property type label', () => {
    render(<PropertyCard property={fakeProperty} onPress={mockOnPress} />);
    expect(screen.getByText('Apartment')).toBeTruthy();
  });

  // M3-32
  it('M3-32: tap calls onPress callback', () => {
    render(<PropertyCard property={fakeProperty} onPress={mockOnPress} />);
    // Press the whole card
    fireEvent.press(screen.getByText('3BR in Tel Aviv'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('renders "Price TBD" when price is null', () => {
    const noPrice = { ...fakeProperty, price: null };
    render(<PropertyCard property={noPrice} onPress={mockOnPress} />);
    expect(screen.getByText('Price TBD')).toBeTruthy();
  });

  it('renders room details', () => {
    render(<PropertyCard property={fakeProperty} onPress={mockOnPress} />);
    expect(screen.getByText(/4 rooms/)).toBeTruthy();
  });
});
