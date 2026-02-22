import { ShareService } from '../../../src/modules/share/share.service';
import {
  IShareLinkRepository,
  IShareBatchRepository,
  IContactRepository,
  IShareDataProvider,
  ShareLinkRecord,
  ContactRecord,
} from '../../../src/modules/share/share.types';
import {
  ShareLinkNotFoundError,
  ShareLinkExpiredError,
  ShareLinkDeactivatedError,
  NotShareLinkOwnerError,
  PageNotFoundForShareError,
  NoValidRecipientsError,
} from '../../../src/modules/share/share.errors';

const USER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const OTHER_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const PAGE_ID = 'cccccccc-1111-2222-3333-444444444444';
const PROP_ID = 'dddddddd-1111-2222-3333-444444444444';
const CONTACT_1 = 'eeeeeeee-1111-2222-3333-444444444444';
const CONTACT_2 = 'ffffffff-1111-2222-3333-444444444444';
const LINK_ID = '11111111-1111-2222-3333-444444444444';
const TOKEN = '22222222-1111-2222-3333-444444444444';
const BATCH_ID = '33333333-1111-2222-3333-444444444444';

const contact1: ContactRecord = {
  id: CONTACT_1, ownerId: USER_ID, name: 'David',
  phone: '+972501234567', email: 'david@test.com',
  tags: [], notes: null, createdAt: new Date(), updatedAt: new Date(),
};

const contact2NoPhone: ContactRecord = {
  id: CONTACT_2, ownerId: USER_ID, name: 'Sarah',
  phone: null, email: 'sarah@test.com',
  tags: [], notes: null, createdAt: new Date(), updatedAt: new Date(),
};

let linkCounter = 0;
function makeLinkRecord(overrides: Partial<ShareLinkRecord> = {}): ShareLinkRecord {
  return {
    id: `link-${++linkCounter}`,
    pageId: PAGE_ID,
    contactId: CONTACT_1,
    channel: 'whatsapp',
    token: `token-${linkCounter}`,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 86400000),
    sentAt: null,
    deliveredAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

const sampleLink: ShareLinkRecord = {
  id: LINK_ID, pageId: PAGE_ID, contactId: CONTACT_1,
  channel: 'whatsapp', token: TOKEN, isActive: true,
  expiresAt: new Date(Date.now() + 30 * 86400000),
  sentAt: null, deliveredAt: null, createdAt: new Date(),
};

// ─── Mocks ───

function mockLinkRepo(overrides: Partial<IShareLinkRepository> = {}): IShareLinkRepository {
  return {
    create: jest.fn().mockImplementation(() => Promise.resolve(makeLinkRecord())),
    findById: jest.fn().mockResolvedValue(null),
    findByToken: jest.fn().mockResolvedValue(null),
    list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    deactivate: jest.fn(),
    deactivateByPageId: jest.fn().mockResolvedValue(0),
    updateDelivered: jest.fn(),
    updateSent: jest.fn(),
    ...overrides,
  };
}

function mockBatchRepo(): IShareBatchRepository {
  return {
    create: jest.fn().mockResolvedValue({ id: BATCH_ID, userId: USER_ID, pageId: PAGE_ID, linkIds: [], totalSent: 0, totalFailed: 0, createdAt: new Date() }),
  };
}

function mockContactRepo(overrides: Partial<IContactRepository> = {}): IContactRepository {
  return {
    create: jest.fn(),
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === CONTACT_1) return Promise.resolve(contact1);
      if (id === CONTACT_2) return Promise.resolve(contact2NoPhone);
      return Promise.resolve(null);
    }),
    list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

function mockDataProvider(overrides: Partial<IShareDataProvider> = {}): IShareDataProvider {
  return {
    getPageOwnerId: jest.fn().mockResolvedValue(USER_ID),
    getPagePropertyId: jest.fn().mockResolvedValue(PROP_ID),
    isPageActive: jest.fn().mockResolvedValue(true),
    getPropertyTitle: jest.fn().mockResolvedValue('Nice apartment'),
    getAgentName: jest.fn().mockResolvedValue('John Agent'),
    ...overrides,
  };
}

