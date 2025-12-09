import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthService } from "../AuthService";
import { AppError } from "../../errors/AppError";
import { User, UserRole } from "../../entities/User";

type RepoMock<T> = {
  findOne: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
};

const createRepoMock = <T>(): RepoMock<T> => ({
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
});

let userRepo = createRepoMock<User>();

vi.mock("../../repositories/UserRepository", () => ({
  getUserRepository: () => userRepo,
}));

describe("AuthService", () => {
  const service = new AuthService();

  beforeEach(() => {
    userRepo = createRepoMock<User>();
    vi.clearAllMocks();
  });

  it("loga com credenciais válidas e retorna token + usuário sem hash", async () => {
    userRepo.findOne.mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@email.com",
      passwordHash: await (await import("bcryptjs")).hash("secret", 10),
      role: "admin",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
    } satisfies User);

    const result = await service.login("admin@email.com", "secret");

    expect(result.user).toMatchObject({
      id: 1,
      name: "Admin",
      email: "admin@email.com",
      role: "admin",
    });
    expect((result as any).user.passwordHash).toBeUndefined();
    expect(result.token).toBeTypeOf("string");
  });

  it("falha login com credenciais inválidas", async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(service.login("x@y.com", "wrong")).rejects.toBeInstanceOf(
      AppError
    );
  });

  it("falha se JWT_SECRET não está configurado ao assinar token", async () => {
    vi.resetModules();
    vi.doMock("../../repositories/UserRepository", () => ({
      getUserRepository: () => userRepo,
    }));
    vi.doMock("../../config/auth", () => ({
      authCookieName: "auth_token",
      jwtSecret: "",
      jwtExpiresIn: "1d",
      cookieMaxAgeMs: 1000,
      isProd: false,
      cookieDomain: undefined,
      cookieSameSite: "lax",
      cookieSecure: false,
    }));

    const { AuthService: FreshAuthService } = await import("../AuthService");
    const freshService = new FreshAuthService();

    userRepo.findOne.mockResolvedValue({
      id: 1,
      name: "Admin",
      email: "admin@email.com",
      passwordHash: await (await import("bcryptjs")).hash("secret", 10),
      role: "admin",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
    } satisfies User);

    await expect(
      freshService.login("admin@email.com", "secret")
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "JWT_SECRET nao configurado.",
    });

    vi.resetModules();
  });

  it("cria usuário novo com email normalizado e retorna sem hash", async () => {
    userRepo.findOne.mockResolvedValue(null);
    userRepo.create.mockImplementation((data) => ({ id: 10, ...data }));
    userRepo.save.mockImplementation(async (user) => user);

    const user = await service.createUser({
      name: "  Jane Doe ",
      email: " TESTE@EMAIL.COM ",
      password: "123456",
      role: "operator" as UserRole,
    });

    expect(userRepo.create).toHaveBeenCalled();
    expect(user).toMatchObject({
      id: 10,
      name: "Jane Doe",
      email: "teste@email.com",
      role: "operator",
    });
    expect((user as any).passwordHash).toBeUndefined();
  });

  it("impede criar usuário com email duplicado", async () => {
    userRepo.findOne.mockResolvedValue({
      id: 1,
      name: "Existente",
      email: "exists@email.com",
      passwordHash: "hash",
      role: "admin",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
    } satisfies User);

    await expect(
      service.createUser({
        name: "Novo",
        email: "exists@email.com",
        password: "123456",
        role: "operator",
      })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("getProfile retorna usuário sanitizado", async () => {
    userRepo.findOne.mockResolvedValue({
      id: 2,
      name: "User",
      email: "u@email.com",
      passwordHash: "hash",
      role: "operator",
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
    } satisfies User);

    const user = await service.getProfile(2);

    expect(user).toEqual({
      id: 2,
      name: "User",
      email: "u@email.com",
      role: "operator",
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect((user as any).passwordHash).toBeUndefined();
  });
});
