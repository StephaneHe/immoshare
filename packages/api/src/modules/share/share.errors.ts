import { AppError } from '../auth/auth.errors';

// ─── Contact errors ───

export class ContactNotFoundError extends AppError {
  constructor() {
    super('CONTACT_NOT_FOUND', 'Contact not found', 404);
  }
}

export class NotContactOwnerError extends AppError {
  constructor() {
    super('NOT_CONTACT_OWNER', 'Only the contact owner can manage this contact', 403);
  }
}

export class ContactRequiresPhoneOrEmailError extends AppError {
  constructor() {
    super('CONTACT_REQUIRES_PHONE_OR_EMAIL', 'Contact must have at least a phone number or email address', 400);
  }
}

// ─── ShareLink errors ───

export class ShareLinkNotFoundError extends AppError {
  constructor() {
    super('SHARE_LINK_NOT_FOUND', 'Share link not found', 404);
  }
}

export class ShareLinkExpiredError extends AppError {
  constructor() {
    super('SHARE_LINK_EXPIRED', 'This share link has expired', 410);
  }
}

export class ShareLinkDeactivatedError extends AppError {
  constructor() {
    super('SHARE_LINK_DEACTIVATED', 'This share link has been deactivated', 410);
  }
}

export class NotShareLinkOwnerError extends AppError {
  constructor() {
    super('NOT_SHARE_LINK_OWNER', 'Only the link owner can manage this share link', 403);
  }
}

export class PageNotFoundForShareError extends AppError {
  constructor() {
    super('PAGE_NOT_FOUND', 'Page not found', 404);
  }
}

export class NoValidRecipientsError extends AppError {
  constructor() {
    super('NO_VALID_RECIPIENTS', 'No valid recipients for the requested channels', 400);
  }
}
