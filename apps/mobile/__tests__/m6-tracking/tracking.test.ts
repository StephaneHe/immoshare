/**
 * Tests for Tracking Service + Store (M6)
 * Test plan: M6-01 through M6-03
 */
import { api } from '../../src/services/api';
import { trackingService } from '../../src/services/tracking.service';
import { useTrackingStore } from '../../src/stores/tracking.store';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const fakeDashboard = {
  stats: { totalOpens: 100, uniqueVisitors: 50, totalShares: 25, avgOpenRate: 0.4 },
  recentActivity: [{ id: 'e1', type: 'page_opened', propertyId: 'p1', contactName: 'Alice', createdAt: '2026-01-01' }],
  topProperties: [{ propertyId: 'p1', propertyTitle: 'Nice Apt', opens: 30 }],
};

const fakeAnalytics = {
  propertyId: 'p1', totalOpens: 30, uniqueVisitors: 15, avgTimeSpent: 45,
  openRate: 0.5, byChannel: { email: 20, whatsapp: 10 },
  byContact: [{ contactId: 'c1', contactName: 'Alice', opens: 5 }],
  topSections: [{ section: 'gallery', avgTime: 20 }],
};

beforeEach(() => {
  jest.clearAllMocks();
  useTrackingStore.setState({
    dashboard: null, propertyAnalytics: null, period: '30d',
    isLoading: false, error: null,
  });
});

describe('Tracking Service', () => {
  it('getDashboard() calls GET /analytics/dashboard', async () => {
    mockApi.get.mockResolvedValue(fakeDashboard);
    await trackingService.getDashboard({ period: '7d' });
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/analytics/dashboard?period=7d');
  });

  it('getPropertyAnalytics() calls GET /properties/:id/analytics', async () => {
    mockApi.get.mockResolvedValue(fakeAnalytics);
    await trackingService.getPropertyAnalytics('p1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/properties/p1/analytics');
  });
});

describe('Tracking Store', () => {
  // M6-01: Fetch property analytics
  it('M6-01: fetchPropertyAnalytics() populates analytics', async () => {
    mockApi.get.mockResolvedValue(fakeAnalytics);
    await useTrackingStore.getState().fetchPropertyAnalytics('p1');
    expect(useTrackingStore.getState().propertyAnalytics?.totalOpens).toBe(30);
  });

  // M6-02: Fetch global dashboard
  it('M6-02: fetchDashboard() populates dashboard', async () => {
    mockApi.get.mockResolvedValue(fakeDashboard);
    await useTrackingStore.getState().fetchDashboard();
    const s = useTrackingStore.getState();
    expect(s.dashboard?.stats.totalOpens).toBe(100);
    expect(s.dashboard?.topProperties).toHaveLength(1);
  });

  // M6-03: Period filter
  it('M6-03: setPeriod() updates period state', () => {
    useTrackingStore.getState().setPeriod('7d');
    expect(useTrackingStore.getState().period).toBe('7d');
  });

  it('fetchDashboard() uses current period', async () => {
    useTrackingStore.setState({ period: '90d' });
    mockApi.get.mockResolvedValue(fakeDashboard);
    await useTrackingStore.getState().fetchDashboard();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/analytics/dashboard?period=90d');
  });

  it('error state set on failure', async () => {
    mockApi.get.mockRejectedValue(new Error('Server error'));
    await useTrackingStore.getState().fetchDashboard();
    expect(useTrackingStore.getState().error).toBe('Server error');
  });
});
