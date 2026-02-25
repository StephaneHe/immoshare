/**
 * Partner Service — API layer for partners and reshare (M7)
 * Endpoints: GET/POST/DELETE /api/v1/partner-invites, /api/v1/partners, /api/v1/reshare-requests
 */
import { api } from './api';

export type PartnerInvite = {
  id: string;
  code: string;
  inviterId: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
};

export type Partner = {
  inviteId: string;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  since: string;
};

export type PartnerProperty = {
  id: string;
  title: string;
  type: string;
  status: string;
  city: string;
  price: number;
};

export type ReshareRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  propertyId: string;
  propertyTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
};

export const partnerService = {
  async listInvites(): Promise<PartnerInvite[]> {
    return api.get<PartnerInvite[]>('/api/v1/partner-invites');
  },

  async createInvite(): Promise<PartnerInvite> {
    return api.post<PartnerInvite>('/api/v1/partner-invites');
  },

  async revokeInvite(id: string): Promise<void> {
    return api.delete<void>(`/api/v1/partner-invites/${id}`);
  },

  async acceptInvite(code: string): Promise<Partner> {
    return api.post<Partner>('/api/v1/partner-invites/accept', { code });
  },

  async listPartners(): Promise<Partner[]> {
    return api.get<Partner[]>('/api/v1/partners');
  },

  async removePartner(inviteId: string): Promise<void> {
    return api.delete<void>(`/api/v1/partners/${inviteId}`);
  },

  async listPartnerProperties(inviteId: string): Promise<PartnerProperty[]> {
    return api.get<PartnerProperty[]>(`/api/v1/partners/${inviteId}/properties`);
  },

  async getPartnerProperty(inviteId: string, propertyId: string): Promise<PartnerProperty> {
    return api.get<PartnerProperty>(`/api/v1/partners/${inviteId}/properties/${propertyId}`);
  },

  async listReceivedReshareRequests(): Promise<ReshareRequest[]> {
    return api.get<ReshareRequest[]>('/api/v1/reshare-requests');
  },

  async listSentReshareRequests(): Promise<ReshareRequest[]> {
    return api.get<ReshareRequest[]>('/api/v1/reshare-requests/sent');
  },

  async createReshareRequest(propertyId: string, inviteId: string): Promise<ReshareRequest> {
    return api.post<ReshareRequest>('/api/v1/reshare-requests', { propertyId, inviteId });
  },

  async approveReshare(id: string): Promise<ReshareRequest> {
    return api.post<ReshareRequest>(`/api/v1/reshare-requests/${id}/approve`);
  },

  async rejectReshare(id: string): Promise<ReshareRequest> {
    return api.post<ReshareRequest>(`/api/v1/reshare-requests/${id}/reject`);
  },
};
