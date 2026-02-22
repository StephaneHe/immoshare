import { AppError } from '../auth/auth.errors';

export class AgencyNotFoundError extends AppError {
  constructor() {
    super('AGENCY_NOT_FOUND', 'Agency not found', 404);
  }
}

export class AgencyAlreadyExistsError extends AppError {
  constructor() {
    super('AGENCY_ALREADY_EXISTS', 'User already owns an agency', 409);
  }
}

export class NotAgencyOwnerError extends AppError {
  constructor() {
    super('NOT_AGENCY_OWNER', 'Only the agency admin can perform this action', 403);
  }
}

export class NotAgencyMemberError extends AppError {
  constructor() {
    super('NOT_AGENCY_MEMBER', 'User is not a member of this agency', 403);
  }
}

export class AgentNotInAgencyError extends AppError {
  constructor() {
    super('AGENT_NOT_IN_AGENCY', 'Agent is not a member of this agency', 404);
  }
}

export class CannotRemoveSelfError extends AppError {
  constructor() {
    super('CANNOT_REMOVE_SELF', 'Agency admin cannot remove themselves. Transfer admin role first.', 403);
  }
}

export class AdminCannotLeaveError extends AppError {
  constructor() {
    super('ADMIN_CANNOT_LEAVE', 'Agency admin cannot leave. Transfer admin role first.', 403);
  }
}

export class AlreadyMemberError extends AppError {
  constructor() {
    super('ALREADY_MEMBER', 'User is already a member of this agency', 409);
  }
}

export class AlreadyInAgencyError extends AppError {
  constructor() {
    super('ALREADY_IN_AGENCY', 'User already belongs to an agency. Leave current agency first.', 409);
  }
}

export class AlreadyInvitedError extends AppError {
  constructor() {
    super('ALREADY_INVITED', 'A pending invitation already exists for this email', 409);
  }
}

export class InviteNotFoundError extends AppError {
  constructor() {
    super('INVITE_NOT_FOUND', 'Invitation not found', 404);
  }
}

export class InviteExpiredError extends AppError {
  constructor() {
    super('INVITE_EXPIRED', 'This invitation has expired', 410);
  }
}

export class InviteAlreadyResolvedError extends AppError {
  constructor() {
    super('INVITE_ALREADY_RESOLVED', 'This invitation has already been resolved', 409);
  }
}

export class ForbiddenRoleError extends AppError {
  constructor(requiredRole: string) {
    super('FORBIDDEN_ROLE', `Requires role: ${requiredRole}`, 403);
  }
}
