import { z } from 'zod';

const shareChannels = ['whatsapp', 'email', 'sms'] as const;

// ─── Contact schemas ───

export const createContactSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const contactIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const contactListQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Share schemas ───

const recipientSchema = z.object({
  contactId: z.string().uuid(),
  channels: z.array(z.enum(shareChannels)).min(1),
});

export const shareRequestSchema = z.object({
  recipients: z.array(recipientSchema).min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  message: z.string().max(500).optional(),
});

export const pageIdParamSchema = z.object({
  pageId: z.string().uuid(),
});

export const shareLinkIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const shareLinkListQuerySchema = z.object({
  pageId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  channel: z.enum(shareChannels).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const tokenParamSchema = z.object({
  token: z.string().uuid(),
});

export const propertyIdParamSchema = z.object({
  id: z.string().uuid(),
});
