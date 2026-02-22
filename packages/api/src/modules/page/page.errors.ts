import { AppError } from '../auth/auth.errors';

export class PageNotFoundError extends AppError {
  constructor() {
    super('PAGE_NOT_FOUND', 'Page not found', 404);
  }
}

export class NotPageOwnerError extends AppError {
  constructor() {
    super('NOT_PAGE_OWNER', 'Only the property owner can manage this page', 403);
  }
}

export class PropertyNotFoundForPageError extends AppError {
  constructor() {
    super('PROPERTY_NOT_FOUND', 'Property not found', 404);
  }
}

export class InvalidSelectedElementsError extends AppError {
  constructor(message: string) {
    super('INVALID_SELECTED_ELEMENTS', message, 400);
  }
}

export class PageInactiveError extends AppError {
  constructor() {
    super('PAGE_INACTIVE', 'This page is no longer active', 410);
  }
}
