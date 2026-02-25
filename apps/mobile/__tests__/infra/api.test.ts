/**
 * Tests for ApiClient (services/api.ts)
 * Test plan: I-01 through I-10
 *
 * NOTE: expo-secure-store must be mocked BEFORE api module loads.
 * jest.mock is hoisted, so this works even though the import comes after.
 */

// Mock expo-secure-store directly in this file to ensure correct pnpm resolution
const mockStore: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => { mockStore[key] = value; }),
  deleteItemAsync: jest.fn(async (key: string) => { delete mockStore[key]; }),
}));

import * as SecureStore from 'expo-secure-store';
import { api, ApiError } from '../../src/services/api';

// Helper to create a fetch mock response
function mockFetchResponse(status: number, body: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(async () => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockReset();
  // Clear internal store state
  Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  // Reset singleton state
  await api.clearTokens();
});

describe('ApiClient', () => {
  // I-01: init() loads tokens from SecureStore
  it('I-01: init() loads tokens from SecureStore', async () => {
    mockStore['immoshare_access_token'] = 'saved-access';
    mockStore['immoshare_refresh_token'] = 'saved-refresh';

    await api.init();

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('immoshare_access_token');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('immoshare_refresh_token');
  });

  // I-02: setTokens persists to SecureStore
  it('I-02: setTokens() persists to SecureStore', async () => {
    await api.setTokens('new-access', 'new-refresh');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('immoshare_access_token', 'new-access');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('immoshare_refresh_token', 'new-refresh');
  });

  // I-03: clearTokens removes from SecureStore
  it('I-03: clearTokens() removes from SecureStore', async () => {
    jest.clearAllMocks();
    await api.clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('immoshare_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('immoshare_refresh_token');
  });

  // I-04: Successful request unwraps { success, data } envelope
  it('I-04: unwraps backend envelope { success, data }', async () => {
    await api.setTokens('test-token', 'test-refresh');

    (global.fetch as jest.Mock).mockReturnValueOnce(
      mockFetchResponse(200, {
        success: true,
        data: { user: { id: '1', name: 'Test' } },
      })
    );

    const result = await api.get<{ user: { id: string; name: string } }>('/api/v1/auth/me');
    expect(result).toEqual({ user: { id: '1', name: 'Test' } });
  });

  // I-05: Failed request throws ApiError
  it('I-05: throws ApiError on non-OK response', async () => {
    await api.setTokens('test-token', 'test-refresh');

    (global.fetch as jest.Mock).mockReturnValueOnce(
      mockFetchResponse(400, {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' },
      })
    );

    try {
      await api.get('/api/v1/test');
      fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(400);
      expect((e as ApiError).code).toBe('VALIDATION_ERROR');
    }
  });

  // I-06: 401 triggers token refresh then retries
  it('I-06: 401 triggers refresh then retries original request', async () => {
    await api.setTokens('expired-token', 'valid-refresh');

    (global.fetch as jest.Mock)
      .mockReturnValueOnce(mockFetchResponse(401, {}))
      .mockReturnValueOnce(
        mockFetchResponse(200, {
          data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
        })
      )
      .mockReturnValueOnce(
        mockFetchResponse(200, { success: true, data: { ok: true } })
      );

    const result = await api.get<{ ok: boolean }>('/api/v1/test');
    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  // I-07: Failed refresh clears tokens and throws SESSION_EXPIRED
  it('I-07: failed refresh clears tokens and throws SESSION_EXPIRED', async () => {
    await api.setTokens('expired-token', 'invalid-refresh');

    (global.fetch as jest.Mock)
      .mockReturnValueOnce(mockFetchResponse(401, {}))
      .mockReturnValueOnce(mockFetchResponse(401, {}));

    await expect(api.get('/api/v1/test')).rejects.toThrow('Session expired');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  // I-08: Authorization header attached when token present
  it('I-08: attaches Authorization header when token present', async () => {
    await api.setTokens('my-token', 'my-refresh');

    (global.fetch as jest.Mock).mockReturnValueOnce(
      mockFetchResponse(200, { success: true, data: {} })
    );

    await api.get('/api/v1/test');

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].headers['Authorization']).toBe('Bearer my-token');
  });

  // I-09: skipAuth option skips Authorization header
  it('I-09: skipAuth skips Authorization header', async () => {
    await api.setTokens('my-token', 'my-refresh');

    (global.fetch as jest.Mock).mockReturnValueOnce(
      mockFetchResponse(200, { success: true, data: {} })
    );

    await api.get('/api/v1/public', { skipAuth: true });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].headers['Authorization']).toBeUndefined();
  });

  // I-10: Convenience methods call request with correct HTTP method
  it('I-10: convenience methods use correct HTTP methods', async () => {
    await api.setTokens('t', 'r');

    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const calls = [
      () => api.get('/test'),
      () => api.post('/test', { a: 1 }),
      () => api.put('/test', { b: 2 }),
      () => api.patch('/test', { c: 3 }),
      () => api.delete('/test'),
    ];

    for (let i = 0; i < calls.length; i++) {
      (global.fetch as jest.Mock).mockReturnValueOnce(
        mockFetchResponse(200, { success: true, data: {} })
      );
      await calls[i]();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[i];
      expect(fetchCall[1].method).toBe(methods[i]);
    }
  });
});
