/**
 * Property Lifecycle Tests
 *
 * Validates that the correct status transition buttons are displayed
 * for each stage of the property workflow:
 *
 *   draft → active → under_offer → sold → archived → draft
 *                   → rented → active
 *                             → archived
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PropertyDetailScreen } from '../../src/screens/Properties/PropertyDetailScreen';
import { usePropertyStore } from '../../src/stores/property.store';

jest.mock('../../src/stores/property.store', () => ({
  usePropertyStore: jest.fn(),
}));

const mockUsePropertyStore = usePropertyStore as jest.MockedFunction<typeof usePropertyStore>;
const mockChangeStatus = jest.fn();

const baseProperty = {
  id: 'p1',
  title: 'Test Property',
  description: '',
  propertyType: 'apartment',
  price: 1000000,
  currency: 'ILS',
  city: 'Tel Aviv',
  address: '',
  neighborhood: '',
  rooms: 3,
  bedrooms: 2,
  bathrooms: 1,
  areaSqm: 80,
  floor: null,
  totalFloors: null,
  parking: null,
  elevator: false,
  balcony: false,
  garden: false,
  aircon: false,
  furnished: false,
  yearBuilt: null,
  amenities: [],
  agencyId: null,
  ownerId: 'u1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const storeDefaults = {
  isLoadingDetail: false,
  error: null,
  fetchPropertyById: jest.fn(),
  changeStatus: mockChangeStatus,
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

const renderWithStatus = (status: string) => {
  mockUsePropertyStore.mockReturnValue({
    ...storeDefaults,
    selectedProperty: { ...baseProperty, status },
  } as any);
  return render(
    <PropertyDetailScreen
      navigation={{ navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn() } as any}
      route={{ key: 'test', name: 'PropertyDetail', params: { id: 'p1' } } as any}
    />
  );
};

beforeEach(() => jest.clearAllMocks());

// ─── DRAFT ──────────────────────────────────────────────
describe('Draft property', () => {
  it('shows "Active" transition button', () => {
    const { getByText } = renderWithStatus('draft');
    expect(getByText('Active')).toBeTruthy();
  });

  it('shows "Archived" transition button', () => {
    const { getByText } = renderWithStatus('draft');
    expect(getByText('Archived')).toBeTruthy();
  });

  it('does NOT show Under Offer, Sold, or Rented buttons', () => {
    const { queryByText } = renderWithStatus('draft');
    expect(queryByText('Under Offer')).toBeNull();
    expect(queryByText('Sold')).toBeNull();
    expect(queryByText('Rented')).toBeNull();
  });

  it('displays "Draft" status badge', () => {
    const { getByText } = renderWithStatus('draft');
    expect(getByText('Draft')).toBeTruthy();
  });
});

// ─── ACTIVE ─────────────────────────────────────────────
describe('Active property', () => {
  it('shows Under Offer, Sold, Rented, Archived buttons', () => {
    const { getByText } = renderWithStatus('active');
    expect(getByText('Under Offer')).toBeTruthy();
    expect(getByText('Sold')).toBeTruthy();
    expect(getByText('Rented')).toBeTruthy();
    expect(getByText('Archived')).toBeTruthy();
  });

  it('does NOT show Draft button', () => {
    const { queryByText } = renderWithStatus('active');
    // "Active" appears as badge, not as transition — Draft should not be a transition
    expect(queryByText('Draft')).toBeNull();
  });

  it('tapping "Under Offer" shows confirmation alert', () => {
    const spy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithStatus('active');
    fireEvent.press(getByText('Under Offer'));
    expect(spy).toHaveBeenCalledWith(
      'Change Status',
      'Set status to "Under Offer"?',
      expect.any(Array),
    );
    spy.mockRestore();
  });

  it('confirming status change calls changeStatus', () => {
    const spy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithStatus('active');
    fireEvent.press(getByText('Sold'));
    // Simulate pressing "Confirm" in the alert
    const alertButtons = spy.mock.calls[0][2] as any[];
    const confirmBtn = alertButtons.find((b: any) => b.text === 'Confirm');
    confirmBtn.onPress();
    expect(mockChangeStatus).toHaveBeenCalledWith('p1', 'sold');
    spy.mockRestore();
  });
});

// ─── UNDER OFFER ────────────────────────────────────────
describe('Under Offer property', () => {
  it('shows Active, Sold, Rented, Archived buttons', () => {
    const { getByText } = renderWithStatus('under_offer');
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Sold')).toBeTruthy();
    expect(getByText('Rented')).toBeTruthy();
    expect(getByText('Archived')).toBeTruthy();
  });

  it('does NOT show Draft button', () => {
    const { queryByText } = renderWithStatus('under_offer');
    expect(queryByText('Draft')).toBeNull();
  });

  it('tapping "Sold" triggers status change flow', () => {
    const spy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithStatus('under_offer');
    fireEvent.press(getByText('Sold'));
    expect(spy).toHaveBeenCalledWith('Change Status', 'Set status to "Sold"?', expect.any(Array));
    spy.mockRestore();
  });
});

// ─── SOLD ───────────────────────────────────────────────
describe('Sold property', () => {
  it('shows only "Archived" button', () => {
    const { getByText, queryByText } = renderWithStatus('sold');
    expect(getByText('Archived')).toBeTruthy();
    expect(queryByText('Active')).toBeNull();
    expect(queryByText('Draft')).toBeNull();
    expect(queryByText('Under Offer')).toBeNull();
    expect(queryByText('Rented')).toBeNull();
  });
});

// ─── RENTED ─────────────────────────────────────────────
describe('Rented property', () => {
  it('shows Active and Archived buttons', () => {
    const { getByText } = renderWithStatus('rented');
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Archived')).toBeTruthy();
  });

  it('does NOT show Draft, Under Offer, or Sold', () => {
    const { queryByText } = renderWithStatus('rented');
    expect(queryByText('Draft')).toBeNull();
    expect(queryByText('Under Offer')).toBeNull();
    expect(queryByText('Sold')).toBeNull();
  });
});

// ─── ARCHIVED ───────────────────────────────────────────
describe('Archived property', () => {
  it('shows only "Draft" button (reactivate)', () => {
    const { getByText, queryByText } = renderWithStatus('archived');
    expect(getByText('Draft')).toBeTruthy();
    expect(queryByText('Active')).toBeNull();
    expect(queryByText('Under Offer')).toBeNull();
    expect(queryByText('Sold')).toBeNull();
    expect(queryByText('Rented')).toBeNull();
  });

  it('tapping "Draft" triggers reactivation flow', () => {
    const spy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderWithStatus('archived');
    fireEvent.press(getByText('Draft'));
    expect(spy).toHaveBeenCalledWith('Change Status', 'Set status to "Draft"?', expect.any(Array));
    spy.mockRestore();
  });
});

// ─── FULL LIFECYCLE ─────────────────────────────────────
describe('Full lifecycle flow', () => {
  it('draft→active: Active button is available from Draft', () => {
    const { getByText } = renderWithStatus('draft');
    expect(getByText('Active')).toBeTruthy();
  });

  it('active→under_offer: Under Offer button is available from Active', () => {
    const { getByText } = renderWithStatus('active');
    expect(getByText('Under Offer')).toBeTruthy();
  });

  it('under_offer→sold: Sold button is available from Under Offer', () => {
    const { getByText } = renderWithStatus('under_offer');
    expect(getByText('Sold')).toBeTruthy();
  });

  it('sold→archived: Archived button is available from Sold', () => {
    const { getByText } = renderWithStatus('sold');
    expect(getByText('Archived')).toBeTruthy();
  });

  it('archived→draft: Draft button is available from Archived', () => {
    const { getByText } = renderWithStatus('archived');
    expect(getByText('Draft')).toBeTruthy();
  });

  it('rented→active: Active button is available from Rented (re-list)', () => {
    const { getByText } = renderWithStatus('rented');
    expect(getByText('Active')).toBeTruthy();
  });
});
