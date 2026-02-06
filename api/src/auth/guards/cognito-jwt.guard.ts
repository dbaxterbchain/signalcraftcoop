import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../types/auth-user';

@Injectable()
export class CognitoJwtGuard extends AuthGuard('cognito-jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      apiGateway?: {
        event?: {
          requestContext?: {
            authorizer?: {
              jwt?: {
                claims?: Record<string, unknown>;
              };
            };
          };
        };
      };
      user?: AuthUser;
    }>();

    const authorizer = request?.apiGateway?.event?.requestContext
      ?.authorizer as
      | {
          jwt?: { claims?: Record<string, unknown> };
          claims?: Record<string, unknown>;
        }
      | undefined;

    const claims = authorizer?.jwt?.claims ?? authorizer?.claims;

    if (claims && typeof claims === 'object') {
      request.user = buildUserFromClaims(claims);
      return true;
    }

    return super.canActivate(context);
  }
}

function buildUserFromClaims(claims: Record<string, unknown>): AuthUser {
  return {
    sub: typeof claims.sub === 'string' ? claims.sub : 'unknown',
    email: typeof claims.email === 'string' ? claims.email : undefined,
    username:
      typeof claims['cognito:username'] === 'string'
        ? claims['cognito:username']
        : undefined,
    groups: Array.isArray(claims['cognito:groups'])
      ? (claims['cognito:groups'] as string[])
      : undefined,
    raw: claims,
  };
}
