import { PrismaClient, User, RefreshToken, EmailVerification, PasswordReset } from '@prisma/client';
import { UserRole as PrismaUserRole } from '@prisma/client';
import { UserRole } from '@immo-share/shared/constants/enums';
import {
  IAuthRepository,
  UserRecord,
  RefreshTokenRecord,
  EmailVerificationRecord,
  PasswordResetRecord,
  CreateUserData,
} from './auth.types';

// ---------------------------------------------------------------
// Enum mapping: Prisma UserRole <-> Domain UserRole
// ---------------------------------------------------------------

const prismaToRole: Record<PrismaUserRole, UserRole> = {
  SUPER_ADMIN: UserRole.SUPER_ADMIN,
  AGENCY_ADMIN: UserRole.AGENCY_ADMIN,
  AGENT: UserRole.AGENT,
  PARTNER: UserRole.PARTNER,
};

const roleToPrisma: Record<UserRole, PrismaUserRole> = {
  [UserRole.SUPER_ADMIN]: 'SUPER_ADMIN',
  [UserRole.AGENCY_ADMIN]: 'AGENCY_ADMIN',
  [UserRole.AGENT]: 'AGENT',
  [UserRole.PARTNER]: 'PARTNER',
};

// ---------------------------------------------------------------
// Record mappers
// ---------------------------------------------------------------

function toUserRecord(u: User): UserRecord {
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.passwordHash,
    name: u.name,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    role: prismaToRole[u.role],
    agencyId: u.agencyId,
    locale: u.locale,
    emailVerified: u.emailVerified,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    deletedAt: u.deletedAt,
  };
}

function toRefreshTokenRecord(rt: RefreshToken): RefreshTokenRecord {
  return {
    id: rt.id,
    userId: rt.userId,
    token: rt.token,
    expiresAt: rt.expiresAt,
    createdAt: rt.createdAt,
    revokedAt: rt.revokedAt,
  };
}

function toEmailVerificationRecord(ev: EmailVerification): EmailVerificationRecord {
  return {
    id: ev.id,
    userId: ev.userId,
    token: ev.token,
    expiresAt: ev.expiresAt,
    usedAt: ev.usedAt,
    createdAt: ev.createdAt,
  };
}

function toPasswordResetRecord(pr: PasswordReset): PasswordResetRecord {
  return {
    id: pr.id,
    userId: pr.userId,
    token: pr.token,
    expiresAt: pr.expiresAt,
    usedAt: pr.usedAt,
    createdAt: pr.createdAt,
  };
}

// ---------------------------------------------------------------
// Repository implementation
// ---------------------------------------------------------------

export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // --- User ---

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    // Use findFirst because where includes non-unique field deletedAt
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    return user ? toUserRecord(user) : null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    // Use findFirst because where includes non-unique field deletedAt
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user ? toUserRecord(user) : null;
  }

  async createUser(data: CreateUserData): Promise<UserRecord> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        phone: data.phone,
        role: roleToPrisma[data.role],
        locale: data.locale,
      },
    });
    return toUserRecord(user);
  }

  async updateUser(id: string, data: Partial<UserRecord>): Promise<UserRecord> {
    const updateData: Record<string, unknown> = {};

    if (data.email !== undefined) updateData.email = data.email;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.role !== undefined) updateData.role = roleToPrisma[data.role];
    if (data.locale !== undefined) updateData.locale = data.locale;
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.lastLoginAt !== undefined) updateData.lastLoginAt = data.lastLoginAt;
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return toUserRecord(user);
  }

  // --- Refresh Token ---

  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshTokenRecord> {
    const rt = await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
    return toRefreshTokenRecord(rt);
  }

  async findRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
    const rt = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    return rt ? toRefreshTokenRecord(rt) : null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // --- Email Verification ---

  async createEmailVerification(userId: string, token: string, expiresAt: Date): Promise<EmailVerificationRecord> {
    const ev = await this.prisma.emailVerification.create({
      data: { userId, token, expiresAt },
    });
    return toEmailVerificationRecord(ev);
  }

  async findEmailVerification(token: string): Promise<EmailVerificationRecord | null> {
    const ev = await this.prisma.emailVerification.findUnique({
      where: { token },
    });
    return ev ? toEmailVerificationRecord(ev) : null;
  }

  async markEmailVerificationUsed(token: string): Promise<void> {
    await this.prisma.emailVerification.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  // --- Password Reset ---

  async createPasswordReset(userId: string, token: string, expiresAt: Date): Promise<PasswordResetRecord> {
    const pr = await this.prisma.passwordReset.create({
      data: { userId, token, expiresAt },
    });
    return toPasswordResetRecord(pr);
  }

  async findPasswordReset(token: string): Promise<PasswordResetRecord | null> {
    const pr = await this.prisma.passwordReset.findUnique({
      where: { token },
    });
    return pr ? toPasswordResetRecord(pr) : null;
  }

  async markPasswordResetUsed(token: string): Promise<void> {
    await this.prisma.passwordReset.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async invalidatePasswordResets(userId: string): Promise<void> {
    await this.prisma.passwordReset.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
