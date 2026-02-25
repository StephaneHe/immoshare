import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const TOKEN_KEY = 'immoshare_access_token';
const REFRESH_KEY = 'immoshare_refresh_token';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};

/**
 * Backend API response envelope: { success: true, data: T } | { success: false, error: {...} }
 * This client unwraps the envelope and returns T directly.
 */
class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async init() {
    this.accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
    this.refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  }

  async setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    await SecureStore.setItemAsync(TOKEN_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  }

  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }

  getAccessToken() {
    return this.accessToken;
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, skipAuth = false } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (!skipAuth && this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 — try refresh
    if (response.status === 401 && this.refreshToken && !skipAuth) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.request<T>(path, options);
      }
      await this.clearTokens();
      throw new ApiError(401, 'SESSION_EXPIRED', 'Session expired');
    }

    const json = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        json.error?.code || 'UNKNOWN_ERROR',
        json.error?.message || 'An error occurred',
      );
    }

    // Unwrap backend envelope: { success: true, data: T } → T
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.data as T;
    }

    // Fallback for endpoints that don't use the envelope
    return json as T;
  }

  private async tryRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) return false;

      const json = await response.json();
      // Unwrap envelope for refresh too
      const data = json?.data ?? json;
      await this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Convenience methods
  get<T>(path: string, opts?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(path, { ...opts, method: 'GET' });
  }
  post<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...opts, method: 'POST', body });
  }
  put<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...opts, method: 'PUT', body });
  }
  patch<T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...opts, method: 'PATCH', body });
  }
  delete<T>(path: string, opts?: Omit<RequestOptions, 'method'>) {
    return this.request<T>(path, { ...opts, method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Singleton
export const api = new ApiClient();
