/**
 * Tests for Auth Store (stores/auth.store.ts)
 * Test plan: M1-01 through M1-13
 */
import { api, ApiError } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/auth.store';

// Mock the api module
jest.mock('../../src/services/api', () => {
  const actual = jest.requireActual('../../src/services/api');
  return {
    ...actual,
    api: {
      init: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      setTokens: jest.fn(),
      clearTokens: jest.fn(),
      getAccessToken: jest.fn(),
    },
  };
});

const mockApi = api as jest.Mocked<typeof api>;

// Reset zustand store between tests
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });
});

const fakeUser = {
  id: 'u1',
  email: 'test@test.com',
  name: 'Test User',
  phone: null,
  avatarUrl: null,
  role: 'agent' as const,
  agencyId: null,
  locale: 'en' as const,
  emailVerified: false,
  isActive: true,
  lastLoginAt: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('Auth Store', () => {
  // M1-01
  it('M1-01: initial state is user=null, isLoading=true, isAuthenticated=false', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
  });

  // M1-02
  it('M1-02: init() with valid token fetches user and sets authenticated', async () => {
    mockApi.init.mockResolvedValue(undefined);
    mockApi.getAccessToken.mockReturnValue('valid-token');
    mockApi.get.mockResolvedValue({ user: fakeUser });

    await useAuthStore.getState().init();

    const state = useAuthStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  // M1-03
  it('M1-03: init() with no token sets isLoading=false', async () => {
    mockApi.init.mockResolvedValue(undefined);
    mockApi.getAccessToken.mockReturnValue(null);

    await useAuthStore.getState().init();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  // M1-04
  it('M1-04: init() with expired token clears tokens', async () => {
    mockApi.init.mockResolvedValue(undefined);
    mockApi.getAccessToken.mockReturnValue('expired');
    mockApi.get.mockRejectedValue(new ApiError(401, 'UNAUTHORIZED', 'Expired'));

    await useAuthStore.getState().init();

    expect(mockApi.clearTokens).toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  // M1-05
  it('M1-05: login() success stores tokens + user', async () => {
    mockApi.post.mockResolvedValue({
      user: fakeUser,
      accessToken: 'at',
      refreshToken: 'rt',
    });

    await useAuthStore.getState().login('test@test.com', 'pass');

    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      { email: 'test@test.com', password: 'pass' },
      { skipAuth: true },
    );
    expect(mockApi.setTokens).toHaveBeenCalledWith('at', 'rt');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  // M1-06
  it('M1-06: login() failure sets error message', async () => {
    mockApi.post.mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'Bad credentials'));

    await useAuthStore.getState().login('bad@test.com', 'wrong');

    const state = useAuthStore.getState();
    expect(state.error).toBe('Bad credentials');
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  // M1-07
  it('M1-07: register() success stores tokens + user', async () => {
    mockApi.post.mockResolvedValue({
      user: fakeUser,
      accessToken: 'at',
      refreshToken: 'rt',
    });

    await useAuthStore.getState().register({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      password: 'Password1!',
    });

    expect(mockApi.setTokens).toHaveBeenCalledWith('at', 'rt');
    const state = useAuthStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(state.isAuthenticated).toBe(true);
  });

  // M1-08
  it('M1-08: register() combines firstName+lastName into name', async () => {
    mockApi.post.mockResolvedValue({
      user: fakeUser,
      accessToken: 'at',
      refreshToken: 'rt',
    });

    await useAuthStore.getState().register({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'Password1!',
    });

    const payload = mockApi.post.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.name).toBe('John Doe');
    expect(payload).not.toHaveProperty('firstName');
    expect(payload).not.toHaveProperty('lastName');
  });

  // M1-09
  it('M1-09: register() sends role=agent by default', async () => {
    mockApi.post.mockResolvedValue({
      user: fakeUser,
      accessToken: 'at',
      refreshToken: 'rt',
    });

    await useAuthStore.getState().register({
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      password: '12345678',
    });

    const payload = mockApi.post.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.role).toBe('agent');
    expect(payload.locale).toBe('en');
  });

  // M1-10
  it('M1-10: register() failure sets error', async () => {
    mockApi.post.mockRejectedValue(new ApiError(400, 'VALIDATION_ERROR', 'Email taken'));

    await useAuthStore.getState().register({
      firstName: 'A',
      lastName: 'B',
      email: 'taken@test.com',
      password: '12345678',
    });

    const state = useAuthStore.getState();
    expect(state.error).toBe('Email taken');
    expect(state.isAuthenticated).toBe(false);
  });

  // M1-11
  it('M1-11: logout() clears tokens + user', async () => {
    // Start as logged in
    useAuthStore.setState({ user: fakeUser, isAuthenticated: true });
    mockApi.post.mockResolvedValue(undefined);

    await useAuthStore.getState().logout();

    expect(mockApi.clearTokens).toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  // M1-12
  it('M1-12: logout() ignores API errors', async () => {
    useAuthStore.setState({ user: fakeUser, isAuthenticated: true });
    mockApi.post.mockRejectedValue(new Error('Network error'));

    await useAuthStore.getState().logout();

    expect(mockApi.clearTokens).toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  // M1-13
  it('M1-13: clearError() resets error to null', () => {
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
