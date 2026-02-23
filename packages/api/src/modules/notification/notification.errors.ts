import { AppError } from '../auth/auth.errors';

export class NotificationNotFoundError extends AppError {
  constructor() { super('NOTIFICATION_NOT_FOUND', 'Notification not found', 404); }
}

export class NotificationForbiddenError extends AppError {
  constructor() { super('NOTIFICATION_FORBIDDEN', 'Cannot access this notification', 403); }
}

export class PushTokenNotFoundError extends AppError {
  constructor() { super('PUSH_TOKEN_NOT_FOUND', 'Push token not found', 404); }
}

export class InvalidSettingsError extends AppError {
  constructor(msg: string) { super('INVALID_SETTINGS', msg, 400); }
}
