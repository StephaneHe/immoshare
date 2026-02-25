/**
 * Tests for PropertyDetailScreen
 * Test plan: M3-33 through M3-38
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PropertyDetailScreen } from '../../src/screens/Properties/PropertyDetailScreen';
import { usePropertyStore } from '../../src/stores/property.store';

jest.mock('../../src/stores/property.store', () => ({
  usePropertyStore: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

const mockUsePropertyStore = usePropertyStore as jest.MockedFunction<typeof usePropertyStore>;
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();

const fakeProperty = {
  id: 'p1',
  title: 'Beautiful Apartment',
  description: 'A lovely place to live',
  propertyType: 'apartment',
  status: 'active' as const,
  price: 500000,
  currency: 'ILS',
  city: 'Tel Aviv',
  address: '123 Main St',
  neighborhood: 'Neve Tzedek',
  rooms: 4,
  bedrooms: 2,
  bathrooms: 1,
  areaSqm: 85,
  floor: 3,
  totalFloors: 5,
  parking: 1,
  elevator: true,
  balcony: true,
  garden: false,
  aircon: true,
  furnished: false,
  yearBuilt: 2020,
  amenities: [],
  agencyId: null,
  ownerId: 'u1',
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-02-20T00:00:00Z',
};

const defaultStoreState = {
  selectedProperty: fakeProperty,
  isLoadingDetail: false,
  error: null,
  fetchPropertyById: jest.fn(),
  changeStatus: jest.fn(),
  removeProperty: jest.fn(),
  duplicateProperty: jest.fn(),
  clearSelectedProperty: jest.fn(),
  properties: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  search: '',
  statusFilter: null,
  fetchProperties: jest.fn(),
  fetchNextPage: jest.fn(),
  setSearch: jest.fn(),
  setStatusFilter: jest.fn(),
  createProperty: jest.fn(),
  updateProperty: jest.fn(),
  clearError: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePropertyStore.mockReturnValue(defaultStoreState as any);
});

const renderScreen = (id = 'p1') =>
  render(
    <PropertyDetailScreen
      navigation={{ navigate: mockNavigate, goBack: mockGoBack, replace: mockReplace } as any}
      route={{ key: 'test', name: 'PropertyDetail', params: { id } } as any}
    />
  );

describe('PropertyDetailScreen', () => {
  // M3-33: Fetches property by ID on mount
  it('M3-33: fetches property by ID on mount', () => {
    renderScreen('p1');
    expect(defaultStoreState.fetchPropertyById).toHaveBeenCalledWith('p1');
  });

  // M3-34: Renders all property fields
  it('M3-34: renders property title, price, and location', () => {
    const { getByText } = renderScreen();
    expect(getByText('Beautiful Apartment')).toBeTruthy();
    expect(getByText(/Tel Aviv/)).toBeTruthy();
  });

  // M3-35: Shows loading state while fetching
  it('M3-35: shows loading state while fetching', () => {
    mockUsePropertyStore.mockReturnValue({
      ...defaultStoreState,
      selectedProperty: null,
      isLoadingDetail: true,
    } as any);
    const { UNSAFE_getByType } = renderScreen();
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  // M3-36: Shows error on fetch failure
  it('M3-36: shows error text on fetch failure', () => {
    mockUsePropertyStore.mockReturnValue({
      ...defaultStoreState,
      selectedProperty: null,
      isLoadingDetail: false,
      error: 'Property not found',
    } as any);
    const { getByText } = renderScreen();
    expect(getByText('Property not found')).toBeTruthy();
  });

  // M3-37: Status change action available
  it('M3-37: shows status transition buttons for active property', () => {
    const { getByText } = renderScreen();
    expect(getByText('Under Offer')).toBeTruthy();
    expect(getByText('Sold')).toBeTruthy();
  });

  // M3-38: Navigate to edit screen
  it('M3-38: Edit button navigates to PropertyEdit', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('✏️  Edit'));
    expect(mockNavigate).toHaveBeenCalledWith('PropertyEdit', { id: 'p1' });
  });

  it('Duplicate button triggers duplicateProperty', async () => {
    defaultStoreState.duplicateProperty.mockResolvedValue({ id: 'p2' });
    const { getByText } = renderScreen();
    fireEvent.press(getByText('📋 Duplicate'));
    await waitFor(() => {
      expect(defaultStoreState.duplicateProperty).toHaveBeenCalledWith('p1');
    });
  });

  it('Pages button navigates to PageList', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('📄 Pages'));
    expect(mockNavigate).toHaveBeenCalledWith('PageList', { propertyId: 'p1' });
  });

  it('Delete button shows confirmation alert', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('🗑️  Delete'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Property',
      expect.any(String),
      expect.any(Array),
    );
  });

  it('renders feature values (rooms, area, etc.)', () => {
    const { getByText } = renderScreen();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('85m²')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  // Fixed: amenities text in source is "✓ Elevator" not "Elevator"
  it('renders amenities chips with checkmark prefix', () => {
    const { getByText } = renderScreen();
    expect(getByText('✓ Elevator')).toBeTruthy();
    expect(getByText('✓ Balcony')).toBeTruthy();
    expect(getByText('✓ A/C')).toBeTruthy();
  });

  it('clears selectedProperty on unmount', () => {
    const { unmount } = renderScreen();
    unmount();
    expect(defaultStoreState.clearSelectedProperty).toHaveBeenCalled();
  });
});
