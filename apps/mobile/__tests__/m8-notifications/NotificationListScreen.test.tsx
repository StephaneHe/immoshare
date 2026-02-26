/**
 * NotificationListScreen — rendering test (M8)
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockMarkAllAsRead = jest.fn();
const mockFetchNotifications = jest.fn();
const mockFetchUnreadCount = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../src/stores/notification.store', () => ({
  useNotificationStore: () => ({
    notifications: [], unreadCount: 0, isLoading: false, error: null,
    fetchNotifications: mockFetchNotifications, fetchUnreadCount: mockFetchUnreadCount,
    markAsRead: jest.fn(), markAllAsRead: mockMarkAllAsRead, deleteNotification: jest.fn(),
  }),
}));

import { NotificationListScreen } from '../../src/screens/Notifications/NotificationListScreen';

const navProps = {
  navigation: { navigate: mockNavigate, goBack: jest.fn() } as any,
  route: { params: {}, key: 'NotificationList', name: 'NotificationList' } as any,
};

describe('NotificationListScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders empty state when no notifications', () => {
    const { getByText } = render(<NotificationListScreen {...navProps} />);
    expect(getByText('No notifications')).toBeTruthy();
    expect(getByText("You're all caught up!")).toBeTruthy();
  });

  it('renders settings button', () => {
    const { getByText } = render(<NotificationListScreen {...navProps} />);
    // The screen uses ⚙️ emoji (with variation selector)
    expect(getByText(/Notification Settings/)).toBeTruthy();
  });

  it('navigates to settings on button press', () => {
    const { getByText } = render(<NotificationListScreen {...navProps} />);
    fireEvent.press(getByText(/Notification Settings/));
    expect(mockNavigate).toHaveBeenCalledWith('NotificationSettings');
  });
});
