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
