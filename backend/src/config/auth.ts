import { config } from "dotenv";

config();

export const authCookieName =
  process.env.AUTH_COOKIE_NAME?.trim() || "auth_token";
export const jwtSecret = process.env.JWT_SECRET || "";
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d";
export const cookieMaxAgeMs = Number(process.env.JWT_MAX_AGE_MS) || 24 * 60 * 60 * 1000; // 1 dia
export const isProd = process.env.NODE_ENV === "production";
export const cookieDomain = process.env.COOKIE_DOMAIN?.trim() || undefined;
export const cookieSameSite = (process.env.COOKIE_SAMESITE as
  | "lax"
  | "strict"
  | "none"
  | undefined) || "lax";
export const cookieSecure =
  (process.env.COOKIE_SECURE || "").toLowerCase() === "true" || isProd;
