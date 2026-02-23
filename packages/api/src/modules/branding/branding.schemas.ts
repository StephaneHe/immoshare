import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const updateBrandingSchema = z.object({
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  accentColor: hexColor.optional(),
  textColor: hexColor.optional(),
  fontFamily: z.enum([
    'Assistant', 'Rubik', 'Heebo', 'Open Sans', 'Montserrat', 'Playfair Display',
  ]).optional(),
  displayName: z.string().max(100).nullable().optional(),
  tagline: z.string().max(200).nullable().optional(),
  contactPhone: z.string().max(20).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactWebsite: z.string().url().nullable().optional(),
  contactWhatsapp: z.string().max(20).nullable().optional(),
  socialFacebook: z.string().url().nullable().optional(),
  socialInstagram: z.string().url().nullable().optional(),
  socialLinkedin: z.string().url().nullable().optional(),
  locale: z.enum(['he', 'en', 'fr']).optional(),
});

export const uploadUrlSchema = z.object({
  url: z.string().url(),
});

export const agencyIdParam = z.object({
  id: z.string().uuid(),
});
