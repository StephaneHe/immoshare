import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/modules/auth/auth.service';
import {
  IAuthRepository,
  UserRecord,
  RefreshTokenRecord,
  EmailVerificationRecord,
  PasswordResetRecord,
  CreateUserData,
} from '../../../src/modules/auth/auth.types';
import {
  AlreadyExistsError,
  InvalidCredentialsError,
  AccountDisabledError,
  UnauthorizedError,
  TokenExpiredError,
  TokenAlreadyUsedError,
  UserNotFoundError,
} from '../../../src/modules/auth/auth.errors';
import { UserRole } from '@immo-share/shared/constants/enums';

// --- Mock repository factory ---
function createMockRepo(overrides: Partial<IAuthRepository> = {}): IAuthRepository {
  return {
    findUserByEmail: jest.fn().mockResolvedValue(null),
    findUserById: jest.fn().mockResolvedValue(null),
    createUser: jest.fn().mockImplementation(async (data: CreateUserData): Promise<UserRecord> => ({
      id: 'uuid-test-1',
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      phone: data.phone || null,
      avatarUrl: null,
      role: data.role,
      agencyId: null,
      locale: data.locale,
      emailVerified: false,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })),
    updateUser: jest.fn().mockImplementation(async (_id: string, data: Partial<UserRecord>) => data),
    createRefreshToken: jest.fn().mockResolvedValue({
      id: 'rt-1',
      userId: 'uuid-test-1',
      token: 'refresh-token-uuid',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      createdAt: new Date(),
      revokedAt: null,
    }),
    findRefreshToken: jest.fn().mockResolvedValue(null),
    revokeRefreshToken: jest.fn(),
    revokeAllRefreshTokens: jest.fn(),
    createEmailVerification: jest.fn().mockResolvedValue({
      id: 'ev-1',
      userId: 'uuid-test-1',
      token: 'verify-token-uuid',
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      usedAt: null,
      createdAt: new Date(),
    }),
    findEmailVerification: jest.fn().mockResolvedValue(null),
    markEmailVerificationUsed: jest.fn(),
    createPasswordReset: jest.fn(),
    findPasswordReset: jest.fn().mockResolvedValue(null),
    markPasswordResetUsed: jest.fn(),
    invalidatePasswordResets: jest.fn(),
    ...overrides,
  };
}

// --- Helpers ---
const PASSWORD = 'Str0ngPass';
let PASSWORD_HASH: string;

beforeAll(async () => {
  PASSWORD_HASH = await bcrypt.hash(PASSWORD, 10);
});

function makeUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: 'uuid-test-1',
    email: 'test@example.com',
    passwordHash: PASSWORD_HASH,
    name: 'Test User',
    phone: null,
    avatarUrl: null,
    role: UserRole.AGENT,
    agencyId: null,
    locale: 'he',
    emailVerified: true,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function makeRefreshTokenRecord(overrides: Partial<RefreshTokenRecord> = {}): RefreshTokenRecord {
  return {
    id: 'rt-1',
    userId: 'uuid-test-1',
    token: 'valid-refresh-token',
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    createdAt: new Date(),
    revokedAt: null,
    ...overrides,
  };
}

