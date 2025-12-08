import { describe, it, expect, beforeEach, vi } from "vitest";
import { PaymentTypeService } from "../PaymentTypeService";
import { AppError } from "../../errors/AppError";

type RepoMock<T> = {
  findOne: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

const createRepoMock = <T>(): RepoMock<T> => ({
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
});

const { repoFactory } = vi.hoisted(() => ({
  repoFactory: <T>() => createRepoMock<T>(),
}));

let paymentTypeRepo = repoFactory<any>();

vi.mock("../../repositories/PaymentTypeRepository", () => ({
  getPaymentTypeRepository: () => paymentTypeRepo,
}));

describe("PaymentTypeService", () => {
  const service = new PaymentTypeService();

  beforeEach(() => {
    paymentTypeRepo = repoFactory<any>();
    vi.clearAllMocks();
  });

  it("cria tipo com nome normalizado", async () => {
    paymentTypeRepo.findOne.mockResolvedValue(null);
    paymentTypeRepo.create.mockImplementation((data) => data);
    paymentTypeRepo.save.mockImplementation(async (data: any) => {
      data.id = 1;
      return data;
    });

    const created = await service.create({ name: "  Combustivel  " });

    expect(paymentTypeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Combustivel" })
    );
    expect(created).toMatchObject({ id: 1, name: "Combustivel" });
  });

  it("nao permite criar nome duplicado", async () => {
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1, name: "Folha" });

    await expect(
      service.create({ name: "Folha" })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("atualiza tipo evitando duplicidade", async () => {
    paymentTypeRepo.findOne
      .mockResolvedValueOnce({ id: 1, name: "Antigo" }) // registro alvo
      .mockResolvedValueOnce({ id: 2, name: "Novo" }); // duplicado

    await expect(
      service.update(1, { name: "Novo" })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("lança erro ao atualizar inexistente", async () => {
    paymentTypeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.update(999, { name: "Teste" })
    ).rejects.toBeInstanceOf(AppError);
  });

  it("deleta tipo existente", async () => {
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1, name: "Ok" });
    paymentTypeRepo.remove.mockResolvedValue(undefined);

    await service.delete(1);

    expect(paymentTypeRepo.remove).toHaveBeenCalled();
  });
});
