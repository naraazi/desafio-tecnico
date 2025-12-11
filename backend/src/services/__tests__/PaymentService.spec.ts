import { describe, it, expect, beforeEach, vi } from "vitest";
import { PaymentService } from "../PaymentService";
import { AppError } from "../../errors/AppError";
import { Payment } from "../../entities/Payment";

type RepoMock<T> = {
  findOne: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  createQueryBuilder: ReturnType<typeof vi.fn>;
};

const createRepoMock = <T>(): RepoMock<T> => ({
  findOne: vi.fn(),
  create: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  createQueryBuilder: vi.fn(),
});

const { s3SendMock } = vi.hoisted(() => ({ s3SendMock: vi.fn() }));
const { repoFactory } = vi.hoisted(() => ({
  repoFactory: <T>() => createRepoMock<T>(),
}));

const createQueryBuilderMock = (
  payments: Partial<Payment>[],
  totals: { count: string; amount: string }
) => {
  const clone: any = {
    select: vi.fn().mockReturnThis(),
    addSelect: vi.fn().mockReturnThis(),
    getRawOne: vi.fn().mockResolvedValue(totals),
    andWhere: vi.fn().mockReturnThis(),
    leftJoinAndSelect: vi.fn().mockReturnThis(),
  };

  const base: any = {
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getMany: vi.fn().mockResolvedValue(payments),
    clone: vi.fn().mockReturnValue(clone),
    whereCalls: [] as any[],
  };

  return { base, clone };
};

let paymentRepo = repoFactory<Payment>();
let paymentTypeRepo = repoFactory<any>();

vi.mock("../../repositories/PaymentRepository", () => ({
  getPaymentRepository: () => paymentRepo,
}));

vi.mock("../../repositories/PaymentTypeRepository", () => ({
  getPaymentTypeRepository: () => paymentTypeRepo,
}));

vi.mock("../../config/s3Client", () => ({
  s3Client: { send: s3SendMock },
  s3Bucket: "test-bucket",
  isBucketPrivate: true,
}));

