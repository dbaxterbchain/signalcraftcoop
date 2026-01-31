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
    const audience = process.env.COGNITO_CLIENT_ID;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer,
      audience,
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
