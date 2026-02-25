/**
 * Share Service — API layer for share links and batches (M5 Sharing)
 * Endpoints: POST /pages/:pageId/share, GET/PATCH /share-links
 */
import { api } from './api';

export type ShareChannel = 'whatsapp' | 'email' | 'sms';

export type ShareLink = {
  id: string;
  token: string;
  pageId: string;
  contactId: string;
  channel: ShareChannel;
  isActive: boolean;
  expiresAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
};

export type ShareRequest = {
  contactIds: string[];
  channels: ShareChannel[];
  expirationDays?: number;
};

export type ShareResult = {
  batch: {
    id: string;
    totalLinks: number;
    successCount: number;
    failureCount: number;
  };
  links: ShareLink[];
  warnings: string[];
};

export type ShareLinkListResponse = {
  shareLinks: ShareLink[];
  total: number;
  page: number;
  totalPages: number;
};

export type ShareLinkListParams = {
  page?: number;
  limit?: number;
  propertyId?: string;
};

export type ShareLinkEvent = {
  id: string;
  type: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export const shareService = {
  async createBatch(pageId: string, data: ShareRequest): Promise<ShareResult> {
    return api.post<ShareResult>(`/api/v1/pages/${pageId}/share`, data);
  },

  async listLinks(params: ShareLinkListParams = {}): Promise<ShareLinkListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.propertyId) query.set('propertyId', params.propertyId);
    const qs = query.toString();
    return api.get<ShareLinkListResponse>(`/api/v1/share-links${qs ? `?${qs}` : ''}`);
  },

  async getLinkById(id: string): Promise<ShareLink> {
    return api.get<ShareLink>(`/api/v1/share-links/${id}`);
  },

  async getLinkEvents(id: string): Promise<ShareLinkEvent[]> {
    return api.get<ShareLinkEvent[]>(`/api/v1/share-links/${id}/events`);
  },

  async deactivateLink(id: string): Promise<ShareLink> {
    return api.patch<ShareLink>(`/api/v1/share-links/${id}/deactivate`);
  },

  async listPropertyLinks(propertyId: string): Promise<ShareLink[]> {
    return api.get<ShareLink[]>(`/api/v1/properties/${propertyId}/share-links`);
  },
};
