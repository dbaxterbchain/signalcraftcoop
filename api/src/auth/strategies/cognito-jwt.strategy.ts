import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthUser } from '../types/auth-user';

function getCognitoIssuer(): string {
  const region = process.env.COGNITO_REGION ?? process.env.AWS_REGION;
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  if (!region || !userPoolId) {
    throw new UnauthorizedException('Cognito configuration missing');
  }
  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
}

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(
  Strategy,
  'cognito-jwt',
) {
  constructor() {
    const issuer = getCognitoIssuer();
    const cookieExtractor = (req: { cookies?: Record<string, string> }) =>
      req?.cookies?.access_token ?? req?.cookies?.id_token ?? null;

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}/.well-known/jwks.json`,
      }),
    });
  }

  validate(payload: Record<string, unknown>): AuthUser {
    const tokenUse =
      typeof payload.token_use === 'string' ? payload.token_use : undefined;
    const configuredClientId = process.env.COGNITO_CLIENT_ID;
    const tokenClientId =
      typeof payload.client_id === 'string'
        ? payload.client_id
        : typeof payload.aud === 'string'
          ? payload.aud
          : undefined;

    if (tokenUse !== 'access' && tokenUse !== 'id') {
      throw new UnauthorizedException('Invalid token use');
    }
    if (
      configuredClientId &&
      tokenClientId &&
      tokenClientId !== configuredClientId
    ) {
      throw new UnauthorizedException('Invalid token audience');
    }

    return {
      sub: typeof payload.sub === 'string' ? payload.sub : 'unknown',
      email: typeof payload.email === 'string' ? payload.email : undefined,
      username:
        typeof payload['cognito:username'] === 'string'
          ? payload['cognito:username']
          : undefined,
      groups: Array.isArray(payload['cognito:groups'])
        ? (payload['cognito:groups'] as string[])
        : undefined,
      raw: payload,
    };
  }
}
