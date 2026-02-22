export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AlreadyExistsError extends AppError {
  constructor(resource: string = 'User') {
    super('ALREADY_EXISTS', `${resource} already exists`, 409);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }
}

export class AccountDisabledError extends AppError {
  constructor() {
    super('ACCOUNT_DISABLED', 'Account is disabled', 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class RateLimitedError extends AppError {
  constructor() {
    super('RATE_LIMITED', 'Too many attempts, please try again later', 429);
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('TOKEN_EXPIRED', 'Token has expired', 410);
  }
}

export class TokenAlreadyUsedError extends AppError {
  constructor() {
    super('TOKEN_ALREADY_USED', 'Token has already been used', 410);
  }
}

export class UserNotFoundError extends AppError {
  constructor() {
    super('USER_NOT_FOUND', 'User not found', 404);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, unknown>) {
    super('VALIDATION_ERROR', 'Invalid request', 400, details);
  }
}
