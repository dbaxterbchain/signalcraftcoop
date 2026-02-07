const AUTH_EVENT = 'signalcraft-auth-changed';
const PKCE_VERIFIER_KEY = 'pkce_verifier';
const ACCESS_TOKEN_KEY = 'auth_access_token';
const ID_TOKEN_KEY = 'auth_id_token';
const EXPIRES_AT_KEY = 'auth_expires_at';

type AuthUser = {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  username?: string;
  groups?: string[];
};

function base64UrlEncode(input: Uint8Array) {
  const base64 = btoa(String.fromCharCode(...input));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeVerifier() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function generateCodeChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function getConfig() {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;
  const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI as string | undefined;
  const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI as string | undefined;
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

  if (!domain || !clientId || !redirectUri) {
    throw new Error('Missing Cognito Hosted UI configuration in .env');
  }

  return { domain, clientId, redirectUri, logoutUri, apiUrl };
}

function emitAuthChanged() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export const AUTH_CHANGED_EVENT = AUTH_EVENT;

function clearStoredTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ID_TOKEN_KEY);
  sessionStorage.removeItem(EXPIRES_AT_KEY);
}

function storeTokens(payload: {
  access_token: string;
  id_token?: string;
  expires_in?: number;
}) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  if (payload.id_token) {
    sessionStorage.setItem(ID_TOKEN_KEY, payload.id_token);
  }
  if (payload.expires_in) {
    const expiresAt = Date.now() + payload.expires_in * 1000;
    sessionStorage.setItem(EXPIRES_AT_KEY, `${expiresAt}`);
  }
}

function isTokenExpired() {
  const expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY);
  if (!expiresAt) {
    return false;
  }
  const value = Number(expiresAt);
  if (!Number.isFinite(value)) {
    return false;
  }
  return Date.now() >= value;
}

export function getAccessToken() {
  if (isTokenExpired()) {
    clearStoredTokens();
    return null;
  }
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getIdToken() {
  if (isTokenExpired()) {
    clearStoredTokens();
    return null;
  }
  return sessionStorage.getItem(ID_TOKEN_KEY);
}

export function getApiToken() {
  return getIdToken() ?? getAccessToken();
}

export async function loginWithHostedUI(returnTo = '/orders') {
  const { domain, clientId, redirectUri } = getConfig();
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  sessionStorage.setItem('auth_return_to', returnTo);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.assign(`${domain}/oauth2/authorize?${params.toString()}`);
}

export async function handleAuthCallback(code: string) {
  const { domain, clientId, redirectUri } = getConfig();
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!verifier) {
    throw new Error('Missing PKCE verifier. Try signing in again.');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
  });

  const response = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    let message = 'Token exchange failed';
    try {
      const payload = (await response.json()) as { error?: string; error_description?: string };
      message = payload.error_description ?? payload.error ?? message;
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  const tokens = (await response.json()) as {
    access_token: string;
    id_token?: string;
    expires_in?: number;
  };

  if (!tokens.access_token) {
    throw new Error('Missing access token from Cognito');
  }
  if (!tokens.id_token) {
    throw new Error(
      'Missing id token from Cognito. Ensure the app client allows the "openid" scope.',
    );
  }

  storeTokens(tokens);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  emitAuthChanged();
}

export function getReturnTo() {
  return sessionStorage.getItem('auth_return_to') ?? '/orders';
}

export function clearReturnTo() {
  sessionStorage.removeItem('auth_return_to');
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const { apiUrl } = getConfig();
  const token = getApiToken();
  if (!token) {
    return null;
  }
  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    if (response.status === 401) {
      clearStoredTokens();
      emitAuthChanged();
    }
    return null;
  }
  return (await response.json()) as AuthUser;
}

export async function logout() {
  const { domain, clientId, logoutUri } = getConfig();
  clearStoredTokens();
  emitAuthChanged();

  if (!logoutUri) {
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: logoutUri,
  });
  window.location.assign(`${domain}/logout?${params.toString()}`);
}
