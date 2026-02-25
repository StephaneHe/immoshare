/**
 * Tests for PropertyListScreen (screens/Properties/PropertyListScreen.tsx)
 * Test plan: M3-17 through M3-26
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PropertyListScreen } from '../../src/screens/Properties/PropertyListScreen';
import { usePropertyStore } from '../../src/stores/property.store';
import { Property } from '../../src/types';

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;

const mockRoute = { params: {} } as any;

jest.mock('../../src/stores/property.store');
const mockUsePropertyStore = usePropertyStore as unknown as jest.Mock;

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

function setupStore(overrides = {}) {
  const defaults = {
    properties: [] as Property[],
    total: 0,
    isLoading: false,
    error: null,
    fetchProperties: jest.fn(),
    fetchNextPage: jest.fn(),
    clearError: jest.fn(),
  };
  const store = { ...defaults, ...overrides };
  mockUsePropertyStore.mockReturnValue(store);
  return store;
}

beforeEach(() => jest.clearAllMocks());

describe('PropertyListScreen', () => {
  // M3-17
  it('M3-17: renders search input', () => {
    setupStore();
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    expect(screen.getByPlaceholderText('Search properties...')).toBeTruthy();
  });

  // M3-18
  it('M3-18: renders status filter chips', () => {
    setupStore();
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();
  });

  // M3-19
  it('M3-19: shows empty state when list empty and not loading', () => {
    setupStore({ properties: [], total: 0, isLoading: false });
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    expect(screen.getByText('No properties yet')).toBeTruthy();
  });

  // M3-20
  it('M3-20: renders PropertyCard for each property', () => {
    setupStore({
      properties: [fakeProperty, { ...fakeProperty, id: 'p2', title: 'Studio Jaffa' }],
      total: 2,
    });
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    expect(screen.getByText('3BR in Tel Aviv')).toBeTruthy();
    expect(screen.getByText('Studio Jaffa')).toBeTruthy();
  });

  // M3-23
  it('M3-23: FAB (+) navigates to PropertyCreate', () => {
    setupStore();
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    fireEvent.press(screen.getByText('+'));
    expect(mockNavigate).toHaveBeenCalledWith('PropertyCreate');
  });

  // M3-24
  it('M3-24: tap PropertyCard navigates to PropertyDetail', () => {
    setupStore({ properties: [fakeProperty], total: 1 });
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    fireEvent.press(screen.getByText('3BR in Tel Aviv'));
    expect(mockNavigate).toHaveBeenCalledWith('PropertyDetail', { id: 'p1' });
  });

  // M3-25
  it('M3-25: shows result count', () => {
    setupStore({ properties: [fakeProperty], total: 1 });
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    expect(screen.getByText('1 property')).toBeTruthy();
  });

  // M3-26
  it('M3-26: shows error banner on API failure', () => {
    setupStore({ error: 'Network error' });
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    expect(screen.getByText('Network error — tap to dismiss')).toBeTruthy();
  });

  it('shows plural "properties" for count > 1', () => {
    setupStore({
      properties: [fakeProperty, { ...fakeProperty, id: 'p2', title: 'Studio' }],
      total: 2,
    });
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    expect(screen.getByText('2 properties')).toBeTruthy();
  });

  it('calls fetchProperties on mount', () => {
    const store = setupStore();
    render(<PropertyListScreen navigation={mockNavigation} route={mockRoute} />);
    expect(store.fetchProperties).toHaveBeenCalled();
  });
});
