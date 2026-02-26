/**
 * TrackingDashboardScreen — rendering test (M6)
 */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../src/stores/tracking.store', () => ({
  useTrackingStore: () => ({
    dashboard: {
      stats: { totalOpens: 42, uniqueVisitors: 10, totalShares: 5, avgOpenRate: 0.65 },
      topProperties: [
        { propertyId: 'p1', propertyTitle: 'Luxury Villa', opens: 20 },
      ],
      recentActivity: [
        { id: 'a1', type: 'page_opened', propertyId: 'p1', contactName: 'John', createdAt: '2026-01-15T10:00:00Z' },
      ],
    },
    isLoading: false, error: null, period: '30d',
    fetchDashboard: jest.fn(), setPeriod: jest.fn(),
  }),
}));

import { TrackingDashboardScreen } from '../../src/screens/Tracking/TrackingDashboardScreen';

describe('TrackingDashboardScreen', () => {
  it('renders stats cards', () => {
    const { getByText } = render(<TrackingDashboardScreen />);
    expect(getByText('42')).toBeTruthy();
    expect(getByText('Total Opens')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByText('Unique Visitors')).toBeTruthy();
  });

  it('renders open rate as percentage', () => {
    const { getByText } = render(<TrackingDashboardScreen />);
    expect(getByText('65%')).toBeTruthy();
  });

  it('renders period selector', () => {
    const { getByText } = render(<TrackingDashboardScreen />);
    expect(getByText('7 days')).toBeTruthy();
    expect(getByText('30 days')).toBeTruthy();
    expect(getByText('90 days')).toBeTruthy();
  });

  it('renders top properties', () => {
    const { getByText } = render(<TrackingDashboardScreen />);
    expect(getByText('Top Properties')).toBeTruthy();
    expect(getByText('Luxury Villa')).toBeTruthy();
    expect(getByText('20 opens')).toBeTruthy();
  });

  it('renders recent activity', () => {
    const { getByText } = render(<TrackingDashboardScreen />);
    expect(getByText('Recent Activity')).toBeTruthy();
    expect(getByText('John')).toBeTruthy();
  });
});
