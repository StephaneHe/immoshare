/**
 * Tests for NotificationSettingsScreen (M8 — Alerts stack)
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockFetchSettings = jest.fn();
const mockUpdateSettings = jest.fn();

const fakeSettings = {
  emailEnabled: true,
  pushEnabled: false,
  shareViewed: true,
  partnerRequest: true,
  systemUpdates: false,
};

jest.mock('../../src/stores/notification.store', () => ({
  useNotificationStore: () => ({
    settings: fakeSettings,
    isLoading: false,
    fetchSettings: mockFetchSettings,
    updateSettings: mockUpdateSettings,
  }),
}));

import { NotificationSettingsScreen } from '../../src/screens/Notifications/NotificationSettingsScreen';

beforeEach(() => jest.clearAllMocks());

describe('NotificationSettingsScreen', () => {
  it('renders Email Notifications label', () => {
    const { getByText } = render(<NotificationSettingsScreen />);
    expect(getByText('Email Notifications')).toBeTruthy();
  });

  it('renders Push Notifications label', () => {
    const { getByText } = render(<NotificationSettingsScreen />);
    expect(getByText('Push Notifications')).toBeTruthy();
  });

  it('renders Share Viewed label', () => {
    const { getByText } = render(<NotificationSettingsScreen />);
    expect(getByText('Share Viewed')).toBeTruthy();
  });

  it('renders Partner Requests label', () => {
    const { getByText } = render(<NotificationSettingsScreen />);
    expect(getByText('Partner Requests')).toBeTruthy();
  });

  it('renders System Updates label', () => {
    const { getByText } = render(<NotificationSettingsScreen />);
    expect(getByText('System Updates')).toBeTruthy();
  });

  it('renders descriptions', () => {
    const { getByText } = render(<NotificationSettingsScreen />);
    expect(getByText('Receive notifications via email')).toBeTruthy();
    expect(getByText('Receive push notifications on device')).toBeTruthy();
    expect(getByText('When someone views your shared page')).toBeTruthy();
    expect(getByText('New partner invitations')).toBeTruthy();
    expect(getByText('App updates and announcements')).toBeTruthy();
  });

  it('calls fetchSettings on mount', () => {
    render(<NotificationSettingsScreen />);
    expect(mockFetchSettings).toHaveBeenCalled();
  });

  it('renders 5 toggle switches', () => {
    const { UNSAFE_getAllByType } = render(<NotificationSettingsScreen />);
    // Switch components rendered as native
    const switches = UNSAFE_getAllByType(require('react-native').Switch);
    expect(switches.length).toBe(5);
  });
});
