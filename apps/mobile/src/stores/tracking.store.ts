/**
 * Tracking Store — state management for analytics dashboard (M6)
 */
import { create } from 'zustand';
import {
  trackingService,
  PropertyAnalytics,
  DashboardResponse,
  DashboardParams,
} from '../services/tracking.service';

type TrackingState = {
  dashboard: DashboardResponse | null;
  propertyAnalytics: PropertyAnalytics | null;
  period: '7d' | '30d' | '90d';
  isLoading: boolean;
  error: string | null;

  fetchDashboard: (params?: DashboardParams) => Promise<void>;
  fetchPropertyAnalytics: (propertyId: string) => Promise<void>;
  setPeriod: (period: '7d' | '30d' | '90d') => void;
};

export const useTrackingStore = create<TrackingState>((set, get) => ({
  dashboard: null,
  propertyAnalytics: null,
  period: '30d',
  isLoading: false,
  error: null,

  fetchDashboard: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await trackingService.getDashboard(params || { period: get().period });
      set({ dashboard, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load dashboard', isLoading: false });
    }
  },

  fetchPropertyAnalytics: async (propertyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const analytics = await trackingService.getPropertyAnalytics(propertyId);
      set({ propertyAnalytics: analytics, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load analytics', isLoading: false });
    }
  },

  setPeriod: (period) => {
    set({ period });
  },
}));
