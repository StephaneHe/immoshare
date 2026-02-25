/**
 * Page Service — API layer for property pages (M4)
 * Endpoints: GET/POST/PATCH/DELETE /api/v1/pages, /api/v1/properties/:propertyId/pages
 */
import { api } from './api';

export type PageSection = {
  type: string;
  title?: string;
  fields?: string[];
  mediaIds?: string[];
  content?: string;
  order: number;
};

export type Page = {
  id: string;
  propertyId: string;
  title: string;
  sections: PageSection[];
  locale: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePageData = {
  title: string;
  sections?: PageSection[];
  locale?: string;
};

export type UpdatePageData = {
  title?: string;
  sections?: PageSection[];
  locale?: string;
};

export const pageService = {
  async listForProperty(propertyId: string): Promise<Page[]> {
    return api.get<Page[]>(`/api/v1/properties/${propertyId}/pages`);
  },

  async getById(id: string): Promise<Page> {
    return api.get<Page>(`/api/v1/pages/${id}`);
  },

  async create(propertyId: string, data: CreatePageData): Promise<Page> {
    return api.post<Page>(`/api/v1/properties/${propertyId}/pages`, data);
  },

  async update(id: string, data: UpdatePageData): Promise<Page> {
    return api.patch<Page>(`/api/v1/pages/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/api/v1/pages/${id}`);
  },

  async getPreviewUrl(id: string): Promise<string> {
    // Preview returns HTML, we just need the URL
    return `/api/v1/pages/${id}/preview`;
  },
};
