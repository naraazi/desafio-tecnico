import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, requireRole } from "../auth";
import { AppError } from "../../errors/AppError";

const verifyMock = vi.fn();

vi.mock("jsonwebtoken", () => ({
  verify: (...args: unknown[]) => verifyMock(...args),
  default: { verify: (...args: unknown[]) => verifyMock(...args) },
}));

const makeResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const next = vi.fn();

describe("auth middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    next.mockReset();
    verifyMock.mockReset();
  });

  it("autoriza com cookie de auth válido", () => {
    const req: any = {
      headers: {},
      cookies: { auth_token: "token" },
    };

    verifyMock.mockReturnValue({ sub: "1", role: "admin", email: "a@a.com" });

    const res = makeResponse();
    requireAuth(req as any, res as any, next);

    expect(req.user).toMatchObject({
      id: 1,
      role: "admin",
      email: "a@a.com",
    });
    expect(next).toHaveBeenCalled();
  });

  it("autoriza com header Bearer válido", () => {
    const req: any = {
      headers: { authorization: "Bearer token" },
      cookies: {},
    };
    verifyMock.mockReturnValue({ sub: "2", role: "operator", email: "b@b.com" });

    const res = makeResponse();
    requireAuth(req as any, res as any, next);

    expect(req.user).toMatchObject({
      id: 2,
      role: "operator",
      email: "b@b.com",
    });
    expect(next).toHaveBeenCalled();
  });

  it("lança 401 se token ausente", () => {
    const req: any = { headers: {}, cookies: {} };
    const res = makeResponse();

    expect(() => requireAuth(req as any, res as any, next)).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });

  it("lança 401 se jwt inválido", () => {
    const req: any = {
      headers: { authorization: "Bearer bad" },
      cookies: {},
    };
    verifyMock.mockImplementation(() => {
      throw new Error("invalid");
    });
    const res = makeResponse();

    expect(() => requireAuth(req as any, res as any, next)).toThrow(AppError);
  });

  it("bloqueia requireRole para role não permitida", () => {
    const req: any = { user: { id: 1, role: "operator" }, headers: {} };
    const res = makeResponse();

    expect(() =>
      requireRole("admin")(req as any, res as any, next)
    ).toThrow(AppError);
  });

  it("permite requireRole para role permitida", () => {
    const req: any = { user: { id: 1, role: "admin" }, headers: {} };
    const res = makeResponse();

    requireRole("admin")(req as any, res as any, next);
    expect(next).toHaveBeenCalled();
  });
});
