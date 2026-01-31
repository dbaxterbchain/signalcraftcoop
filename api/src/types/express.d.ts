import type { AuthUser } from '../auth/types/auth-user';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthUser {}

    interface Request {
      user?: User;
    }
  }
}
