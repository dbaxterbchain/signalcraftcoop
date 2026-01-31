export type AuthUser = {
  sub: string;
  email?: string;
  username?: string;
  groups?: string[];
  raw: Record<string, unknown>;
};
