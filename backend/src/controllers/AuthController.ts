import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";
import {
  authCookieName,
  cookieDomain,
  cookieMaxAgeMs,
  cookieSameSite,
  cookieSecure,
} from "../config/auth";
import { AuthenticatedRequest } from "../middlewares/auth";

const authService = new AuthService();

export class AuthController {
  async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);

      res.cookie(authCookieName, token, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: cookieMaxAgeMs,
        domain: cookieDomain,
        path: "/",
      });

      return res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  async me(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Nao autenticado." });
      }

      const profile = await authService.getProfile(req.user.id);
      return res.json({ user: profile });
    } catch (err) {
      next(err);
    }
  }

  async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      res.clearCookie(authCookieName, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        domain: cookieDomain,
        path: "/",
      });
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
