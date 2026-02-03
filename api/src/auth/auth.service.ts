import { Injectable } from '@nestjs/common';
import { AuthUser } from './types/auth-user';

@Injectable()
export class AuthService {
  getCurrentUser(user?: AuthUser) {
    if (!user) {
      return null;
    }
    return {
      id: user.sub,
      email: user.email ?? null,
      username: user.username ?? null,
      groups: user.groups ?? [],
    };
  }

  async exchangeCode(payload: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<{ accessToken: string; idToken?: string; expiresIn?: number }> {
    const debug = process.env.AUTH_DEBUG === 'true';
    const domain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;
    if (!domain || !clientId) {
      throw new Error('Missing Cognito domain or client ID');
    }

    if (debug) {
      console.info('[auth] token exchange request', {
        domain,
        clientId,
        redirectUri: payload.redirectUri,
        codeLength: payload.code.length,
        verifierLength: payload.codeVerifier.length,
      });
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: payload.code,
      code_verifier: payload.codeVerifier,
      redirect_uri: payload.redirectUri,
    });
    if (clientSecret) {
      params.set('client_secret', clientSecret);
    }

    const response = await fetch(`${domain}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      if (debug) {
        console.warn('[auth] token exchange failed', {
          status: response.status,
          body: text,
        });
      }
      throw new Error(text || 'Token exchange failed');
    }

    const data = (await response.json()) as {
      access_token: string;
      id_token?: string;
      expires_in?: number;
    };

    return {
      accessToken: data.access_token,
      idToken: data.id_token,
      expiresIn: data.expires_in,
    };
  }

  getLogoutUrl() {
    const domain = process.env.COGNITO_DOMAIN;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const logoutUri = process.env.COGNITO_LOGOUT_URI;
    if (!domain || !clientId || !logoutUri) {
      return null;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      logout_uri: logoutUri,
    });
    return `${domain}/logout?${params.toString()}`;
  }

  getIdentityPoolConfig() {
    return {
      identityPoolId: process.env.COGNITO_IDENTITY_POOL_ID ?? null,
      region:
        process.env.COGNITO_IDENTITY_POOL_REGION ??
        process.env.COGNITO_REGION ??
        process.env.AWS_REGION ??
        null,
    };
  }
}
