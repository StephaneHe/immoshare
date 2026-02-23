import { create } from 'zustand';
import { propertyService } from '@/services/property.service';
import { Property, PropertyListFilters, PaginatedResult, CreatePropertyInput, UpdatePropertyInput, PropertyStatus } from '@/types';
import { ApiError } from '@/services/api';

type PropertyState = {
  // List state
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
  filters: PropertyListFilters;
  isLoading: boolean;
  error: string | null;

  // Detail state
  selectedProperty: Property | null;
  isLoadingDetail: boolean;

  // Actions
  fetchProperties: (filters?: PropertyListFilters) => Promise<void>;
  fetchNextPage: () => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  createProperty: (data: CreatePropertyInput) => Promise<Property | null>;
  updateProperty: (id: string, data: UpdatePropertyInput) => Promise<Property | null>;
  changeStatus: (id: string, status: PropertyStatus) => Promise<boolean>;
  removeProperty: (id: string) => Promise<boolean>;
  duplicateProperty: (id: string) => Promise<Property | null>;
  clearError: () => void;
  clearSelectedProperty: () => void;
};

const DEFAULT_LIMIT = 20;

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  total: 0,
  page: 1,
  totalPages: 0,
  filters: { limit: DEFAULT_LIMIT },
  isLoading: false,
  error: null,
  selectedProperty: null,
  isLoadingDetail: false,

  fetchProperties: async (filters?: PropertyListFilters) => {
    const newFilters = { ...get().filters, ...filters, page: filters?.page || 1 };
    set({ isLoading: true, error: null, filters: newFilters });
    try {
      const result = await propertyService.list(newFilters);
      set({
        properties: result.items,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load properties';
      set({ error: message, isLoading: false });
    }
  },

  fetchNextPage: async () => {
    const { page, totalPages, filters, properties, isLoading } = get();
    if (isLoading || page >= totalPages) return;
    set({ isLoading: true });
    try {
      const result = await propertyService.list({ ...filters, page: page + 1 });
      set({
        properties: [...properties, ...result.items],
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load more';
      set({ error: message, isLoading: false });
    }
  },

  fetchPropertyById: async (id: string) => {
    set({ isLoadingDetail: true, error: null });
    try {
      const property = await propertyService.getById(id);
      set({ selectedProperty: property, isLoadingDetail: false });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load property';
      set({ error: message, isLoadingDetail: false });
    }
  },

  createProperty: async (data: CreatePropertyInput) => {
    set({ isLoading: true, error: null });
    try {
      const property = await propertyService.create(data);
      // Prepend to list
      set((state) => ({
        properties: [property, ...state.properties],
        total: state.total + 1,
        isLoading: false,
      }));
      return property;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create property';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateProperty: async (id: string, data: UpdatePropertyInput) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await propertyService.update(id, data);
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? updated : p)),
        selectedProperty: state.selectedProperty?.id === id ? updated : state.selectedProperty,
        isLoading: false,
      }));
      return updated;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update property';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  changeStatus: async (id: string, status: PropertyStatus) => {
    try {
      const updated = await propertyService.changeStatus(id, status);
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? updated : p)),
        selectedProperty: state.selectedProperty?.id === id ? updated : state.selectedProperty,
      }));
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to change status';
      set({ error: message });
      return false;
    }
  },

  removeProperty: async (id: string) => {
    try {
      await propertyService.remove(id);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        total: state.total - 1,
        selectedProperty: state.selectedProperty?.id === id ? null : state.selectedProperty,
      }));
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete property';
      set({ error: message });
      return false;
    }
  },

  duplicateProperty: async (id: string) => {
    try {
      const dup = await propertyService.duplicate(id);
      set((state) => ({
        properties: [dup, ...state.properties],
        total: state.total + 1,
      }));
      return dup;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to duplicate';
      set({ error: message });
      return null;
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedProperty: () => set({ selectedProperty: null }),
}));
