import { UserRole } from '@immo-share/shared/constants/enums';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  agencyId: string | null;
  locale: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface EmailVerificationRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: UserRole;
  locale: string;
}

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  createUser(data: CreateUserData): Promise<UserRecord>;
  updateUser(id: string, data: Partial<UserRecord>): Promise<UserRecord>;

  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenRecord>;
  findRefreshToken(token: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllRefreshTokens(userId: string): Promise<void>;

  createEmailVerification(userId: string, token: string, expiresAt: Date): Promise<EmailVerificationRecord>;
  findEmailVerification(token: string): Promise<EmailVerificationRecord | null>;
  markEmailVerificationUsed(token: string): Promise<void>;

  createPasswordReset(userId: string, token: string, expiresAt: Date): Promise<PasswordResetRecord>;
  findPasswordReset(token: string): Promise<PasswordResetRecord | null>;
  markPasswordResetUsed(token: string): Promise<void>;
  invalidatePasswordResets(userId: string): Promise<void>;
}
