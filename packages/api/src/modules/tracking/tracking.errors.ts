import { AppError } from '../auth/auth.errors';

export class TrackLinkNotFoundError extends AppError {
  constructor() {
    super('LINK_NOT_FOUND', 'Share link not found', 404);
  }
}

export class TrackLinkExpiredError extends AppError {
  constructor() {
    super('LINK_EXPIRED', 'This share link has expired', 410);
  }
}

export class TrackLinkDeactivatedError extends AppError {
  constructor() {
    super('LINK_DEACTIVATED', 'This share link has been deactivated', 410);
  }
}

export class TrackRateLimitedError extends AppError {
  constructor() {
    super('RATE_LIMITED', 'Too many tracking events, please slow down', 429);
  }
}

export class PropertyNotFoundForAnalyticsError extends AppError {
  constructor() {
    super('PROPERTY_NOT_FOUND', 'Property not found', 404);
  }
}

export class NotPropertyOwnerForAnalyticsError extends AppError {
  constructor() {
    super('NOT_PROPERTY_OWNER', 'Only the property owner can view analytics', 403);
  }
}
