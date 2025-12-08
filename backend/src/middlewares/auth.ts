import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import {
  authCookieName,
  cookieSecure,
  cookieSameSite,
  jwtSecret,
} from "../config/auth";
import { UserRole } from "../entities/User";

interface TokenPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: UserRole;
    email: string;
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const bearer = req.headers.authorization;
  const tokenFromHeader = bearer?.startsWith("Bearer ")
    ? bearer.substring(7)
    : null;
  const token = req.cookies?.[authCookieName] || tokenFromHeader;

  if (!token) {
    throw new AppError("Nao autenticado.", 401);
  }

  if (!jwtSecret) {
    throw new AppError("JWT_SECRET nao configurado.", 500);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
    req.user = {
      id: Number(decoded.sub),
      role: decoded.role,
      email: decoded.email,
    };
    return next();
  } catch {
    throw new AppError("Sessao invalida ou expirada.", 401);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Nao autenticado.", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("Sem permissao para executar esta acao.", 403);
    }

    return next();
  };
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    sameSite: cookieSameSite,
    secure: cookieSecure,
  });
}
