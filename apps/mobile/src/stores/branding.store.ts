/**
 * Branding Store — state management for branding customization (M9)
 */
import { create } from 'zustand';
import { brandingService, Branding, UpdateBrandingData } from '../services/branding.service';

type BrandingState = {
  branding: Branding | null;
  isLoading: boolean;
  error: string | null;

  fetchBranding: () => Promise<void>;
  updateBranding: (data: UpdateBrandingData) => Promise<void>;
  uploadLogo: (formData: FormData) => Promise<void>;
  deleteLogo: () => Promise<void>;
  uploadPhoto: (formData: FormData) => Promise<void>;
  deletePhoto: () => Promise<void>;
};

export const useBrandingStore = create<BrandingState>((set) => ({
  branding: null,
  isLoading: false,
  error: null,

  fetchBranding: async () => {
    set({ isLoading: true, error: null });
    try {
      const branding = await brandingService.get();
      set({ branding, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load branding', isLoading: false });
    }
  },

  updateBranding: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const branding = await brandingService.update(data);
      set({ branding, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update branding', isLoading: false });
    }
  },

  uploadLogo: async (formData) => {
    const { logoUrl } = await brandingService.uploadLogo(formData);
    set((state) => ({
      branding: state.branding ? { ...state.branding, logoUrl } : null,
    }));
  },

  deleteLogo: async () => {
    await brandingService.deleteLogo();
    set((state) => ({
      branding: state.branding ? { ...state.branding, logoUrl: null } : null,
    }));
  },

  uploadPhoto: async (formData) => {
    const { photoUrl } = await brandingService.uploadPhoto(formData);
    set((state) => ({
      branding: state.branding ? { ...state.branding, photoUrl } : null,
    }));
  },

  deletePhoto: async () => {
    await brandingService.deletePhoto();
    set((state) => ({
      branding: state.branding ? { ...state.branding, photoUrl: null } : null,
    }));
  },
}));
