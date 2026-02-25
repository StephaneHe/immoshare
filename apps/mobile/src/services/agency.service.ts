/**
 * Agency Service — API layer for agency management (M2)
 * Endpoints: GET/POST/PATCH/DELETE /api/v1/agencies
 */
import { api } from './api';

export type Agency = {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  adminId: string;
  createdAt: string;
  updatedAt: string;
};

export type AgencyMember = {
  id: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
};

export type AgencyInvite = {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
};

export const agencyService = {
  async getById(id: string): Promise<Agency> {
    return api.get<Agency>(`/api/v1/agencies/${id}`);
  },

  async create(data: { name: string }): Promise<Agency> {
    return api.post<Agency>('/api/v1/agencies', data);
  },

  async update(id: string, data: Partial<Agency>): Promise<Agency> {
    return api.patch<Agency>(`/api/v1/agencies/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/api/v1/agencies/${id}`);
  },

  async listMembers(agencyId: string): Promise<AgencyMember[]> {
    return api.get<AgencyMember[]>(`/api/v1/agencies/${agencyId}/agents`);
  },

  async removeMember(agencyId: string, userId: string): Promise<void> {
    return api.delete<void>(`/api/v1/agencies/${agencyId}/agents/${userId}`);
  },

  async listInvites(agencyId: string): Promise<AgencyInvite[]> {
    return api.get<AgencyInvite[]>(`/api/v1/agencies/${agencyId}/invites`);
  },

  async createInvite(agencyId: string, email: string): Promise<AgencyInvite> {
    return api.post<AgencyInvite>(`/api/v1/agencies/${agencyId}/invites`, { email });
  },

  async revokeInvite(agencyId: string, inviteId: string): Promise<void> {
    return api.delete<void>(`/api/v1/agencies/${agencyId}/invites/${inviteId}`);
  },

  async acceptInvite(token: string): Promise<void> {
    return api.post<void>(`/api/v1/agency-invites/${token}/accept`);
  },

  async declineInvite(token: string): Promise<void> {
    return api.post<void>(`/api/v1/agency-invites/${token}/decline`);
  },

  async leave(agencyId: string): Promise<void> {
    return api.post<void>(`/api/v1/agencies/${agencyId}/agents/leave`);
  },

  async transferAdmin(agencyId: string, newAdminId: string): Promise<void> {
    return api.post<void>(`/api/v1/agencies/${agencyId}/transfer-admin`, { newAdminId });
  },

  async listMyInvites(): Promise<AgencyInvite[]> {
    return api.get<AgencyInvite[]>('/api/v1/users/me/agency-invites');
  },
};