function createService(
  linkRepo?: IShareLinkRepository,
  batchRepo?: IShareBatchRepository,
  contactRepo?: IContactRepository,
  dp?: IShareDataProvider,
) {
  return new ShareService(
    linkRepo || mockLinkRepo(),
    batchRepo || mockBatchRepo(),
    contactRepo || mockContactRepo(),
    dp || mockDataProvider(),
  );
}

// ─── Tests ───

describe('ShareService.share', () => {
  beforeEach(() => { linkCounter = 0; });

  it('should create one ShareLink per contact per channel', async () => {
    const linkRepo = mockLinkRepo();
    const service = createService(linkRepo);

    const result = await service.share(USER_ID, PAGE_ID, {
      recipients: [
        { contactId: CONTACT_1, channels: ['whatsapp', 'email'] },
      ],
    });

    expect(linkRepo.create).toHaveBeenCalledTimes(2);
    expect(result.totalLinks).toBe(2);
  });

  it('should set expiresAt based on expiresInDays', async () => {
    const linkRepo = mockLinkRepo();
    const service = createService(linkRepo);

    await service.share(USER_ID, PAGE_ID, {
      recipients: [{ contactId: CONTACT_1, channels: ['email'] }],
      expiresInDays: 7,
    });

    const createCall = (linkRepo.create as jest.Mock).mock.calls[0][0];
    const daysDiff = (createCall.expiresAt.getTime() - Date.now()) / 86400000;
    expect(daysDiff).toBeGreaterThan(6.9);
    expect(daysDiff).toBeLessThan(7.1);
  });

  it('should skip channel if contact lacks required field and warn', async () => {
    const service = createService();

    // contact2 has no phone but has email → whatsapp skipped, email works
    const result = await service.share(USER_ID, PAGE_ID, {
      recipients: [
        { contactId: CONTACT_2, channels: ['whatsapp', 'email'] },
      ],
    });

    expect(result.warnings).toContainEqual(expect.stringContaining('no phone'));
    expect(result.totalLinks).toBe(1); // only email created
  });

  it('should return warnings for skipped channels across recipients', async () => {
    const service = createService();
    const result = await service.share(USER_ID, PAGE_ID, {
      recipients: [
        { contactId: CONTACT_1, channels: ['email'] },
        { contactId: CONTACT_2, channels: ['sms'] }, // no phone → skipped
      ],
    });
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.totalLinks).toBe(1); // only email for contact1
  });

  it('should create a ShareBatch record', async () => {
    const batchRepo = mockBatchRepo();
    const service = createService(undefined, batchRepo);

    await service.share(USER_ID, PAGE_ID, {
      recipients: [{ contactId: CONTACT_1, channels: ['email'] }],
    });

    expect(batchRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: USER_ID, pageId: PAGE_ID }),
    );
  });

  it('should throw PAGE_NOT_FOUND for invalid page', async () => {
    const dp = mockDataProvider({ getPageOwnerId: jest.fn().mockResolvedValue(null) });
    const service = createService(undefined, undefined, undefined, dp);

    await expect(service.share(USER_ID, 'bad-page', {
      recipients: [{ contactId: CONTACT_1, channels: ['email'] }],
    })).rejects.toThrow(PageNotFoundForShareError);
  });

  it('should throw NOT_OWNER if user does not own page', async () => {
    const service = createService();
    await expect(service.share(OTHER_ID, PAGE_ID, {
      recipients: [{ contactId: CONTACT_1, channels: ['email'] }],
    })).rejects.toThrow(NotShareLinkOwnerError);
  });

  it('should throw NO_VALID_RECIPIENTS if all skipped', async () => {
    const contactRepo = mockContactRepo({
      findById: jest.fn().mockResolvedValue(null),
    });
    const service = createService(undefined, undefined, contactRepo);

    await expect(service.share(USER_ID, PAGE_ID, {
      recipients: [{ contactId: 'bad-id', channels: ['email'] }],
    })).rejects.toThrow(NoValidRecipientsError);
  });

  it('should call adapter.send when adapter is registered', async () => {
    const mockAdapter = {
      channel: 'email' as const,
      send: jest.fn().mockResolvedValue({ success: true }),
    };
    const linkRepo = mockLinkRepo();
    const service = createService(linkRepo);
    service.registerAdapter(mockAdapter);

    await service.share(USER_ID, PAGE_ID, {
      recipients: [{ contactId: CONTACT_1, channels: ['email'] }],
    });

    expect(mockAdapter.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'david@test.com',
        propertyTitle: 'Nice apartment',
        agentName: 'John Agent',
      }),
    );
  });

  it('should handle adapter failure gracefully', async () => {
    const mockAdapter = {
      channel: 'email' as const,
      send: jest.fn().mockResolvedValue({ success: false, error: 'SMTP error' }),
    };
    const service = createService();
    service.registerAdapter(mockAdapter);

    const result = await service.share(USER_ID, PAGE_ID, {
      recipients: [{ contactId: CONTACT_1, channels: ['email'] }],
    });

    expect(result.totalFailed).toBe(1);
    expect(result.warnings).toContainEqual(expect.stringContaining('SMTP error'));
  });
});

