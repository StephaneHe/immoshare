import { AppError } from '../auth/auth.errors';

export class PropertyNotFoundError extends AppError {
  constructor() {
    super('PROPERTY_NOT_FOUND', 'Property not found', 404);
  }
}

export class NotPropertyOwnerError extends AppError {
  constructor() {
    super('NOT_PROPERTY_OWNER', 'Only the property owner can perform this action', 403);
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(
      'INVALID_STATUS_TRANSITION',
      `Cannot transition from "${from}" to "${to}"`,
      400,
      { from, to },
    );
  }
}

export class MediaNotFoundError extends AppError {
  constructor() {
    super('MEDIA_NOT_FOUND', 'Media not found', 404);
  }
}

export class MediaLimitExceededError extends AppError {
  constructor(type: string, max: number) {
    super(
      'MEDIA_LIMIT_EXCEEDED',
      `Maximum ${max} ${type} items per property`,
      400,
      { type, max },
    );
  }
}

export class MediaSizeLimitError extends AppError {
  constructor() {
    super('MEDIA_SIZE_LIMIT', 'Total media size exceeds 500 MB per property', 400);
  }
}

export class InvalidMediaTypeError extends AppError {
  constructor(mimeType: string) {
    super('INVALID_MEDIA_TYPE', `Unsupported media type: ${mimeType}`, 400);
  }
}
