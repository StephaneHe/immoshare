import { z } from 'zod';

const propertyTypes = [
  'apartment', 'house', 'penthouse', 'duplex', 'garden_apartment',
  'studio', 'villa', 'cottage', 'land', 'commercial', 'office', 'other',
] as const;

const propertyStatuses = [
  'draft', 'active', 'under_offer', 'sold', 'rented', 'archived',
] as const;

export const createPropertySchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  propertyType: z.enum(propertyTypes),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  areaSqm: z.number().positive().optional(),
  rooms: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  floor: z.number().int().optional(),
  totalFloors: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(2100).optional(),
  parking: z.number().int().nonnegative().optional(),
  elevator: z.boolean().optional(),
  balcony: z.boolean().optional(),
  garden: z.boolean().optional(),
  aircon: z.boolean().optional(),
  furnished: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const changeStatusSchema = z.object({
  status: z.enum(propertyStatuses),
});

export const propertyIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const propertyListQuerySchema = z.object({
  status: z.enum(propertyStatuses).optional(),
  propertyType: z.enum(propertyTypes).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  city: z.string().optional(),
  minArea: z.coerce.number().positive().optional(),
  maxArea: z.coerce.number().positive().optional(),
  minRooms: z.coerce.number().positive().optional(),
  maxRooms: z.coerce.number().positive().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const agencyIdParamSchema = z.object({
  id: z.string().uuid(),
});