function makeEmailVerificationRecord(overrides: Partial<EmailVerificationRecord> = {}): EmailVerificationRecord {
  return {
    id: 'ev-1',
    userId: 'uuid-test-1',
    token: 'valid-verify-token',
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makePasswordResetRecord(overrides: Partial<PasswordResetRecord> = {}): PasswordResetRecord {
  return {
    id: 'pr-1',
    userId: 'uuid-test-1',
    token: 'valid-reset-token',
    expiresAt: new Date(Date.now() + 3600 * 1000), // 1h from now
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

const validRegisterInput = {
  email: 'Test@Example.COM',
  password: PASSWORD,
  name: 'Test User',
  role: 'agent' as const,
  locale: 'he' as const,
};

// =====================================================================
// REGISTER
// =====================================================================

describe('AuthService.register', () => {
  it('should create user with hashed password (password must not appear in DB)', async () => {
    const mockRepo = createMockRepo();
    const service = new AuthService(mockRepo);

    const result = await service.register(validRegisterInput);

    expect(mockRepo.createUser).toHaveBeenCalledTimes(1);
    const createCall = (mockRepo.createUser as jest.Mock).mock.calls[0][0] as CreateUserData;
    expect(createCall.passwordHash).not.toBe(validRegisterInput.password);
    expect(createCall.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('should normalize email to lowercase and trim', async () => {
    const mockRepo = createMockRepo();
    const service = new AuthService(mockRepo);

    await service.register({ ...validRegisterInput, email: '  Test@Example.COM  ' });

    const createCall = (mockRepo.createUser as jest.Mock).mock.calls[0][0] as CreateUserData;
    expect(createCall.email).toBe('test@example.com');
  });

  it('should throw ALREADY_EXISTS when email is taken', async () => {
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue({ id: 'existing-user' }),
    });
    const service = new AuthService(mockRepo);

    await expect(service.register(validRegisterInput)).rejects.toThrow(AlreadyExistsError);
  });

  it('should only allow role agent or agency_admin', async () => {
    const mockRepo = createMockRepo();
    const service = new AuthService(mockRepo);

    await expect(service.register({ ...validRegisterInput, role: 'agent' })).resolves.toBeDefined();
    await expect(service.register({ ...validRegisterInput, role: 'agency_admin' })).resolves.toBeDefined();
  });

  it('should set emailVerified to false', async () => {
    const mockRepo = createMockRepo();
    const service = new AuthService(mockRepo);

    const result = await service.register(validRegisterInput);

    expect(result.user.emailVerified).toBe(false);
  });

  it('should generate email verification token', async () => {
    const mockRepo = createMockRepo();
    const service = new AuthService(mockRepo);

    await service.register(validRegisterInput);

    expect(mockRepo.createEmailVerification).toHaveBeenCalledTimes(1);
  });

  it('should return UserDto without passwordHash', async () => {
    const mockRepo = createMockRepo();
    const service = new AuthService(mockRepo);

    const result = await service.register(validRegisterInput);

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.name).toBe('Test User');
    expect((result.user as any).passwordHash).toBeUndefined();
  });

  it('should return access and refresh tokens', async () => {
    const mockRepo = createMockRepo();
    const service = new AuthService(mockRepo);

    const result = await service.register(validRegisterInput);

    expect(result.accessToken).toBeDefined();
    expect(typeof result.accessToken).toBe('string');
    expect(result.refreshToken).toBeDefined();
    expect(typeof result.refreshToken).toBe('string');
  });
});

// =====================================================================
// LOGIN
// =====================================================================

describe('AuthService.login', () => {
  it('should return access and refresh tokens on valid credentials', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    const result = await service.login({ email: 'test@example.com', password: PASSWORD });

    expect(result.accessToken).toBeDefined();
    expect(typeof result.accessToken).toBe('string');
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
  });

  it('should throw INVALID_CREDENTIALS on wrong password', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await expect(
      service.login({ email: 'test@example.com', password: 'Wr0ngPass' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw INVALID_CREDENTIALS on non-existent email', async () => {
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(null),
    });
    const service = new AuthService(mockRepo);

    await expect(
      service.login({ email: 'nobody@example.com', password: PASSWORD }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw ACCOUNT_DISABLED when isActive is false', async () => {
    const user = makeUserRecord({ isActive: false });
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await expect(
      service.login({ email: 'test@example.com', password: PASSWORD }),
    ).rejects.toThrow(AccountDisabledError);
  });

  it('should update lastLoginAt on success', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.login({ email: 'test@example.com', password: PASSWORD });

    expect(mockRepo.updateUser).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ lastLoginAt: expect.any(Date) }),
    );
  });

  it('should normalize email to lowercase before lookup', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.login({ email: '  Test@Example.COM  ', password: PASSWORD });

    expect(mockRepo.findUserByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should create a new refresh token on login', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.login({ email: 'test@example.com', password: PASSWORD });

    expect(mockRepo.createRefreshToken).toHaveBeenCalledTimes(1);
    expect(mockRepo.createRefreshToken).toHaveBeenCalledWith(
      user.id,
      expect.any(String),
      expect.any(Date),
    );
  });

  it('should revoke existing refresh tokens before creating new one', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.login({ email: 'test@example.com', password: PASSWORD });

    const revokeOrder = (mockRepo.revokeAllRefreshTokens as jest.Mock).mock.invocationCallOrder[0];
    const createOrder = (mockRepo.createRefreshToken as jest.Mock).mock.invocationCallOrder[0];
    expect(revokeOrder).toBeLessThan(createOrder);
  });

  it('should return UserDto without passwordHash', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    const result = await service.login({ email: 'test@example.com', password: PASSWORD });

    expect((result.user as any).passwordHash).toBeUndefined();
    expect(result.user.id).toBe(user.id);
  });
});

