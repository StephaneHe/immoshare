// ─── Domain types for Partner module ───

export type PartnerInviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
export type ReshareRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ─── PartnerInvite ───

export interface PartnerInviteRecord {
  id: string;
  inviterId: string;
  inviteeId: string | null;
  code: string;
  status: PartnerInviteStatus;
  permissions: { canView: boolean; canReshare: boolean };
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface CreatePartnerInviteInput {
  inviterId: string;
}

export interface AcceptPartnerInviteInput {
  code: string;
  userId: string;
}

// ─── ReshareRequest ───

export interface ReshareRequestRecord {
  id: string;
  partnerId: string;
  propertyId: string;
  status: ReshareRequestStatus;
  message: string | null;
  requestedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
}

export interface CreateReshareInput {
  partnerId: string;
  propertyId: string;
  message?: string;
}

// ─── Repository interfaces ───

export interface IPartnerInviteRepository {
  create(data: {
    inviterId: string;
    code: string;
    expiresAt: Date;
    permissions: { canView: boolean; canReshare: boolean };
  }): Promise<PartnerInviteRecord>;

  findByCode(code: string): Promise<PartnerInviteRecord | null>;
  findById(id: string): Promise<PartnerInviteRecord | null>;
  findByInviter(inviterId: string): Promise<PartnerInviteRecord[]>;
  findActivePartners(inviterId: string): Promise<PartnerInviteRecord[]>;
  findPartnershipByPair(inviterId: string, inviteeId: string): Promise<PartnerInviteRecord | null>;
  countActivePartners(userId: string): Promise<number>;

  accept(id: string, inviteeId: string): Promise<PartnerInviteRecord>;
  revoke(id: string): Promise<PartnerInviteRecord>;
}

export interface IReshareRepository {
  create(data: CreateReshareInput): Promise<ReshareRequestRecord>;
  findById(id: string): Promise<ReshareRequestRecord | null>;
  findPending(partnerId: string, propertyId: string): Promise<ReshareRequestRecord | null>;
  findByPropertyOwner(ownerId: string): Promise<ReshareRequestRecord[]>;
  findByPartner(partnerId: string): Promise<ReshareRequestRecord[]>;
  approve(id: string, resolvedBy: string): Promise<ReshareRequestRecord>;
  reject(id: string, resolvedBy: string): Promise<ReshareRequestRecord>;
  revokeAllForPartner(partnerId: string, inviterId: string): Promise<number>;
}

// ─── Data provider (cross-module reads) ───

export interface IPartnerDataProvider {
  getActivePropertiesByOwner(ownerId: string): Promise<Array<{
    id: string;
    title: string;
    propertyType: string;
    status: string;
    price: number | null;
    city: string | null;
    rooms: number | null;
    areaSqm: number | null;
    media: Array<{ url: string; type: string; order: number }>;
  }>>;

  getPropertyDetail(propertyId: string): Promise<{
    id: string;
    title: string;
    description: string | null;
    propertyType: string;
    status: string;
    price: number | null;
    city: string | null;
    address: string | null;
    rooms: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    areaSqm: number | null;
    floor: number | null;
    ownerId: string;
    media: Array<{ id: string; url: string; type: string; order: number; caption: string | null }>;
  } | null>;

  getPropertyOwnerId(propertyId: string): Promise<string | null>;

  // Check if inviter is agency_admin → get all agency member properties
  getAgencyMemberIds(userId: string): Promise<string[] | null>;

  // Deactivate share links created by partner for agent's properties
  deactivatePartnerShareLinks(partnerId: string, propertyOwnerIds: string[]): Promise<number>;
}
