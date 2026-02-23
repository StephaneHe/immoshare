import { AppError } from '../auth/auth.errors';

export class PartnerInviteNotFoundError extends AppError {
  constructor() { super('INVITE_NOT_FOUND', 'Partner invite not found', 404); }
}

export class PartnerInviteExpiredError extends AppError {
  constructor() { super('INVITE_EXPIRED', 'This partner invite has expired', 410); }
}

export class PartnerLimitExceededError extends AppError {
  constructor() { super('LIMIT_EXCEEDED', 'Maximum of 50 active partners reached', 400); }
}

export class AlreadyPartnerError extends AppError {
  constructor() { super('ALREADY_PARTNER', 'You are already a partner of this agent', 409); }
}

export class SelfInviteError extends AppError {
  constructor() { super('SELF_INVITE', 'You cannot accept your own invite', 400); }
}

export class NotPartnerError extends AppError {
  constructor() { super('NOT_PARTNER', 'You are not a partner of this agent', 403); }
}

export class ReshareAlreadyRequestedError extends AppError {
  constructor() { super('ALREADY_REQUESTED', 'A reshare request for this property already exists', 409); }
}

export class ReshareNotFoundError extends AppError {
  constructor() { super('RESHARE_NOT_FOUND', 'Reshare request not found', 404); }
}

export class NotPropertyOwnerError extends AppError {
  constructor() { super('NOT_OWNER', 'Only the property owner can perform this action', 403); }
}

export class PartnerInviteRevokedError extends AppError {
  constructor() { super('INVITE_REVOKED', 'This partner invite has been revoked', 410); }
}
