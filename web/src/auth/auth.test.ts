import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchCurrentUser,
  getAccessToken,
  handleAuthCallback,
  loginWithHostedUI,
  logout,
} from './auth';

const setEnv = () => {
  vi.stubEnv('VITE_COGNITO_DOMAIN', 'https://auth.example.com');
  vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'client-123');
  vi.stubEnv('VITE_COGNITO_REDIRECT_URI', 'http://localhost:5173/auth/callback');
  vi.stubEnv('VITE_COGNITO_LOGOUT_URI', 'http://localhost:5173/');
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
};

let originalLocation: Location;

const mockLocation = () => {
  originalLocation = window.location;
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    value: { assign },
    writable: true,
  });
  return assign;
};

describe('auth helpers', () => {
  beforeEach(() => {
    setEnv();
    const cryptoMock = {
      getRandomValues: (arr: Uint8Array) => {
        arr.set(Array.from({ length: arr.length }, (_, i) => i + 1));
        return arr;
      },
      subtle: {
        digest: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer),
      },
    };
    vi.stubGlobal('crypto', cryptoMock);
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    if (originalLocation) {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    }
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('initiates hosted UI login with PKCE', async () => {
    const assign = mockLocation();

    await loginWithHostedUI('/orders');

    expect(sessionStorage.getItem('pkce_verifier')).toBeTruthy();
    expect(sessionStorage.getItem('auth_return_to')).toBe('/orders');
    expect(assign).toHaveBeenCalledWith(
      expect.stringContaining('https://auth.example.com/oauth2/authorize?'),
    );
    expect(assign.mock.calls[0][0]).toContain('code_challenge_method=S256');
  });

  it('exchanges the auth code for tokens', async () => {
    const assign = mockLocation();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          access_token: 'access-token',
          id_token: 'id-token',
          expires_in: 3600,
        }),
      }),
    );
    sessionStorage.setItem('pkce_verifier', 'verifier');

    await handleAuthCallback('code-123');

    expect(assign).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('auth_access_token')).toBe('access-token');
    expect(sessionStorage.getItem('auth_id_token')).toBe('id-token');
    expect(sessionStorage.getItem('pkce_verifier')).toBeNull();
  });

  it('throws if the PKCE verifier is missing', async () => {
    await expect(handleAuthCallback('code-123')).rejects.toThrow(
      'Missing PKCE verifier',
    );
  });

  it('returns null when token is expired', () => {
    sessionStorage.setItem('auth_access_token', 'token');
    sessionStorage.setItem('auth_expires_at', `${Date.now() - 1000}`);

    expect(getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('auth_access_token')).toBeNull();
  });

  it('fetches the current user when token exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'user_1' }),
      }),
    );
    sessionStorage.setItem('auth_access_token', 'token');

    const result = await fetchCurrentUser();

    expect(result).toEqual({ id: 'user_1' });
  });

  it('logs out and clears tokens', async () => {
    const assign = mockLocation();
    sessionStorage.setItem('auth_access_token', 'token');

    await logout();

    expect(sessionStorage.getItem('auth_access_token')).toBeNull();
    expect(assign).toHaveBeenCalledWith(
      expect.stringContaining('https://auth.example.com/logout?'),
    );
  });
});