// =====================================================================
// REFRESH
// =====================================================================

describe('AuthService.refresh', () => {
  it('should return new access and refresh tokens for a valid refresh token', async () => {
    const user = makeUserRecord();
    const rt = makeRefreshTokenRecord();
    const mockRepo = createMockRepo({
      findRefreshToken: jest.fn().mockResolvedValue(rt),
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    const result = await service.refresh('valid-refresh-token');

    expect(result.accessToken).toBeDefined();
    expect(typeof result.accessToken).toBe('string');
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe('valid-refresh-token');
  });

  it('should throw UNAUTHORIZED when token is not found', async () => {
    const mockRepo = createMockRepo({
      findRefreshToken: jest.fn().mockResolvedValue(null),
    });
    const service = new AuthService(mockRepo);

    await expect(service.refresh('nonexistent-token')).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UNAUTHORIZED when token is revoked', async () => {
    const rt = makeRefreshTokenRecord({ revokedAt: new Date() });
    const mockRepo = createMockRepo({
      findRefreshToken: jest.fn().mockResolvedValue(rt),
    });
    const service = new AuthService(mockRepo);

    await expect(service.refresh('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
  });

  it('should throw TOKEN_EXPIRED when token has expired', async () => {
    const rt = makeRefreshTokenRecord({ expiresAt: new Date(Date.now() - 1000) });
    const mockRepo = createMockRepo({
      findRefreshToken: jest.fn().mockResolvedValue(rt),
    });
    const service = new AuthService(mockRepo);

    await expect(service.refresh('valid-refresh-token')).rejects.toThrow(TokenExpiredError);
  });

  it('should revoke the old refresh token', async () => {
    const user = makeUserRecord();
    const rt = makeRefreshTokenRecord();
    const mockRepo = createMockRepo({
      findRefreshToken: jest.fn().mockResolvedValue(rt),
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.refresh('valid-refresh-token');

    expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
  });

  it('should create a new refresh token in DB', async () => {
    const user = makeUserRecord();
    const rt = makeRefreshTokenRecord();
    const mockRepo = createMockRepo({
      findRefreshToken: jest.fn().mockResolvedValue(rt),
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.refresh('valid-refresh-token');

    expect(mockRepo.createRefreshToken).toHaveBeenCalledTimes(1);
    expect(mockRepo.createRefreshToken).toHaveBeenCalledWith(
      user.id,
      expect.any(String),
      expect.any(Date),
    );
  });

  it('should throw UNAUTHORIZED when user is not found (deleted account)', async () => {
    const rt = makeRefreshTokenRecord();
    const mockRepo = createMockRepo({
      findRefreshToken: jest.fn().mockResolvedValue(rt),
      findUserById: jest.fn().mockResolvedValue(null),
    });
    const service = new AuthService(mockRepo);

    await expect(service.refresh('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
  });

  it('should throw ACCOUNT_DISABLED when user.isActive is false', async () => {
    const user = makeUserRecord({ isActive: false });
    const rt = makeRefreshTokenRecord();
    const mockRepo = createMockRepo({
      findRefreshToken: jest.fn().mockResolvedValue(rt),
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await expect(service.refresh('valid-refresh-token')).rejects.toThrow(AccountDisabledError);
  });
});

// =====================================================================
// LOGOUT
// =====================================================================

describe('AuthService.logout', () => {
  it('should revoke the provided refresh token', async () => {
    const mockRepo = createMockRepo();
    const service = new AuthService(mockRepo);

    await service.logout('some-refresh-token');

    expect(mockRepo.revokeRefreshToken).toHaveBeenCalledTimes(1);
    expect(mockRepo.revokeRefreshToken).toHaveBeenCalledWith('some-refresh-token');
  });

  it('should not throw even if the token does not exist', async () => {
    const mockRepo = createMockRepo();
    const service = new AuthService(mockRepo);

    await expect(service.logout('nonexistent-token')).resolves.toBeUndefined();
  });

  it('should not throw even if the token is already revoked', async () => {
    const mockRepo = createMockRepo({
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
    });
    const service = new AuthService(mockRepo);

    await expect(service.logout('already-revoked-token')).resolves.toBeUndefined();
  });
});

// =====================================================================
// VERIFY EMAIL
// =====================================================================

describe('AuthService.verifyEmail', () => {
  it('should mark email as verified for a valid token', async () => {
    const ev = makeEmailVerificationRecord();
    const user = makeUserRecord({ emailVerified: false });
    const mockRepo = createMockRepo({
      findEmailVerification: jest.fn().mockResolvedValue(ev),
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.verifyEmail('valid-verify-token');

    expect(mockRepo.updateUser).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ emailVerified: true }),
    );
  });

  it('should mark the verification token as used', async () => {
    const ev = makeEmailVerificationRecord();
    const user = makeUserRecord({ emailVerified: false });
    const mockRepo = createMockRepo({
      findEmailVerification: jest.fn().mockResolvedValue(ev),
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.verifyEmail('valid-verify-token');

    expect(mockRepo.markEmailVerificationUsed).toHaveBeenCalledWith('valid-verify-token');
  });

  it('should throw UNAUTHORIZED when token is not found', async () => {
    const mockRepo = createMockRepo({
      findEmailVerification: jest.fn().mockResolvedValue(null),
    });
    const service = new AuthService(mockRepo);

    await expect(service.verifyEmail('bad-token')).rejects.toThrow(UnauthorizedError);
  });

  it('should throw TOKEN_EXPIRED when token has expired', async () => {
    const ev = makeEmailVerificationRecord({ expiresAt: new Date(Date.now() - 1000) });
    const mockRepo = createMockRepo({
      findEmailVerification: jest.fn().mockResolvedValue(ev),
    });
    const service = new AuthService(mockRepo);

    await expect(service.verifyEmail('valid-verify-token')).rejects.toThrow(TokenExpiredError);
  });

  it('should throw TOKEN_ALREADY_USED when token was already used', async () => {
    const ev = makeEmailVerificationRecord({ usedAt: new Date() });
    const mockRepo = createMockRepo({
      findEmailVerification: jest.fn().mockResolvedValue(ev),
    });
    const service = new AuthService(mockRepo);

    await expect(service.verifyEmail('valid-verify-token')).rejects.toThrow(TokenAlreadyUsedError);
  });

  it('should throw USER_NOT_FOUND when user no longer exists', async () => {
    const ev = makeEmailVerificationRecord();
    const mockRepo = createMockRepo({
      findEmailVerification: jest.fn().mockResolvedValue(ev),
      findUserById: jest.fn().mockResolvedValue(null),
    });
    const service = new AuthService(mockRepo);

    await expect(service.verifyEmail('valid-verify-token')).rejects.toThrow(UserNotFoundError);
  });
});

// =====================================================================
// FORGOT PASSWORD
// =====================================================================

describe('AuthService.forgotPassword', () => {
  it('should create a password reset token for existing user', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.forgotPassword('test@example.com');

    expect(mockRepo.createPasswordReset).toHaveBeenCalledTimes(1);
    expect(mockRepo.createPasswordReset).toHaveBeenCalledWith(
      user.id,
      expect.any(String),
      expect.any(Date),
    );
  });

  it('should invalidate previous reset tokens before creating new one', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.forgotPassword('test@example.com');

    const invalidateOrder = (mockRepo.invalidatePasswordResets as jest.Mock).mock.invocationCallOrder[0];
    const createOrder = (mockRepo.createPasswordReset as jest.Mock).mock.invocationCallOrder[0];
    expect(invalidateOrder).toBeLessThan(createOrder);
  });

  it('should NOT throw when email does not exist (prevent enumeration)', async () => {
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(null),
    });
    const service = new AuthService(mockRepo);

    // Must succeed silently to prevent email enumeration
    await expect(service.forgotPassword('nobody@example.com')).resolves.toBeUndefined();
    expect(mockRepo.createPasswordReset).not.toHaveBeenCalled();
  });

  it('should normalize email before lookup', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserByEmail: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.forgotPassword('  Test@Example.COM  ');

    expect(mockRepo.findUserByEmail).toHaveBeenCalledWith('test@example.com');
  });
});

// =====================================================================
// RESET PASSWORD
// =====================================================================

describe('AuthService.resetPassword', () => {
  it('should update user password hash with new bcrypt hash', async () => {
    const pr = makePasswordResetRecord();
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findPasswordReset: jest.fn().mockResolvedValue(pr),
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.resetPassword('valid-reset-token', 'NewStr0ngPass');

    expect(mockRepo.updateUser).toHaveBeenCalledTimes(1);
    const updateCall = (mockRepo.updateUser as jest.Mock).mock.calls[0][1];
    expect(updateCall.passwordHash).toBeDefined();
    expect(updateCall.passwordHash).toMatch(/^\$2[aby]\$/);
    // Must not be the plain text password
    expect(updateCall.passwordHash).not.toBe('NewStr0ngPass');
  });

  it('should mark the reset token as used', async () => {
    const pr = makePasswordResetRecord();
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findPasswordReset: jest.fn().mockResolvedValue(pr),
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.resetPassword('valid-reset-token', 'NewStr0ngPass');

    expect(mockRepo.markPasswordResetUsed).toHaveBeenCalledWith('valid-reset-token');
  });

  it('should revoke all refresh tokens after password reset', async () => {
    const pr = makePasswordResetRecord();
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findPasswordReset: jest.fn().mockResolvedValue(pr),
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.resetPassword('valid-reset-token', 'NewStr0ngPass');

    expect(mockRepo.revokeAllRefreshTokens).toHaveBeenCalledWith(user.id);
  });

  it('should throw UNAUTHORIZED when token is not found', async () => {
    const mockRepo = createMockRepo({
      findPasswordReset: jest.fn().mockResolvedValue(null),
    });
    const service = new AuthService(mockRepo);

    await expect(service.resetPassword('bad-token', 'NewStr0ngPass')).rejects.toThrow(UnauthorizedError);
  });

  it('should throw TOKEN_EXPIRED when token has expired', async () => {
    const pr = makePasswordResetRecord({ expiresAt: new Date(Date.now() - 1000) });
    const mockRepo = createMockRepo({
      findPasswordReset: jest.fn().mockResolvedValue(pr),
    });
    const service = new AuthService(mockRepo);

    await expect(service.resetPassword('valid-reset-token', 'NewStr0ngPass')).rejects.toThrow(TokenExpiredError);
  });

  it('should throw TOKEN_ALREADY_USED when token was already used', async () => {
    const pr = makePasswordResetRecord({ usedAt: new Date() });
    const mockRepo = createMockRepo({
      findPasswordReset: jest.fn().mockResolvedValue(pr),
    });
    const service = new AuthService(mockRepo);

    await expect(service.resetPassword('valid-reset-token', 'NewStr0ngPass')).rejects.toThrow(TokenAlreadyUsedError);
  });

  it('should throw USER_NOT_FOUND when user no longer exists', async () => {
    const pr = makePasswordResetRecord();
    const mockRepo = createMockRepo({
      findPasswordReset: jest.fn().mockResolvedValue(pr),
      findUserById: jest.fn().mockResolvedValue(null),
    });
    const service = new AuthService(mockRepo);

    await expect(service.resetPassword('valid-reset-token', 'NewStr0ngPass')).rejects.toThrow(UserNotFoundError);
  });
});

// =====================================================================
// CHANGE PASSWORD
// =====================================================================

describe('AuthService.changePassword', () => {
  it('should update password hash when current password is correct', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.changePassword(user.id, PASSWORD, 'NewStr0ngPass');

    expect(mockRepo.updateUser).toHaveBeenCalledTimes(1);
    const updateCall = (mockRepo.updateUser as jest.Mock).mock.calls[0][1];
    expect(updateCall.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(updateCall.passwordHash).not.toBe('NewStr0ngPass');
  });

  it('should throw INVALID_CREDENTIALS when current password is wrong', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await expect(
      service.changePassword(user.id, 'Wr0ngCurrent', 'NewStr0ngPass'),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw USER_NOT_FOUND when user does not exist', async () => {
    const mockRepo = createMockRepo({
      findUserById: jest.fn().mockResolvedValue(null),
    });
    const service = new AuthService(mockRepo);

    await expect(
      service.changePassword('nonexistent-id', PASSWORD, 'NewStr0ngPass'),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should revoke all refresh tokens after password change', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.changePassword(user.id, PASSWORD, 'NewStr0ngPass');

    expect(mockRepo.revokeAllRefreshTokens).toHaveBeenCalledWith(user.id);
  });

  it('should hash the new password with bcrypt, not store plain text', async () => {
    const user = makeUserRecord();
    const mockRepo = createMockRepo({
      findUserById: jest.fn().mockResolvedValue(user),
    });
    const service = new AuthService(mockRepo);

    await service.changePassword(user.id, PASSWORD, 'NewStr0ngPass');

    const updateCall = (mockRepo.updateUser as jest.Mock).mock.calls[0][1];
    // Verify the stored hash actually matches the new password
    const matches = await bcrypt.compare('NewStr0ngPass', updateCall.passwordHash);
    expect(matches).toBe(true);
  });
});
