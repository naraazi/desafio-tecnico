import { describe, it, expect, beforeEach, vi } from "vitest";
import { PaymentTypeService } from "../PaymentTypeService";
import { AppError } from "../../errors/AppError";

type RepoMock<T> = {
  findOne: ReturnType<typeof vi.fn>;
  find: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  createQueryBuilder: ReturnType<typeof vi.fn>;
};

const createRepoMock = <T>(): RepoMock<T> => ({
  findOne: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  count: vi.fn(),
  createQueryBuilder: vi.fn(),
});

const { repoFactory } = vi.hoisted(() => ({
  repoFactory: <T>() => createRepoMock<T>(),
}));

let paymentTypeRepo = repoFactory<any>();
let paymentRepo = repoFactory<any>();

vi.mock("../../repositories/PaymentTypeRepository", () => ({
  getPaymentTypeRepository: () => paymentTypeRepo,
}));

vi.mock("../../repositories/PaymentRepository", () => ({
  getPaymentRepository: () => paymentRepo,
}));

describe("PaymentTypeService", () => {
  const service = new PaymentTypeService();

  beforeEach(() => {
    paymentTypeRepo = repoFactory<any>();
    paymentRepo = repoFactory<any>();
    paymentRepo.count.mockResolvedValue(0);
    vi.clearAllMocks();
  });

  it("cria tipo com nome normalizado", async () => {
    paymentTypeRepo.findOne.mockResolvedValue(null);
    paymentTypeRepo.create.mockImplementation((data) => data);
    paymentTypeRepo.save.mockImplementation(async (data: any) => {
      data.id = 1;
      return data;
    });

    const created = await service.create({ name: "  Combustível  " });

    expect(paymentTypeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Combustível" })
    );
    expect(created).toMatchObject({ id: 1, name: "Combustível" });
  });

  it("não permite criar nome duplicado", async () => {
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1, name: "Folha" });

    await expect(service.create({ name: "Folha" })).rejects.toBeInstanceOf(
      AppError
    );
  });

  it("marca tipos em uso ao listar", async () => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([
        { paymentTypeId: 1, count: "2" },
        { paymentTypeId: 3, count: "0" },
      ]),
    };

    paymentRepo.createQueryBuilder.mockReturnValue(qb as any);
    paymentTypeRepo.find.mockResolvedValue([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ]);

    const result = await service.list();

    expect(result).toMatchObject([
      { id: 1, name: "A", inUse: true },
      { id: 2, name: "B", inUse: false },
    ]);
    expect(qb.getRawMany).toHaveBeenCalled();
  });

  it("atualiza tipo evitando duplicidade", async () => {
    paymentTypeRepo.findOne
      .mockResolvedValueOnce({ id: 1, name: "Antigo" }) // registro alvo
      .mockResolvedValueOnce({ id: 2, name: "Novo" }); // duplicado
    paymentRepo.count.mockResolvedValue(0);

    await expect(service.update(1, { name: "Novo" })).rejects.toBeInstanceOf(
      AppError
    );
  });

  it("não permite atualizar tipo em uso", async () => {
    paymentTypeRepo.findOne
      .mockResolvedValueOnce({ id: 1, name: "Antigo" })
      .mockResolvedValueOnce(null);
    paymentRepo.count.mockResolvedValue(2);

    await expect(service.update(1, { name: "Novo" })).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(paymentTypeRepo.save).not.toHaveBeenCalled();
  });

  it("lança erro ao atualizar inexistente", async () => {
    paymentTypeRepo.findOne.mockResolvedValue(null);

    await expect(service.update(999, { name: "Teste" })).rejects.toBeInstanceOf(
      AppError
    );
  });

  it("deleta tipo existente", async () => {
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1, name: "Ok" });
    paymentTypeRepo.remove.mockResolvedValue(undefined);
    paymentRepo.count.mockResolvedValue(0);

    await service.delete(1);

    expect(paymentTypeRepo.remove).toHaveBeenCalled();
  });

  it("nao permite deletar tipo em uso", async () => {
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1, name: "Ok" });
    paymentRepo.count.mockResolvedValue(3);

    await expect(service.delete(1)).rejects.toMatchObject({ statusCode: 409 });
    expect(paymentTypeRepo.remove).not.toHaveBeenCalled();
  });
});
