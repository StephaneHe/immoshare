/**
 * Tests for PropertyCreateScreen
 * Test plan: M3-39 through M3-43
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PropertyCreateScreen } from '../../src/screens/Properties/PropertyCreateScreen';
import { usePropertyStore } from '../../src/stores/property.store';

jest.mock('../../src/stores/property.store', () => ({
  usePropertyStore: jest.fn(),
}));

// Must mock Alert.alert before component renders
const mockAlert = jest.fn();
Alert.alert = mockAlert;

const mockUsePropertyStore = usePropertyStore as jest.MockedFunction<typeof usePropertyStore>;
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();
const mockCreateProperty = jest.fn();

const defaultStore = {
  createProperty: mockCreateProperty,
  isLoading: false,
  properties: [],
  total: 0,
  page: 1,
  totalPages: 1,
  error: null,
  search: '',
  statusFilter: null,
  selectedProperty: null,
  isLoadingDetail: false,
  fetchProperties: jest.fn(),
  fetchNextPage: jest.fn(),
  setSearch: jest.fn(),
  setStatusFilter: jest.fn(),
  fetchPropertyById: jest.fn(),
  updateProperty: jest.fn(),
  removeProperty: jest.fn(),
  duplicateProperty: jest.fn(),
  changeStatus: jest.fn(),
  clearSelectedProperty: jest.fn(),
  clearError: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePropertyStore.mockReturnValue(defaultStore as any);
});

const renderScreen = () =>
  render(
    <PropertyCreateScreen
      navigation={{ navigate: mockNavigate, goBack: mockGoBack, replace: mockReplace } as any}
      route={{ key: 'test', name: 'PropertyCreate' } as any}
    />
  );

describe('PropertyCreateScreen', () => {
  // M3-39: Renders form with all required fields
  it('M3-39: renders form with type selector, title, and submit button', () => {
    const { getByText } = renderScreen();
    expect(getByText('Type *')).toBeTruthy();
    expect(getByText('Create Property')).toBeTruthy();
    expect(getByText('Elevator')).toBeTruthy();
    expect(getByText('Balcony')).toBeTruthy();
    expect(getByText('Garden')).toBeTruthy();
    expect(getByText('Air Conditioning')).toBeTruthy();
    expect(getByText('Furnished')).toBeTruthy();
  });

  // M3-41: Validation errors displayed (empty title)
  it('M3-41: shows validation alert when title is empty', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Create Property'));
    expect(mockAlert).toHaveBeenCalledWith('Validation', 'Title is required');
    expect(mockCreateProperty).not.toHaveBeenCalled();
  });

  // M3-40: Submit calls createProperty with form data
  it('M3-40: submit calls createProperty with filled form data', async () => {
    mockCreateProperty.mockResolvedValue({ id: 'created-123' });
    const { getByText, UNSAFE_getAllByType } = renderScreen();

    // Find TextInput elements and fill the title
    const { TextInput } = require('react-native');
    const inputs = UNSAFE_getAllByType(TextInput);
    // First TextInput is title
    fireEvent.changeText(inputs[0], 'My New Property');

    fireEvent.press(getByText('Create Property'));

    await waitFor(() => {
      expect(mockCreateProperty).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'My New Property' })
      );
    });
  });

  // M3-42: Success navigates to property detail
  it('M3-42: success navigates to PropertyDetail with new ID', async () => {
    mockCreateProperty.mockResolvedValue({ id: 'created-456' });
    const { getByText, UNSAFE_getAllByType } = renderScreen();

    const { TextInput } = require('react-native');
    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], 'Another Property');

    fireEvent.press(getByText('Create Property'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('PropertyDetail', { id: 'created-456' });
    });
  });

  // M3-43: Shows loading state during submission
  it('M3-43: shows loading text on button while creating', () => {
    mockUsePropertyStore.mockReturnValue({ ...defaultStore, isLoading: true } as any);
    const { getByText } = renderScreen();
    expect(getByText('Creating...')).toBeTruthy();
  });

  it('renders property type chips with apartment selected by default', () => {
    const { getByText } = renderScreen();
    expect(getByText('Apartment')).toBeTruthy();
    expect(getByText('House')).toBeTruthy();
    expect(getByText('Penthouse')).toBeTruthy();
  });

  it('tap on type chip changes selection', async () => {
    mockCreateProperty.mockResolvedValue({ id: 'x' });
    const { getByText, UNSAFE_getAllByType } = renderScreen();
    fireEvent.press(getByText('House'));

    const { TextInput } = require('react-native');
    const inputs = UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], 'House Listing');

    fireEvent.press(getByText('Create Property'));
    await waitFor(() => {
      expect(mockCreateProperty).toHaveBeenCalledWith(
        expect.objectContaining({ propertyType: 'house' })
      );
    });
  });
});
