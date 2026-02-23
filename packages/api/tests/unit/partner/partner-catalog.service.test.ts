import { PartnerCatalogService } from '../../../src/modules/partner/partner-catalog.service';
import {
  IPartnerInviteRepository,
  IPartnerDataProvider,
  PartnerInviteRecord,
} from '../../../src/modules/partner/partner.types';
import {
  PartnerInviteNotFoundError,
  NotPartnerError,
  PartnerInviteRevokedError,
} from '../../../src/modules/partner/partner.errors';

const USER_A = 'aaaaaaaa-1111-2222-3333-444444444444';
const USER_B = 'bbbbbbbb-1111-2222-3333-444444444444';
const OTHER = 'cccccccc-1111-2222-3333-444444444444';
const INVITE_ID = 'dddddddd-1111-2222-3333-444444444444';
const PROP_ID = 'eeeeeeee-1111-2222-3333-444444444444';

const acceptedInvite: PartnerInviteRecord = {
  id: INVITE_ID, inviterId: USER_A, inviteeId: USER_B,
  code: 'ABCD1234', status: 'ACCEPTED',
  permissions: { canView: true, canReshare: false },
  expiresAt: new Date(Date.now() + 86400000),
  acceptedAt: new Date(), createdAt: new Date(),
};

const revokedInvite: PartnerInviteRecord = { ...acceptedInvite, status: 'REVOKED' };

const sampleProperty = {
  id: PROP_ID, title: 'Nice apt', propertyType: 'apartment', status: 'active',
  price: 500000, city: 'Tel Aviv', rooms: 3, areaSqm: 80,
  media: [{ url: 'http://img.jpg', type: 'photo', order: 0 }],
};

function mockInviteRepo(overrides: Partial<IPartnerInviteRepository> = {}): IPartnerInviteRepository {
  return {
    create: jest.fn(), findByCode: jest.fn(), findById: jest.fn().mockResolvedValue(acceptedInvite),
    findByInviter: jest.fn(), findActivePartners: jest.fn(),
    findPartnershipByPair: jest.fn(), countActivePartners: jest.fn(),
    accept: jest.fn(), revoke: jest.fn(), ...overrides,
  };
}

function mockDataProvider(overrides: Partial<IPartnerDataProvider> = {}): IPartnerDataProvider {
  return {
    getActivePropertiesByOwner: jest.fn().mockResolvedValue([sampleProperty]),
    getPropertyDetail: jest.fn().mockResolvedValue({ ...sampleProperty, description: null, address: null, bedrooms: 2, bathrooms: 1, floor: 3, ownerId: USER_A, media: [] }),
    getPropertyOwnerId: jest.fn().mockResolvedValue(USER_A),
    getAgencyMemberIds: jest.fn().mockResolvedValue(null),
    deactivatePartnerShareLinks: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

describe('PartnerCatalogService.listProperties', () => {
  it('should return only active properties of inviter', async () => {
    const service = new PartnerCatalogService(mockInviteRepo(), mockDataProvider());
    const result = await service.listProperties(INVITE_ID, USER_B);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Nice apt');
  });

  it('should throw NOT_PARTNER if invite is revoked', async () => {
    const service = new PartnerCatalogService(
      mockInviteRepo({ findById: jest.fn().mockResolvedValue(revokedInvite) }),
      mockDataProvider(),
    );
    await expect(service.listProperties(INVITE_ID, USER_B)).rejects.toThrow(PartnerInviteRevokedError);
  });

  it('should throw NOT_PARTNER if user is not the invitee', async () => {
    const service = new PartnerCatalogService(mockInviteRepo(), mockDataProvider());
    await expect(service.listProperties(INVITE_ID, OTHER)).rejects.toThrow(NotPartnerError);
  });

  it('should not include draft or sold properties', async () => {
    const dp = mockDataProvider({ getActivePropertiesByOwner: jest.fn().mockResolvedValue([]) });
    const service = new PartnerCatalogService(mockInviteRepo(), dp);
    const result = await service.listProperties(INVITE_ID, USER_B);
    expect(result).toHaveLength(0);
  });
});
