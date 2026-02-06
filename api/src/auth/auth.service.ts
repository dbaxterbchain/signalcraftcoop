import { Injectable } from '@nestjs/common';
import type { AuthUser } from './types/auth-user';

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
