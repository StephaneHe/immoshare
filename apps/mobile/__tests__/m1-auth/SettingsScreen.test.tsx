/**
 * Tests for SettingsScreen (Profile stack)
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';

jest.mock('../../src/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

const mockLogout = jest.fn();
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

import { SettingsScreen } from '../../src/screens/Profile/SettingsScreen';

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuthStore.mockReturnValue({
    user: null, isLoading: false, isAuthenticated: true, error: null,
    init: jest.fn(), login: jest.fn(), register: jest.fn(),
    logout: mockLogout, clearError: jest.fn(),
  });
});

describe('SettingsScreen', () => {
  it('renders Privacy Policy', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Privacy Policy')).toBeTruthy();
  });

  it('renders Terms of Service', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Terms of Service')).toBeTruthy();
  });

  it('renders Help & Support', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Help & Support')).toBeTruthy();
  });

  it('renders App Version', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('App Version')).toBeTruthy();
  });

  it('renders Danger Zone section', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Danger Zone')).toBeTruthy();
  });

  it('renders Delete Account button', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Delete Account')).toBeTruthy();
  });

  it('renders Sign Out button', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('tap Sign Out calls logout', () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Sign Out'));
    expect(mockLogout).toHaveBeenCalled();
  });

  it('tap Privacy Policy opens URL', () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Privacy Policy'));
    expect(spy).toHaveBeenCalledWith('https://immoshare.com/privacy');
    spy.mockRestore();
  });

  it('tap Terms of Service opens URL', () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as any);
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Terms of Service'));
    expect(spy).toHaveBeenCalledWith('https://immoshare.com/terms');
    spy.mockRestore();
  });

  it('tap Delete Account shows confirmation alert', () => {
    const spy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Delete Account'));
    expect(spy).toHaveBeenCalledWith(
      'Delete Account',
      expect.any(String),
      expect.any(Array),
    );
    spy.mockRestore();
  });

  it('tap App Version shows version alert', () => {
    const spy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('App Version'));
    expect(spy).toHaveBeenCalledWith('Version', 'ImmoShare v1.0.0');
    spy.mockRestore();
  });
});
