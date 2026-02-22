import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { IAuthRepository, UserRecord } from './auth.types';
import { UserDto, AuthResponseDto } from '@immo-share/shared/types/user';
import { RegisterInput, LoginInput } from '@immo-share/shared/validators/auth';
import { UserRole } from '@immo-share/shared/constants/enums';
import {
  AlreadyExistsError,
  InvalidCredentialsError,
  AccountDisabledError,
  UnauthorizedError,
  TokenExpiredError,
  TokenAlreadyUsedError,
  UserNotFoundError,
} from './auth.errors';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1h

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function toUserDto(user: UserRecord): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    agencyId: user.agencyId,
    locale: user.locale,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function generateAccessToken(user: UserRecord): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

export class AuthService {
  constructor(private readonly repo: IAuthRepository) {}

  // ---------------------------------------------------------------
  // REGISTER
  // ---------------------------------------------------------------
  async register(input: RegisterInput): Promise<AuthResponseDto> {
    const email = input.email.trim().toLowerCase();

    const existing = await this.repo.findUserByEmail(email);
    if (existing) {
      throw new AlreadyExistsError();
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await this.repo.createUser({
      email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      role: input.role === 'agency_admin' ? UserRole.AGENCY_ADMIN : UserRole.AGENT,
      locale: input.locale ?? 'he',
    });

    const verifyToken = uuidv4();
    await this.repo.createEmailVerification(
      user.id,
      verifyToken,
      new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS),
    );

    const accessToken = generateAccessToken(user);
    const refreshTokenValue = uuidv4();
    await this.repo.createRefreshToken(
      user.id,
      refreshTokenValue,
      new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    );

    return {
      user: toUserDto(user),
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  // ---------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------
  async login(input: LoginInput): Promise<AuthResponseDto> {
    const email = input.email.trim().toLowerCase();

    const user = await this.repo.findUserByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.isActive) {
      throw new AccountDisabledError();
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new InvalidCredentialsError();
    }

    await this.repo.updateUser(user.id, { lastLoginAt: new Date() });

    await this.repo.revokeAllRefreshTokens(user.id);
    const refreshTokenValue = uuidv4();
    await this.repo.createRefreshToken(
      user.id,
      refreshTokenValue,
      new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    );

    const accessToken = generateAccessToken(user);

    return {
      user: toUserDto(user),
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  // ---------------------------------------------------------------
  // REFRESH
  // ---------------------------------------------------------------
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenRecord = await this.repo.findRefreshToken(refreshToken);
    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (tokenRecord.revokedAt) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new TokenExpiredError();
    }

    const user = await this.repo.findUserById(tokenRecord.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new AccountDisabledError();
    }

    await this.repo.revokeRefreshToken(refreshToken);
    const newRefreshToken = uuidv4();
    await this.repo.createRefreshToken(
      user.id,
      newRefreshToken,
      new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    );

    const accessToken = generateAccessToken(user);

    return { accessToken, refreshToken: newRefreshToken };
  }

  // ---------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------
  async logout(refreshToken: string): Promise<void> {
    await this.repo.revokeRefreshToken(refreshToken);
  }

  // ---------------------------------------------------------------
  // VERIFY EMAIL
  // ---------------------------------------------------------------
  async verifyEmail(token: string): Promise<void> {
    const record = await this.repo.findEmailVerification(token);
    if (!record) {
      throw new UnauthorizedError('Invalid verification token');
    }

    if (record.usedAt) {
      throw new TokenAlreadyUsedError();
    }

    if (record.expiresAt < new Date()) {
      throw new TokenExpiredError();
    }

    const user = await this.repo.findUserById(record.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    await this.repo.updateUser(user.id, { emailVerified: true });
    await this.repo.markEmailVerificationUsed(token);
  }

  // ---------------------------------------------------------------
  // FORGOT PASSWORD
  // ---------------------------------------------------------------
  async forgotPassword(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.repo.findUserByEmail(normalizedEmail);
    if (!user) {
      // Silently return to prevent email enumeration
      return;
    }

    // Invalidate previous tokens
    await this.repo.invalidatePasswordResets(user.id);

    // Create new reset token
    const resetToken = uuidv4();
    await this.repo.createPasswordReset(
      user.id,
      resetToken,
      new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
    );

    // TODO: send email with resetToken (via email service)
  }

  // ---------------------------------------------------------------
  // RESET PASSWORD
  // ---------------------------------------------------------------
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.repo.findPasswordReset(token);
    if (!record) {
      throw new UnauthorizedError('Invalid reset token');
    }

    if (record.usedAt) {
      throw new TokenAlreadyUsedError();
    }

    if (record.expiresAt < new Date()) {
      throw new TokenExpiredError();
    }

    const user = await this.repo.findUserById(record.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.repo.updateUser(user.id, { passwordHash });
    await this.repo.markPasswordResetUsed(token);

    // Revoke all sessions after password reset
    await this.repo.revokeAllRefreshTokens(user.id);
  }

  // ---------------------------------------------------------------
  // CHANGE PASSWORD
  // ---------------------------------------------------------------
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new InvalidCredentialsError();
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.repo.updateUser(userId, { passwordHash });

    // Revoke all sessions after password change
    await this.repo.revokeAllRefreshTokens(userId);
  }
}
