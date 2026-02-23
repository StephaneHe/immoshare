import { TrackingService } from '../../../src/modules/tracking/tracking.service';
import {
  ITrackEventRepository,
  ITrackingDataProvider,
  TrackEventRecord,
} from '../../../src/modules/tracking/tracking.types';
import {
  TrackLinkNotFoundError,
  TrackLinkExpiredError,
  TrackLinkDeactivatedError,
  TrackRateLimitedError,
} from '../../../src/modules/tracking/tracking.errors';

const LINK_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const TOKEN = 'bbbbbbbb-1111-2222-3333-444444444444';
const PAGE_ID = 'cccccccc-1111-2222-3333-444444444444';
const CONTACT_ID = 'dddddddd-1111-2222-3333-444444444444';

const validLink = {
  id: LINK_ID, pageId: PAGE_ID, contactId: CONTACT_ID,
  channel: 'email', isActive: true, expiresAt: new Date(Date.now() + 86400000),
};

const sampleEvent: TrackEventRecord = {
  id: 'evt-1', linkId: LINK_ID, eventType: 'page_opened',
  timestamp: new Date(), ipAddress: '192.168.1.0', userAgent: 'Mozilla/5.0',
  metadata: { firstVisit: true }, createdAt: new Date(),
};

function mockRepo(overrides: Partial<ITrackEventRepository> = {}): ITrackEventRepository {
  return {
    create: jest.fn().mockResolvedValue(sampleEvent),
    findByLinkId: jest.fn().mockResolvedValue([]),
    findRecentByTokenAndIp: jest.fn().mockResolvedValue(null),
    countByType: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function mockDataProvider(overrides: Partial<ITrackingDataProvider> = {}): ITrackingDataProvider {
  return {
    resolveLinkByToken: jest.fn().mockResolvedValue(validLink),
    getLinksForProperty: jest.fn().mockResolvedValue([]),
    getContactName: jest.fn().mockResolvedValue('David'),
    getPropertyTitle: jest.fn().mockResolvedValue('Nice apt'),
    getUserSharedProperties: jest.fn().mockResolvedValue([]),
    getPropertyOwnerId: jest.fn().mockResolvedValue('owner-1'),
    getEventsForLinks: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function createService(repo?: ITrackEventRepository, dp?: ITrackingDataProvider) {
  return new TrackingService(repo || mockRepo(), dp || mockDataProvider());
}

describe('TrackingService.recordEvent', () => {
  it('should create track event with correct data', async () => {
    const repo = mockRepo();
    const service = createService(repo);

    const result = await service.recordEvent(
      { token: TOKEN, eventType: 'page_opened' },
      '192.168.1.42', 'Mozilla/5.0',
    );

    expect(result).toBeTruthy();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        linkId: LINK_ID,
        eventType: 'page_opened',
        ipAddress: '192.168.1.0', // anonymized
        userAgent: 'Mozilla/5.0',
      }),
    );
  });

  it('should set firstVisit=true for first page_opened', async () => {
    const repo = mockRepo({ countByType: jest.fn().mockResolvedValue(0) });
    const service = createService(repo);

    await service.recordEvent({ token: TOKEN, eventType: 'page_opened' }, '1.2.3.4', null);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ firstVisit: true }) }),
    );
  });

  it('should set firstVisit=false for subsequent opens', async () => {
    const repo = mockRepo({ countByType: jest.fn().mockResolvedValue(3) });
    const service = createService(repo);

    await service.recordEvent({ token: TOKEN, eventType: 'page_opened' }, '1.2.3.4', null);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ firstVisit: false }) }),
    );
  });

  it('should deduplicate views within 5 minutes (same IP + token)', async () => {
    const repo = mockRepo({
      findRecentByTokenAndIp: jest.fn().mockResolvedValue(sampleEvent),
    });
    const service = createService(repo);

    const result = await service.recordEvent(
      { token: TOKEN, eventType: 'page_opened' }, '192.168.1.42', null,
    );

    expect(result).toBeNull();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('should throw LINK_NOT_FOUND for invalid token', async () => {
    const dp = mockDataProvider({ resolveLinkByToken: jest.fn().mockResolvedValue(null) });
    const service = createService(undefined, dp);

    await expect(
      service.recordEvent({ token: 'bad', eventType: 'page_opened' }, null, null),
    ).rejects.toThrow(TrackLinkNotFoundError);
  });

  it('should throw LINK_EXPIRED for expired link', async () => {
    const expired = { ...validLink, expiresAt: new Date(Date.now() - 1000) };
    const dp = mockDataProvider({ resolveLinkByToken: jest.fn().mockResolvedValue(expired) });
    const service = createService(undefined, dp);

    await expect(
      service.recordEvent({ token: TOKEN, eventType: 'page_opened' }, null, null),
    ).rejects.toThrow(TrackLinkExpiredError);
  });

  it('should throw LINK_DEACTIVATED for inactive link', async () => {
    const inactive = { ...validLink, isActive: false };
    const dp = mockDataProvider({ resolveLinkByToken: jest.fn().mockResolvedValue(inactive) });
    const service = createService(undefined, dp);

    await expect(
      service.recordEvent({ token: TOKEN, eventType: 'page_opened' }, null, null),
    ).rejects.toThrow(TrackLinkDeactivatedError);
  });

  it('should anonymize IP address (mask last octet)', async () => {
    const repo = mockRepo();
    const service = createService(repo);

    await service.recordEvent(
      { token: TOKEN, eventType: 'section_viewed', metadata: { sectionType: 'photos' } },
      '10.20.30.40', null,
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ ipAddress: '10.20.30.0' }),
    );
  });
});

describe('TrackingService.recordHeartbeat', () => {
  it('should create time_spent event', async () => {
    const repo = mockRepo();
    const service = createService(repo);

    await service.recordHeartbeat(
      { token: TOKEN, durationSinceLastBeat: 30, currentSection: 'photos' },
      '1.2.3.4', null,
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'time_spent',
        metadata: { durationSeconds: 30, sectionId: 'photos' },
      }),
    );
  });

  it('should throw for expired link', async () => {
    const expired = { ...validLink, expiresAt: new Date(Date.now() - 1000) };
    const dp = mockDataProvider({ resolveLinkByToken: jest.fn().mockResolvedValue(expired) });
    const service = createService(undefined, dp);

    await expect(
      service.recordHeartbeat({ token: TOKEN, durationSinceLastBeat: 30 }, null, null),
    ).rejects.toThrow(TrackLinkExpiredError);
  });

  it('should rate-limit to 60/min per token', async () => {
    const service = createService();

    // Fire 60 events (should all pass)
    for (let i = 0; i < 60; i++) {
      await service.recordHeartbeat({ token: TOKEN, durationSinceLastBeat: 1 }, null, null);
    }

    // 61st should be rate limited
    await expect(
      service.recordHeartbeat({ token: TOKEN, durationSinceLastBeat: 1 }, null, null),
    ).rejects.toThrow(TrackRateLimitedError);
  });
});
