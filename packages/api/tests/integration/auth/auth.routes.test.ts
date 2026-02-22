import { FastifyInstance } from 'fastify';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { buildTestApp } from '../../helpers/testApp';
import { generateTestToken } from '../../helpers/auth';
import {
  AlreadyExistsError,
  InvalidCredentialsError,
  AccountDisabledError,
  UnauthorizedError,
  TokenExpiredError,
} from '../../../src/modules/auth/auth.errors';
import { UserRole } from '@immo-share/shared/constants/enums';
import { UserDto, AuthResponseDto } from '@immo-share/shared/types/user';

// --- Fake data ---
const fakeUser: UserDto = {
  id: 'uuid-test-1',
  email: 'test@example.com',
  name: 'Test User',
  phone: null,
  avatarUrl: null,
  role: UserRole.AGENT,
  agencyId: null,
  locale: 'he',
  emailVerified: false,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeAuthResponse: AuthResponseDto = {
  user: fakeUser,
  accessToken: 'fake-access-token',
  refreshToken: 'fake-refresh-token',
};

// --- Mock AuthService factory ---
function createMockService(): jest.Mocked<AuthService> {
  return {
    register: jest.fn().mockResolvedValue(fakeAuthResponse),
    login: jest.fn().mockResolvedValue(fakeAuthResponse),
    refresh: jest.fn().mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    logout: jest.fn().mockResolvedValue(undefined),
    verifyEmail: jest.fn().mockResolvedValue(undefined),
    forgotPassword: jest.fn().mockResolvedValue(undefined),
    resetPassword: jest.fn().mockResolvedValue(undefined),
    changePassword: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuthService>;
}

let app: FastifyInstance;
let mockService: jest.Mocked<AuthService>;

beforeEach(async () => {
  mockService = createMockService();
  app = buildTestApp(mockService as unknown as AuthService);
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

// =====================================================================
// POST /api/v1/auth/register
// =====================================================================

describe('POST /api/v1/auth/register', () => {
  const validBody = {
    email: 'test@example.com',
    password: 'Str0ngPass',
    name: 'Test User',
    role: 'agent',
  };

  it('should return 201 with auth response on valid input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: validBody,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('test@example.com');
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
  });

  it('should return 400 on invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...validBody, email: 'not-an-email' },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 on weak password (no uppercase)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { ...validBody, password: 'weakpass1' },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 on missing name', async () => {
    const { name, ...noName } = validBody;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: noName,
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 409 when service throws ALREADY_EXISTS', async () => {
    mockService.register.mockRejectedValue(new AlreadyExistsError());

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: validBody,
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('ALREADY_EXISTS');
  });
});

// =====================================================================
// POST /api/v1/auth/login
// =====================================================================

describe('POST /api/v1/auth/login', () => {
  const validBody = { email: 'test@example.com', password: 'Str0ngPass' };

  it('should return 200 with auth response on valid credentials', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: validBody,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
  });

  it('should return 401 on wrong credentials', async () => {
    mockService.login.mockRejectedValue(new InvalidCredentialsError());

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: validBody,
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should return 403 on disabled account', async () => {
    mockService.login.mockRejectedValue(new AccountDisabledError());

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: validBody,
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error.code).toBe('ACCOUNT_DISABLED');
  });

  it('should return 400 on missing email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { password: 'Str0ngPass' },
    });

    expect(res.statusCode).toBe(400);
  });
});

// =====================================================================
// POST /api/v1/auth/refresh
// =====================================================================

describe('POST /api/v1/auth/refresh', () => {
  it('should return 200 with new tokens', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.refreshToken).toBeDefined();
  });

  it('should return 400 on non-uuid refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: 'not-a-uuid' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 on invalid token', async () => {
    mockService.refresh.mockRejectedValue(new UnauthorizedError('Invalid refresh token'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 410 on expired token', async () => {
    mockService.refresh.mockRejectedValue(new TokenExpiredError());

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(res.statusCode).toBe(410);
    expect(JSON.parse(res.body).error.code).toBe('TOKEN_EXPIRED');
  });
});

// =====================================================================
// POST /api/v1/auth/logout (authenticated)
// =====================================================================

describe('POST /api/v1/auth/logout', () => {
  it('should return 200 when authenticated', async () => {
    const token = generateTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { authorization: `Bearer ${token}` },
      payload: { refreshToken: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });

  it('should return 401 without auth header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: { refreshToken: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 with invalid JWT', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      headers: { authorization: 'Bearer invalid-jwt-token' },
      payload: { refreshToken: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(res.statusCode).toBe(401);
  });
});

// =====================================================================
// POST /api/v1/auth/verify-email
// =====================================================================

describe('POST /api/v1/auth/verify-email', () => {
  it('should return 200 on valid token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email',
      payload: { token: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });

  it('should return 400 on non-uuid token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email',
      payload: { token: 'not-a-uuid' },
    });

    expect(res.statusCode).toBe(400);
  });
});

// =====================================================================
// POST /api/v1/auth/forgot-password
// =====================================================================

describe('POST /api/v1/auth/forgot-password', () => {
  it('should return 200 even for non-existent email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'nobody@example.com' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });

  it('should return 400 on invalid email format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'not-email' },
    });

    expect(res.statusCode).toBe(400);
  });
});

// =====================================================================
// POST /api/v1/auth/reset-password
// =====================================================================

describe('POST /api/v1/auth/reset-password', () => {
  it('should return 200 on valid token and password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: {
        token: '550e8400-e29b-41d4-a716-446655440000',
        password: 'NewStr0ngPass',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });

  it('should return 400 on weak password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: {
        token: '550e8400-e29b-41d4-a716-446655440000',
        password: 'weak',
      },
    });

    expect(res.statusCode).toBe(400);
  });
});

// =====================================================================
// POST /api/v1/auth/change-password (authenticated)
// =====================================================================

describe('POST /api/v1/auth/change-password', () => {
  it('should return 200 when authenticated with valid input', async () => {
    const token = generateTestToken();
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: 'OldStr0ngPass', newPassword: 'NewStr0ngPass' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });

  it('should call service with correct userId from JWT', async () => {
    const token = generateTestToken({ sub: 'user-42' });
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: 'OldStr0ngPass', newPassword: 'NewStr0ngPass' },
    });

    expect(mockService.changePassword).toHaveBeenCalledWith('user-42', 'OldStr0ngPass', 'NewStr0ngPass');
  });

  it('should return 401 without auth header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      payload: { currentPassword: 'OldStr0ngPass', newPassword: 'NewStr0ngPass' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('should return 401 on wrong current password', async () => {
    mockService.changePassword.mockRejectedValue(new InvalidCredentialsError());
    const token = generateTestToken();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/change-password',
      headers: { authorization: `Bearer ${token}` },
      payload: { currentPassword: 'Wr0ngCurrent', newPassword: 'NewStr0ngPass' },
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error.code).toBe('INVALID_CREDENTIALS');
  });
});
