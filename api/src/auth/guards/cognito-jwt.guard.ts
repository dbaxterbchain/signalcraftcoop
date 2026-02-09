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
      headers?: Record<string, string | string[] | undefined>;
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
  const groups = parseGroups(claims['cognito:groups']);
  return {
    sub: typeof claims.sub === 'string' ? claims.sub : 'unknown',
    email: typeof claims.email === 'string' ? claims.email : undefined,
    username:
      typeof claims['cognito:username'] === 'string'
        ? claims['cognito:username']
        : typeof claims.username === 'string'
          ? claims.username
          : undefined,
    groups,
    raw: claims,
  };
}

function parseGroups(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const isBracketed = trimmed.startsWith('[') && trimmed.endsWith(']');
    if (isBracketed) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is string => typeof item === 'string',
          );
        }
      } catch {
        // Fall through to best-effort parsing.
      }
    }
    const raw = isBracketed ? trimmed.slice(1, -1) : trimmed;
    const delimiter = raw.includes(',') ? ',' : ' ';
    return raw
      .split(delimiter)
      .map((entry) => entry.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }
  return undefined;
}
