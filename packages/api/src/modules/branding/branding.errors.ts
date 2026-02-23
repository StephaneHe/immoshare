import { AppError } from '../auth/auth.errors';

export class BrandingNotFoundError extends AppError {
  constructor() { super('BRANDING_NOT_FOUND', 'Branding profile not found', 404); }
}

export class NotAgencyAdminError extends AppError {
  constructor() { super('NOT_AGENCY_ADMIN', 'Only agency admins can manage agency branding', 403); }
}

export class InvalidColorError extends AppError {
  constructor(field: string) { super('INVALID_COLOR', `Invalid hex color for ${field}`, 400); }
}

export class InvalidFontError extends AppError {
  constructor() { super('INVALID_FONT', 'Font not in allowed list', 400); }
}

export class FileTooLargeError extends AppError {
  constructor(maxMb: number) { super('FILE_TOO_LARGE', `File exceeds ${maxMb} MB limit`, 413); }
}
