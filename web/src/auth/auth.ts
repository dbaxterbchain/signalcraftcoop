const AUTH_EVENT = 'signalcraft-auth-changed';
const PKCE_VERIFIER_KEY = 'pkce_verifier';

type AuthUser = {
  sub?: string;
  email?: string;
  name?: string;
  username?: string;
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
  const { apiUrl, redirectUri } = getConfig();
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (!verifier) {
    throw new Error('Missing PKCE verifier. Try signing in again.');
  }

  const response = await fetch(`${apiUrl}/auth/exchange`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, codeVerifier: verifier, redirectUri }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Token exchange failed');
  }

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
  const response = await fetch(`${apiUrl}/auth/me`, {
    credentials: 'include',
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as AuthUser;
}

export async function logout() {
  const { apiUrl } = getConfig();
  const response = await fetch(`${apiUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  emitAuthChanged();
  if (!response.ok) {
    return;
  }
  const data = (await response.json()) as { logoutUrl?: string };
  if (data.logoutUrl) {
    window.location.assign(data.logoutUrl);
  }
}
