import { api } from './api';
import { Property, PaginatedResult, PropertyListFilters, CreatePropertyInput, UpdatePropertyInput, PropertyStatus } from '@/types';

export const propertyService = {
  list(filters: PropertyListFilters = {}): Promise<PaginatedResult<Property>> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    if (filters.search) params.set('search', filters.search);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return api.get<PaginatedResult<Property>>(`/api/v1/properties${qs ? `?${qs}` : ''}`);
  },

  getById(id: string): Promise<Property> {
    return api.get<Property>(`/api/v1/properties/${id}`);
  },

  create(data: CreatePropertyInput): Promise<Property> {
    return api.post<Property>('/api/v1/properties', data);
  },

  update(id: string, data: UpdatePropertyInput): Promise<Property> {
    return api.put<Property>(`/api/v1/properties/${id}`, data);
  },

  changeStatus(id: string, status: PropertyStatus): Promise<Property> {
    return api.patch<Property>(`/api/v1/properties/${id}/status`, { status });
  },

  remove(id: string): Promise<void> {
    return api.delete(`/api/v1/properties/${id}`);
  },

  duplicate(id: string): Promise<Property> {
    return api.post<Property>(`/api/v1/properties/${id}/duplicate`);
  },
};
