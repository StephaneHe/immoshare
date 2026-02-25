/**
 * Tracking Service — API layer for analytics (M6)
 * Endpoints: GET /api/v1/properties/:id/analytics, GET /api/v1/analytics/dashboard
 */
import { api } from './api';

export type PropertyAnalytics = {
  propertyId: string;
  totalOpens: number;
  uniqueVisitors: number;
  avgTimeSpent: number;
  openRate: number;
  byChannel: Record<string, number>;
  byContact: Array<{ contactId: string; contactName: string; opens: number }>;
  topSections: Array<{ section: string; avgTime: number }>;
};

export type DashboardStats = {
  totalOpens: number;
  uniqueVisitors: number;
  totalShares: number;
  avgOpenRate: number;
};

export type DashboardResponse = {
  stats: DashboardStats;
  recentActivity: Array<{
    id: string;
    type: string;
    propertyId: string;
    contactName: string | null;
    createdAt: string;
  }>;
  topProperties: Array<{
    propertyId: string;
    propertyTitle: string;
    opens: number;
  }>;
};

export type DashboardParams = {
  period?: '7d' | '30d' | '90d';
};

export const trackingService = {
  async getPropertyAnalytics(propertyId: string): Promise<PropertyAnalytics> {
    return api.get<PropertyAnalytics>(`/api/v1/properties/${propertyId}/analytics`);
  },

  async getDashboard(params: DashboardParams = {}): Promise<DashboardResponse> {
    const query = params.period ? `?period=${params.period}` : '';
    return api.get<DashboardResponse>(`/api/v1/analytics/dashboard${query}`);
  },
};
