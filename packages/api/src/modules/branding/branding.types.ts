// ─── Domain types for Branding module ───

export const ALLOWED_FONTS = [
  'Assistant', 'Rubik', 'Heebo', 'Open Sans', 'Montserrat', 'Playfair Display',
] as const;
export type AllowedFont = typeof ALLOWED_FONTS[number];

export const NEUTRAL_DEFAULTS = {
  primaryColor: '#1A1A2E',
  secondaryColor: '#16213E',
  accentColor: '#0F3460',
  textColor: '#FFFFFF',
  fontFamily: 'Assistant' as AllowedFont,
  logoUrl: null as string | null,
  photoUrl: null as string | null,
  displayName: null as string | null,
  tagline: null as string | null,
  contactPhone: null as string | null,
  contactEmail: null as string | null,
  contactWebsite: null as string | null,
  contactWhatsapp: null as string | null,
  socialFacebook: null as string | null,
  socialInstagram: null as string | null,
  socialLinkedin: null as string | null,
  locale: 'he',
  isAgencyDefault: false,
};

export interface BrandingProfileRecord {
  id: string;
  userId: string;
  agencyId: string | null;
  isAgencyDefault: boolean;
  logoUrl: string | null;
  photoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  displayName: string | null;
  tagline: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWebsite: string | null;
  contactWhatsapp: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialLinkedin: string | null;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateBrandingInput {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  fontFamily?: string;
  displayName?: string | null;
  tagline?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactWebsite?: string | null;
  contactWhatsapp?: string | null;
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  socialLinkedin?: string | null;
  locale?: string;
}

// ─── Repository interfaces ───

export interface IBrandingRepository {
  findByUser(userId: string): Promise<BrandingProfileRecord | null>;
  findAgencyDefault(agencyId: string): Promise<BrandingProfileRecord | null>;
  upsert(userId: string, data: UpdateBrandingInput & { agencyId?: string; isAgencyDefault?: boolean }): Promise<BrandingProfileRecord>;
  updateField(userId: string, field: string, value: string | null): Promise<BrandingProfileRecord>;
  delete(id: string): Promise<void>;
}

export interface IBrandingDataProvider {
  getUserAgencyId(userId: string): Promise<string | null>;
}
