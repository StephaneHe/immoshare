/**
 * Tests for ProfileHomeScreen
 * Part of M1 Auth (user display) and Profile feature
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useAuthStore } from '../../src/stores/auth.store';

// Import after jest.setup.ts mocks navigation
import { ProfileHomeScreen } from '../../src/screens/Profile/ProfileHomeScreen';

// Get navigation mocks from setup
const mockNavigate = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../src/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const fakeUser = {
  id: 'u1',
  email: 'john@example.com',
  name: 'John Doe',
  phone: null,
  avatarUrl: null,
  role: 'agent',
  agencyId: null,
  locale: 'en',
  emailVerified: true,
  isActive: true,
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuthStore.mockReturnValue({
    user: fakeUser as any,
    logout: mockLogout,
    isLoading: false,
    isAuthenticated: true,
    error: null,
    init: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    clearError: jest.fn(),
  });
});

const renderScreen = () =>
  render(
    <ProfileHomeScreen
      navigation={{ navigate: mockNavigate } as any}
      route={{ key: 'test', name: 'ProfileHome' } as any}
    />
  );

describe('ProfileHomeScreen', () => {
  it('renders user name', () => {
    const { getByText } = renderScreen();
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('renders user email', () => {
    const { getByText } = renderScreen();
    expect(getByText('john@example.com')).toBeTruthy();
  });

  it('renders user role', () => {
    const { getByText } = renderScreen();
    expect(getByText('agent')).toBeTruthy();
  });

  it('renders initials from name (2 words → 2 initials)', () => {
    const { getByText } = renderScreen();
    expect(getByText('JD')).toBeTruthy();
  });

  it('renders single initial for single-word name', () => {
    mockUseAuthStore.mockReturnValue({
      user: { ...fakeUser, name: 'Madonna' } as any,
      logout: mockLogout,
      isLoading: false,
      isAuthenticated: true,
      error: null,
      init: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      clearError: jest.fn(),
    });
    const { getByText } = renderScreen();
    expect(getByText('M')).toBeTruthy();
  });

  it('renders "?" when name is null', () => {
    mockUseAuthStore.mockReturnValue({
      user: { ...fakeUser, name: null } as any,
      logout: mockLogout,
      isLoading: false,
      isAuthenticated: true,
      error: null,
      init: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      clearError: jest.fn(),
    });
    const { getByText } = renderScreen();
    expect(getByText('?')).toBeTruthy();
  });

  it('renders all 4 menu items', () => {
    const { getByText } = renderScreen();
    expect(getByText('Agency Management')).toBeTruthy();
    expect(getByText('Partners')).toBeTruthy();
    expect(getByText('Branding')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });

  it('tap Agency Management navigates to AgencyManage', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Agency Management'));
    expect(mockNavigate).toHaveBeenCalledWith('AgencyManage');
  });

  it('tap Partners navigates to PartnerList', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Partners'));
    expect(mockNavigate).toHaveBeenCalledWith('PartnerList');
  });

  it('tap Branding navigates to BrandingEditor', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Branding'));
    expect(mockNavigate).toHaveBeenCalledWith('BrandingEditor');
  });

  it('tap Settings navigates to Settings', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('Settings');
  });

  it('tap Sign Out calls logout', () => {
    const { getByText } = renderScreen();
    fireEvent.press(getByText('Sign Out'));
    expect(mockLogout).toHaveBeenCalled();
  });
});
