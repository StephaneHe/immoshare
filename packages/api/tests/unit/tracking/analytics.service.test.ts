import { AnalyticsService } from '../../../src/modules/tracking/analytics.service';
import {
  ITrackingDataProvider,
  TrackEventRecord,
} from '../../../src/modules/tracking/tracking.types';
import {
  PropertyNotFoundForAnalyticsError,
  NotPropertyOwnerForAnalyticsError,
} from '../../../src/modules/tracking/tracking.errors';

const USER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const OTHER_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const PROP_ID = 'cccccccc-1111-2222-3333-444444444444';
const LINK_1 = 'dddddddd-1111-2222-3333-444444444444';
const LINK_2 = 'eeeeeeee-1111-2222-3333-444444444444';
const LINK_3 = 'ffffffff-1111-2222-3333-444444444444';
const CONTACT_1 = '11111111-1111-2222-3333-444444444444';
const CONTACT_2 = '22222222-1111-2222-3333-444444444444';

const now = new Date();
const yesterday = new Date(now.getTime() - 86400000);

function makeEvent(overrides: Partial<TrackEventRecord> = {}): TrackEventRecord {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 8)}`,
    linkId: LINK_1, eventType: 'page_opened', timestamp: now,
    ipAddress: '1.2.3.0', userAgent: null, metadata: { firstVisit: true },
    createdAt: now, ...overrides,
  };
}

const links = [
  { id: LINK_1, contactId: CONTACT_1, channel: 'email', sentAt: yesterday },
  { id: LINK_2, contactId: CONTACT_1, channel: 'whatsapp', sentAt: yesterday },
  { id: LINK_3, contactId: CONTACT_2, channel: 'email', sentAt: yesterday },
];

const events: TrackEventRecord[] = [
  // Link 1: opened, section viewed, time spent
  makeEvent({ linkId: LINK_1, eventType: 'page_opened', metadata: { firstVisit: true } }),
  makeEvent({ linkId: LINK_1, eventType: 'section_viewed', metadata: { sectionType: 'photos' } }),
  makeEvent({ linkId: LINK_1, eventType: 'time_spent', metadata: { durationSeconds: 45 } }),
  // Link 2: opened
  makeEvent({ linkId: LINK_2, eventType: 'page_opened', metadata: { firstVisit: true } }),
  makeEvent({ linkId: LINK_2, eventType: 'time_spent', metadata: { durationSeconds: 20 } }),
  // Link 3: never opened
];

function mockDataProvider(overrides: Partial<ITrackingDataProvider> = {}): ITrackingDataProvider {
  return {
    resolveLinkByToken: jest.fn().mockResolvedValue(null),
    getLinksForProperty: jest.fn().mockResolvedValue(links),
    getContactName: jest.fn().mockImplementation((id: string) => {
      if (id === CONTACT_1) return Promise.resolve('David');
      if (id === CONTACT_2) return Promise.resolve('Sarah');
      return Promise.resolve('Unknown');
    }),
    getPropertyTitle: jest.fn().mockResolvedValue('Nice apartment'),
    getUserSharedProperties: jest.fn().mockResolvedValue([
      { propertyId: PROP_ID, title: 'Nice apartment', linkCount: 3 },
    ]),
    getPropertyOwnerId: jest.fn().mockResolvedValue(USER_ID),
    getPageOwnerId: jest.fn().mockResolvedValue(USER_ID),
    getEventsForLinks: jest.fn().mockResolvedValue(events),
    ...overrides,
  };
}

describe('AnalyticsService.getPropertyAnalytics', () => {
  it('should calculate correct open rate', async () => {
    const service = new AnalyticsService(mockDataProvider());

    const result = await service.getPropertyAnalytics(PROP_ID, USER_ID);

    expect(result.totalLinks).toBe(3);
    expect(result.totalOpened).toBe(2); // link1 + link2
    expect(result.totalNotOpened).toBe(1); // link3
    expect(result.openRate).toBe(67); // 2/3 ≈ 67%
  });

  it('should aggregate by channel', async () => {
    const service = new AnalyticsService(mockDataProvider());
    const result = await service.getPropertyAnalytics(PROP_ID, USER_ID);

    const emailStats = result.byChannel.find(c => c.channel === 'email');
    expect(emailStats!.sent).toBe(2); // link1 + link3
    expect(emailStats!.opened).toBe(1); // only link1

    const waStats = result.byChannel.find(c => c.channel === 'whatsapp');
    expect(waStats!.sent).toBe(1);
    expect(waStats!.opened).toBe(1);
  });

  it('should aggregate by contact', async () => {
    const service = new AnalyticsService(mockDataProvider());
    const result = await service.getPropertyAnalytics(PROP_ID, USER_ID);

    const david = result.byContact.find(c => c.contactName === 'David');
    expect(david!.totalVisits).toBe(2); // link1 + link2 opened
    expect(david!.channels).toContain('email');
    expect(david!.channels).toContain('whatsapp');

    const sarah = result.byContact.find(c => c.contactName === 'Sarah');
    expect(sarah!.totalVisits).toBe(0); // never opened
  });

  it('should rank top sections', async () => {
    const service = new AnalyticsService(mockDataProvider());
    const result = await service.getPropertyAnalytics(PROP_ID, USER_ID);

    expect(result.topSections.length).toBeGreaterThan(0);
    expect(result.topSections[0].sectionType).toBe('photos');
  });

  it('should calculate average time spent', async () => {
    const service = new AnalyticsService(mockDataProvider());
    const result = await service.getPropertyAnalytics(PROP_ID, USER_ID);

    // 45 + 20 = 65 seconds total, 2 opened links → avg ~33
    expect(result.avgTimeSpentSeconds).toBe(33);
  });

  it('should throw NOT_FOUND for unknown property', async () => {
    const dp = mockDataProvider({ getPropertyOwnerId: jest.fn().mockResolvedValue(null) });
    const service = new AnalyticsService(dp);

    await expect(service.getPropertyAnalytics('bad', USER_ID))
      .rejects.toThrow(PropertyNotFoundForAnalyticsError);
  });

  it('should throw NOT_OWNER for non-owner', async () => {
    const service = new AnalyticsService(mockDataProvider());
    await expect(service.getPropertyAnalytics(PROP_ID, OTHER_ID))
      .rejects.toThrow(NotPropertyOwnerForAnalyticsError);
  });

  it('should return empty analytics for property without links', async () => {
    const dp = mockDataProvider({ getLinksForProperty: jest.fn().mockResolvedValue([]) });
    const service = new AnalyticsService(dp);

    const result = await service.getPropertyAnalytics(PROP_ID, USER_ID);
    expect(result.totalLinks).toBe(0);
    expect(result.openRate).toBe(0);
  });
});

describe('AnalyticsService.getDashboard', () => {
  it('should return stats for the given period', async () => {
    const service = new AnalyticsService(mockDataProvider());
    const from = new Date(now.getTime() - 7 * 86400000);
    const to = now;

    const result = await service.getDashboard(USER_ID, from, to);

    expect(result.totalPropertiesShared).toBe(1);
    expect(result.totalLinksSent).toBe(3);
    expect(result.totalOpens).toBeGreaterThan(0);
  });

  it('should return recent activity sorted by timestamp desc', async () => {
    const service = new AnalyticsService(mockDataProvider());
    const from = new Date(now.getTime() - 7 * 86400000);

    const result = await service.getDashboard(USER_ID, from, now);

    expect(result.recentActivity.length).toBeGreaterThan(0);
    // Verify sorted desc
    for (let i = 1; i < result.recentActivity.length; i++) {
      expect(new Date(result.recentActivity[i - 1].timestamp).getTime())
        .toBeGreaterThanOrEqual(new Date(result.recentActivity[i].timestamp).getTime());
    }
  });

  it('should return top properties by open count', async () => {
    const service = new AnalyticsService(mockDataProvider());
    const from = new Date(now.getTime() - 7 * 86400000);

    const result = await service.getDashboard(USER_ID, from, now);

    expect(result.topProperties.length).toBe(1);
    expect(result.topProperties[0].propertyId).toBe(PROP_ID);
    expect(result.topProperties[0].openCount).toBeGreaterThan(0);
  });
});
