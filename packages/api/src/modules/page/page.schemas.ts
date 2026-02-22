import { z } from 'zod';

const sectionTypes = [
  'info', 'photos', 'plans', 'video', '3d', 'description', 'location', 'features', 'contact',
] as const;

const layouts = ['standard', 'minimal'] as const;

const sectionConfigSchema = z.object({
  id: z.string().min(1),
  type: z.enum(sectionTypes),
  enabled: z.boolean(),
  mediaIds: z.array(z.string().uuid()).optional(),
  fields: z.array(z.string()).optional(),
  customTitle: z.string().max(100).optional(),
});

const selectedElementsSchema = z.object({
  sections: z.array(sectionConfigSchema).min(1),
  order: z.array(z.string().min(1)).min(1),
});

export const createPageSchema = z.object({
  title: z.string().max(200).optional(),
  selectedElements: selectedElementsSchema,
  layout: z.enum(layouts).optional(),
  brandingId: z.string().uuid().optional(),
});

export const updatePageSchema = z.object({
  title: z.string().max(200).optional(),
  selectedElements: selectedElementsSchema.optional(),
  layout: z.enum(layouts).optional(),
  brandingId: z.string().uuid().nullable().optional(),
});

export const propertyIdParamSchema = z.object({
  propertyId: z.string().uuid(),
});

export const pageIdParamSchema = z.object({
  id: z.string().uuid(),
});
