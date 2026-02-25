/**
 * Tests for PlaceholderScreen component and all placeholder screens.
 * Verifies each placeholder renders with the correct title and subtitle.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { PlaceholderScreen } from '../../src/components/PlaceholderScreen';
import { ContactListScreen } from '../../src/screens/Share/ContactListScreen';
import { TrackingDashboardScreen } from '../../src/screens/Tracking/TrackingDashboardScreen';
import { NotificationListScreen } from '../../src/screens/Notifications/NotificationListScreen';
import { BrandingEditorScreen } from '../../src/screens/Branding/BrandingEditorScreen';

describe('PlaceholderScreen component', () => {
  it('renders title', () => {
    const { getByText } = render(<PlaceholderScreen title="Test Title" />);
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <PlaceholderScreen title="Title" subtitle="Some subtitle" />
    );
    expect(getByText('Some subtitle')).toBeTruthy();
  });

  it('does not render subtitle when omitted', () => {
    const { queryByText } = render(<PlaceholderScreen title="Title" />);
    // No subtitle text should be present (only title and emoji)
    expect(queryByText('Some subtitle')).toBeNull();
  });

  it('renders construction emoji', () => {
    const { getByText } = render(<PlaceholderScreen title="Title" />);
    // The emoji is rendered as text content
    expect(getByText('🏗️')).toBeTruthy();
  });
});

describe('Placeholder Screens', () => {
  // M5: ContactListScreen
  it('ContactListScreen renders with correct title', () => {
    const { getByText } = render(<ContactListScreen />);
    expect(getByText('Contacts & Shares')).toBeTruthy();
  });

  // M6: TrackingDashboardScreen
  it('TrackingDashboardScreen renders with correct title', () => {
    const { getByText } = render(<TrackingDashboardScreen />);
    expect(getByText('Tracking Dashboard')).toBeTruthy();
  });

  // M8: NotificationListScreen
  it('NotificationListScreen renders with correct title', () => {
    const { getByText } = render(<NotificationListScreen />);
    expect(getByText('Notifications')).toBeTruthy();
  });

  // M9: BrandingEditorScreen
  it('BrandingEditorScreen renders with correct title', () => {
    const { getByText } = render(<BrandingEditorScreen />);
    expect(getByText('Branding Editor')).toBeTruthy();
  });
});
