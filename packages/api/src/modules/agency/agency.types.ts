// ─── Domain types for Agency module ───

export interface AgencyRecord {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  website: string | null;
  adminId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AgencyInviteRecord {
  id: string;
  agencyId: string;
  email: string;
  invitedBy: string;
  status: AgencyInviteStatus;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  resolvedAt: Date | null;
}

export type AgencyInviteStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';

export interface CreateAgencyInput {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface UpdateAgencyInput {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

export interface AgencyMember {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: Date;
}

// ─── Repository interface ───

export interface IAgencyRepository {
  createAgency(data: CreateAgencyInput & { adminId: string }): Promise<AgencyRecord>;
  findAgencyById(id: string): Promise<AgencyRecord | null>;
  findAgencyByAdminId(adminId: string): Promise<AgencyRecord | null>;
  updateAgency(id: string, data: UpdateAgencyInput): Promise<AgencyRecord>;
  softDeleteAgency(id: string): Promise<void>;
  listAgencyMembers(agencyId: string): Promise<AgencyMember[]>;
  removeAgentFromAgency(userId: string): Promise<void>;
  removeAllAgentsFromAgency(agencyId: string): Promise<void>;
  setUserAgency(userId: string, agencyId: string | null): Promise<void>;
  setUserRole(userId: string, role: string): Promise<void>;
  findUserById(userId: string): Promise<{ id: string; email: string; name: string; role: string; agencyId: string | null } | null>;
  findUserByEmail(email: string): Promise<{ id: string; email: string; name: string; role: string; agencyId: string | null } | null>;
}

export interface IAgencyInviteRepository {
  createInvite(data: {
    agencyId: string;
    email: string;
    invitedBy: string;
    token: string;
    expiresAt: Date;
  }): Promise<AgencyInviteRecord>;
  findInviteByToken(token: string): Promise<AgencyInviteRecord | null>;
  findInviteById(id: string): Promise<AgencyInviteRecord | null>;
  findPendingInviteByEmail(agencyId: string, email: string): Promise<AgencyInviteRecord | null>;
  listInvitesByAgency(agencyId: string): Promise<AgencyInviteRecord[]>;
  listPendingInvitesByEmail(email: string): Promise<(AgencyInviteRecord & { agencyName: string })[]>;
  updateInviteStatus(id: string, status: AgencyInviteStatus, resolvedAt?: Date): Promise<void>;
  revokeAllPendingInvites(agencyId: string): Promise<void>;
}
