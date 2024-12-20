import type { User } from "~/types/pre-built/2-user";

export type Token = {
  token: string;
  expiresAt: number;
};

export type AuthTokens = {
  accessToken: Token;
  refreshToken: Token;
  user: User;
};
