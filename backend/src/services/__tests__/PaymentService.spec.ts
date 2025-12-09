import { describe, it, expect, beforeEach, vi } from "vitest";
import { PaymentService } from "../PaymentService";
import { AppError } from "../../errors/AppError";
import { Payment } from "../../entities/Payment";

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

const { s3SendMock } = vi.hoisted(() => ({ s3SendMock: vi.fn() }));
const { repoFactory } = vi.hoisted(() => ({
  repoFactory: <T>() => createRepoMock<T>(),
}));

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
      })
      .mockResolvedValueOnce({ id: 2 }); // simulando duplicado

    await expect(
      service.update(1, { description: "Novo" })
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
      })
      .mockResolvedValueOnce(null); // nenhuma duplicata
    paymentTypeRepo.findOne.mockResolvedValue({ id: 2, name: "Novo Tipo" });
    paymentRepo.save.mockImplementation(async (data) => data);

    const updated = await service.update(1, {
      date: "2025-02-10T15:30:00Z",
      description: "  Ajuste  ",
      amount: 20.567,
      paymentTypeId: 2,
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

  it("report soma total usando list", async () => {
    const listSpy = vi
      .spyOn(service as any, "list")
      .mockResolvedValue([
        { id: 1, amount: 10 } as Payment,
        { id: 2, amount: 5.5 } as Payment,
      ]);

    const result = await service.report({});

    expect(listSpy).toHaveBeenCalled();
    expect(result.total).toBe(15.5);
    expect(result.payments).toHaveLength(2);
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