describe("PaymentService", () => {
  const service = new PaymentService();

  beforeEach(() => {
    paymentRepo = repoFactory<Payment>();
    paymentTypeRepo = repoFactory<any>();
    s3SendMock.mockReset();
    vi.clearAllMocks();
  });

  it("cria pagamento normalizando data, descricao e valor", async () => {
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1, name: "Tipo" });
    paymentRepo.findOne.mockResolvedValue(null);
    paymentRepo.create.mockImplementation((data) => data);
    paymentRepo.save.mockImplementation(async (data) => ({
      ...data,
      id: 1,
    }));

    const payment = await service.create({
      date: "2025-01-20T12:00:00Z",
      paymentTypeId: 1,
      description: "  Folha Janeiro  ",
      amount: 150.987,
    });

    expect(paymentRepo.create).toHaveBeenCalledWith({
      amount: 150.99,
      date: "2025-01-20",
      description: "Folha Janeiro",
      paymentTypeId: 1,
      transactionType: "payment",
    });
    expect(payment).toMatchObject({
      id: 1,
      amount: 150.99,
      date: "2025-01-20",
      description: "Folha Janeiro",
      transactionType: "payment",
    });
  });

  it("aceita transactionType transfer e usa no filtro de duplicidade", async () => {
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1, name: "Tipo" });
    paymentRepo.findOne.mockResolvedValue(null);
    paymentRepo.create.mockImplementation((data) => data);
    paymentRepo.save.mockImplementation(async (data) => ({
      ...data,
      id: 2,
    }));

    const payment = await service.create({
      date: "2025-01-21",
      paymentTypeId: 1,
      description: "Transferencia entre contas",
      amount: 200,
      transactionType: "transfer",
    });

    expect(paymentRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ transactionType: "transfer" }),
      })
    );
    expect(paymentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ transactionType: "transfer" })
    );
    expect(payment.transactionType).toBe("transfer");
  });

  it("rejeita transactionType invalido", async () => {
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1, name: "Tipo" });
    paymentRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        date: "2025-01-22",
        paymentTypeId: 1,
        description: "Teste",
        amount: 50,
        transactionType: "bonus" as any,
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lanca erro 404 se tipo de pagamento nao existe", async () => {
    paymentTypeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        date: "2025-01-20",
        paymentTypeId: 999,
        description: "Desc",
        amount: 10,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("bloqueia pagamento duplicado com 409", async () => {
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1 });
    paymentRepo.findOne.mockResolvedValue({ id: 2 });

    await expect(
      service.create({
        date: "2025-01-20",
        paymentTypeId: 1,
        description: "Desc",
        amount: 10,
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("bloqueia update quando encontra duplicata com 409", async () => {
    paymentRepo.findOne
      .mockResolvedValueOnce({
        id: 1,
        date: "2025-01-20",
        paymentTypeId: 1,
        description: "X",
        amount: 10,
        transactionType: "payment",
      })
      .mockResolvedValueOnce({ id: 2 }); // simulando duplicado
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1 });

    await expect(
      service.update(1, {
        date: "2025-01-20",
        paymentTypeId: 1,
        description: "Novo",
        amount: 10,
        transactionType: "payment",
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("atualiza pagamento normalizando dados", async () => {
    paymentRepo.findOne
      .mockResolvedValueOnce({
        id: 1,
        date: "2025-01-20",
        paymentTypeId: 1,
        description: "Desc",
        amount: 10,
        transactionType: "payment",
      })
      .mockResolvedValueOnce(null); // nenhuma duplicata
    paymentTypeRepo.findOne.mockResolvedValue({ id: 2, name: "Novo Tipo" });
    paymentRepo.save.mockImplementation(async (data) => data);

    const updated = await service.update(1, {
      date: "2025-02-10T15:30:00Z",
      description: "  Ajuste  ",
      amount: 20.567,
      paymentTypeId: 2,
      transactionType: "payment",
    });

    expect(updated).toMatchObject({
      date: "2025-02-10",
      description: "Ajuste",
      amount: 20.57,
      paymentTypeId: 2,
    });
    expect(paymentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        date: "2025-02-10",
        description: "Ajuste",
        amount: 20.57,
        paymentTypeId: 2,
      })
    );
  });

  it("permite atualizar transactionType", async () => {
    paymentRepo.findOne
      .mockResolvedValueOnce({
        id: 1,
        date: "2025-02-01",
        paymentTypeId: 1,
        description: "Item",
        amount: 30,
        transactionType: "payment",
      })
      .mockResolvedValueOnce(null);
    paymentTypeRepo.findOne.mockResolvedValue({ id: 1 });
    paymentRepo.save.mockImplementation(async (data) => data);

    const updated = await service.update(1, {
      date: "2025-02-01",
      paymentTypeId: 1,
      description: "Item",
      amount: 30,
      transactionType: "transfer",
    });

    expect(updated.transactionType).toBe("transfer");
    expect(paymentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ transactionType: "transfer" })
    );
  });

  it("rejeita update quando faltam campos obrigatorios", async () => {
    paymentRepo.findOne.mockResolvedValue({
      id: 1,
      date: "2025-02-01",
      paymentTypeId: 1,
      description: "Item",
      amount: 30,
      transactionType: "payment",
    });

    await expect(
      // simulando payload incompleto (PUT deve enviar recurso completo)
      service.update(1, { description: "Parcial" } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("report soma total usando query builder filtrado", async () => {
    const qb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([
        { id: 1, amount: 10 } as Payment,
        { id: 2, amount: 5.5 } as Payment,
      ]),
    };
    paymentRepo.createQueryBuilder.mockReturnValue(qb as any);

    const result = await service.report({ search: "folha" });

    expect(qb.orderBy).toHaveBeenCalledWith("payment.date", "DESC");
    expect(result.total).toBe(15.5);
    expect(result.payments).toHaveLength(2);
  });

  it("lista pagamentos com paginacao, ordenacao e totais", async () => {
    const payments = [
      { id: 10, amount: 12.34 } as Payment,
      { id: 11, amount: 18.06 } as Payment,
    ];
    const qbMock = createQueryBuilderMock(payments, {
      count: "4",
      amount: "60.40",
    });
    paymentRepo.createQueryBuilder.mockReturnValue(qbMock.base as any);

    const result = await service.list({
      page: 2,
      pageSize: 2,
      sortBy: "amount",
      sortOrder: "asc",
      search: "pago",
    });

    expect(paymentRepo.createQueryBuilder).toHaveBeenCalled();
    expect(qbMock.base.orderBy).toHaveBeenCalledWith("payment.amount", "ASC");
    expect(qbMock.base.skip).toHaveBeenCalledWith(2); // (page 2 - 1) * 2
    expect(result.pagination.totalItems).toBe(4);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.totals.overallAmount).toBe(60.4);
    expect(result.totals.pageAmount).toBe(30.4);
  });

  it("aplica busca case-insensitive e ordenacao padrao por data DESC", async () => {
    const qbMock = createQueryBuilderMock([], { count: "0", amount: "0" });
    paymentRepo.createQueryBuilder.mockReturnValue(qbMock.base as any);

    await service.list({ search: " Folha " });

    expect(qbMock.base.orderBy).toHaveBeenCalledWith("payment.date", "DESC");
    expect(qbMock.base.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("LOWER(payment.description)"),
      expect.objectContaining({ search: "%folha%" })
    );
  });

  it("aceita search vindo como array (duplicado na querystring)", async () => {
    const qbMock = createQueryBuilderMock([], { count: "0", amount: "0" });
    paymentRepo.createQueryBuilder.mockReturnValue(qbMock.base as any);

    await service.list({ search: ["Luigi", "Luigi"] as any });

    expect(qbMock.base.andWhere).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ search: "%luigi%" })
    );
  });

  it("clampa pagina quando solicitada acima do total disponivel", async () => {
    const qbMock = createQueryBuilderMock([{ id: 1 } as Payment], {
      count: "1",
      amount: "100.00",
    });
    paymentRepo.createQueryBuilder.mockReturnValue(qbMock.base as any);

    await service.list({ page: 5, pageSize: 10 });

    expect(qbMock.base.skip).toHaveBeenCalledWith(0); // volta para pagina 1
    expect(qbMock.base.take).toHaveBeenCalledWith(10);
  });

  it("remove comprovante ao deletar pagamento com receiptPath", async () => {
    paymentRepo.findOne.mockResolvedValue({
      id: 1,
      receiptPath: "receipts/1/file.pdf",
    });
    paymentRepo.remove.mockResolvedValue(undefined);

    await service.delete(1);

    expect(s3SendMock).toHaveBeenCalled();
    expect(paymentRepo.remove).toHaveBeenCalled();
  });
});
