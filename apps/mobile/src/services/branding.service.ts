/**
 * Branding Service — API layer for branding customization (M9)
 * Endpoints: GET/PUT/PATCH /api/v1/branding, POST/DELETE logo/photo
 */
import { api } from './api';

export type Branding = {
  id: string;
  userId: string;
  agencyId: string | null;
  primaryColor: string;
  accentColor: string;
  fontFamily: string | null;
  tagline: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateBrandingData = {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  tagline?: string;
};

export const brandingService = {
  async get(): Promise<Branding> {
    return api.get<Branding>('/api/v1/branding');
  },

  async update(data: UpdateBrandingData): Promise<Branding> {
    return api.patch<Branding>('/api/v1/branding', data);
  },

  async uploadLogo(formData: FormData): Promise<{ logoUrl: string }> {
    // Logo upload uses multipart, handled differently
    return api.post<{ logoUrl: string }>('/api/v1/branding/logo', formData);
  },

  async deleteLogo(): Promise<void> {
    return api.delete<void>('/api/v1/branding/logo');
  },

  async uploadPhoto(formData: FormData): Promise<{ photoUrl: string }> {
    return api.post<{ photoUrl: string }>('/api/v1/branding/photo', formData);
  },

  async deletePhoto(): Promise<void> {
    return api.delete<void>('/api/v1/branding/photo');
  },

  async getPreviewUrl(): Promise<string> {
    return '/api/v1/branding/preview';
  },
};