describe('ShareService.resolveToken', () => {
  it('should return page data for valid active token', async () => {
    const linkRepo = mockLinkRepo({ findByToken: jest.fn().mockResolvedValue(sampleLink) });
    const service = createService(linkRepo);

    const result = await service.resolveToken(TOKEN);
    expect(result.pageId).toBe(PAGE_ID);
  });

  it('should throw LINK_NOT_FOUND for invalid token', async () => {
    const service = createService();
    await expect(service.resolveToken('bad-token')).rejects.toThrow(ShareLinkNotFoundError);
  });

  it('should throw LINK_DEACTIVATED for inactive link', async () => {
    const inactive = { ...sampleLink, isActive: false };
    const linkRepo = mockLinkRepo({ findByToken: jest.fn().mockResolvedValue(inactive) });
    const service = createService(linkRepo);

    await expect(service.resolveToken(TOKEN)).rejects.toThrow(ShareLinkDeactivatedError);
  });

  it('should throw LINK_EXPIRED for expired link', async () => {
    const expired = { ...sampleLink, expiresAt: new Date(Date.now() - 1000) };
    const linkRepo = mockLinkRepo({ findByToken: jest.fn().mockResolvedValue(expired) });
    const service = createService(linkRepo);

    await expect(service.resolveToken(TOKEN)).rejects.toThrow(ShareLinkExpiredError);
  });
});

describe('ShareService.deactivate', () => {
  it('should deactivate link for owner', async () => {
    const linkRepo = mockLinkRepo({ findById: jest.fn().mockResolvedValue(sampleLink) });
    const service = createService(linkRepo);

    await service.deactivate(LINK_ID, USER_ID);
    expect(linkRepo.deactivate).toHaveBeenCalledWith(LINK_ID);
  });

  it('should throw NOT_OWNER', async () => {
    const linkRepo = mockLinkRepo({ findById: jest.fn().mockResolvedValue(sampleLink) });
    const service = createService(linkRepo);

    await expect(service.deactivate(LINK_ID, OTHER_ID)).rejects.toThrow(NotShareLinkOwnerError);
  });
});

describe('ShareService.handleDeliveryWebhook', () => {
  it('should update deliveredAt on success', async () => {
    const linkRepo = mockLinkRepo({ findByToken: jest.fn().mockResolvedValue(sampleLink) });
    const service = createService(linkRepo);

    await service.handleDeliveryWebhook(TOKEN, true);
    expect(linkRepo.updateDelivered).toHaveBeenCalledWith(LINK_ID, expect.any(Date));
  });

  it('should silently ignore unknown tokens', async () => {
    const service = createService();
    await expect(service.handleDeliveryWebhook('unknown', true)).resolves.toBeUndefined();
  });
});
