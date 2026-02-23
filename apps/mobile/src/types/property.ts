// ─── Shared types mirroring backend property.types.ts ───

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'penthouse'
  | 'duplex'
  | 'garden_apartment'
  | 'studio'
  | 'villa'
  | 'cottage'
  | 'land'
  | 'commercial'
  | 'office'
  | 'other';

export type PropertyStatus = 'draft' | 'active' | 'under_offer' | 'sold' | 'rented' | 'archived';

export interface Property {
  id: string;
  ownerId: string;
  agencyId: string | null;
  title: string;
  description: string | null;
  propertyType: PropertyType;
  status: PropertyStatus;
  price: number | null;
  currency: string;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  areaSqm: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  parking: number | null;
  elevator: boolean | null;
  balcony: boolean | null;
  garden: boolean | null;
  aircon: boolean | null;
  furnished: boolean | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PropertyListFilters {
  status?: PropertyStatus;
  propertyType?: PropertyType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreatePropertyInput {
  title: string;
  description?: string;
  propertyType: PropertyType;
  price?: number;
  currency?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  areaSqm?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  parking?: number;
  elevator?: boolean;
  balcony?: boolean;
  garden?: boolean;
  aircon?: boolean;
  furnished?: boolean;
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

// ─── Display helpers ───

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  penthouse: 'Penthouse',
  duplex: 'Duplex',
  garden_apartment: 'Garden Apt',
  studio: 'Studio',
  villa: 'Villa',
  cottage: 'Cottage',
  land: 'Land',
  commercial: 'Commercial',
  office: 'Office',
  other: 'Other',
};

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  under_offer: 'Under Offer',
  sold: 'Sold',
  rented: 'Rented',
  archived: 'Archived',
};

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  draft: '#6B7280',
  active: '#059669',
  under_offer: '#D97706',
  sold: '#DC2626',
  rented: '#2563EB',
  archived: '#9CA3AF',
};
